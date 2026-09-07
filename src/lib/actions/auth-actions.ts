"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { auth, signIn } from "@/lib/auth";
import type { Role } from "@/generated/prisma/client";
import {
  CODE_TTL_MS,
  MAX_ATTEMPTS,
  RESEND_COOLDOWN_MS,
  codesEqual,
  generateVerificationCode,
  hashVerificationCode,
  sendVerificationEmail,
} from "@/lib/email";

const registerSchema = z.object({
  name: z.string().min(2, "Введите имя (минимум 2 символа)"),
  email: z.string().email("Введите корректный email"),
  password: z.string().min(8, "Пароль должен быть не короче 8 символов"),
  role: z.enum(["VOLUNTEER", "ORGANIZER"]),
  phone: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
});

export type RegisterState =
  | { error: string }
  | { success: string }
  | { message: string }
  | undefined;

async function sendVerificationCode(
  email: string,
  pending?: {
    name: string;
    passwordHash: string;
    role: Role;
    phone: string | null;
    city: string | null;
  }
): Promise<{ error?: string }> {
  const code = generateVerificationCode();
  const codeHash = hashVerificationCode(code);

  await db.emailVerification.upsert({
    where: { email },
    update: {
      codeHash,
      attempts: 0,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      createdAt: new Date(),
    },
    create: {
      email,
      codeHash,
      expiresAt: new Date(Date.now() + CODE_TTL_MS),
      name: pending?.name ?? "",
      passwordHash: pending?.passwordHash ?? "",
      role: pending?.role ?? "VOLUNTEER",
      phone: pending?.phone,
      city: pending?.city,
    },
  });

  try {
    await sendVerificationEmail(email, code);
  } catch (cause) {
    console.error(
      `[email] Не удалось отправить код на ${email}:`,
      cause instanceof Error ? cause.message : cause
    );
    return { error: "Не удалось отправить письмо. Попробуйте ещё раз позже." };
  }
  return {};
}

export async function registerUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверьте правильность заполнения полей.",
    };
  }

  const { name, email, password, role, phone, city } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { error: "Пользователь с таким email уже зарегистрирован" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const sendResult = await sendVerificationCode(email.toLowerCase(), {
    name: name.trim(),
    passwordHash: hashedPassword,
    role: role as Role,
    phone: phone || null,
    city: city || null,
  });
  if (sendResult.error) {
    return { error: sendResult.error };
  }

  redirect(`/register/verify?email=${encodeURIComponent(email.toLowerCase())}`);
}

export async function verifyEmailAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const code = String(formData.get("code") ?? "").trim();

  if (!email || !code) {
    return { error: "Введите код из письма" };
  }

  const verification = await db.emailVerification.findUnique({ where: { email } });
  if (!verification) {
    return { error: "Регистрация не найдена. Зарегистрируйтесь заново." };
  }
  if (Date.now() > verification.expiresAt.getTime()) {
    return { error: "Срок действия кода истёк. Запросите новый код." };
  }
  if (verification.attempts >= MAX_ATTEMPTS) {
    return { error: "Слишком много неудачных попыток. Запросите новый код." };
  }

  if (!codesEqual(verification.codeHash, hashVerificationCode(code))) {
    await db.emailVerification.update({
      where: { email },
      data: { attempts: { increment: 1 } },
    });
    const left = MAX_ATTEMPTS - (verification.attempts + 1);
    return {
      error:
        left > 0
          ? `Неверный код. Осталось попыток: ${left}.`
          : "Слишком много неудачных попыток. Запросите новый код.",
    };
  }

  let userId: string;
  try {
    const user = await db.user.create({
      data: {
        name: verification.name,
        email,
        password: verification.passwordHash,
        role: verification.role,
        phone: verification.phone,
        city: verification.city,
        emailVerified: new Date(),
      },
    });
    userId = user.id;
  } catch (err) {
    const prismaErr = err as { code?: string };
    if (prismaErr.code === "P2002") {
      return { error: "Пользователь с таким email уже зарегистрирован" };
    }
    throw err;
  }

  if (verification.role === "VOLUNTEER") {
    await db.volunteerProfile.create({ data: { userId } });
  } else {
    await db.organizationProfile.create({
      data: {
        userId,
        orgName: verification.name,
      },
    });
  }

  await db.emailVerification.delete({ where: { email } });

  redirect(`/login?verified=${encodeURIComponent(email)}`);
}

export async function resendVerificationAction(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  if (!email) {
    return { error: "Укажите email" };
  }

  const existing = await db.emailVerification.findUnique({ where: { email } });
  if (
    existing &&
    Date.now() - existing.createdAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    const secondsLeft = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - existing.createdAt.getTime())) / 1000
    );
    return { error: `Подождите ${secondsLeft} сек. перед повторной отправкой` };
  }

  const sendResult = await sendVerificationCode(email, {
    name: existing?.name ?? "",
    passwordHash: existing?.passwordHash ?? "",
    role: existing?.role ?? "VOLUNTEER",
    phone: existing?.phone ?? null,
    city: existing?.city ?? null,
  });
  if (sendResult.error) {
    return { error: sendResult.error };
  }
  return { success: "Код отправлен заново. Проверьте почту." };
}

export async function loginUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");
  const remember = formData.get("remember") === "1";

  const existingUser = await db.user.findUnique({ where: { email } });
  if (!existingUser) {
    const pending = await db.emailVerification.findUnique({ where: { email } });
    if (pending) {
      redirect(`/register/verify?email=${encodeURIComponent(email)}`);
    }
  }

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    throw error;
  }

  const proto = (await headers()).get("x-forwarded-proto") ?? "http";
  const cookieStore = await cookies();
  const sessionCookie = cookieStore
    .getAll()
    .find((c) => c.name.includes("session-token"));
  if (sessionCookie) {
    cookieStore.set(sessionCookie.name, sessionCookie.value, {
      httpOnly: true,
      sameSite: "lax",
      secure: proto === "https",
      path: "/",
      ...(remember ? { maxAge: 30 * 24 * 60 * 60 } : {}),
    });
  }

  const session = await auth();
  const roleHome =
    session?.user.role === "ORGANIZER"
      ? "/organizer"
      : session?.user.role === "VOLUNTEER"
        ? "/volunteer"
        : session?.user.role === "ADMIN"
          ? "/admin"
          : "/";

  if (next && next.startsWith("/") && !next.startsWith("//")) {
    redirect(next);
  }
  redirect(roleHome);
}
