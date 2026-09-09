"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { sendVerificationEmail } from "@/lib/email";
import { prepareRegistrationCode, completeRegistration } from "@/lib/registration";
import { allowAuthRequest } from "@/lib/rate-limit";
import { actionError } from "@/lib/action-result";

const emailSchema = z.string().trim().toLowerCase().email("Введите корректный email").max(254);
const registerSchema = z.object({
  name: z.string().trim().min(2, "Введите имя (минимум 2 символа)").max(150),
  email: emailSchema,
  password: z.string().min(8, "Пароль должен быть не короче 8 символов").max(72),
  role: z.enum(["VOLUNTEER", "ORGANIZER"]),
  phone: z.string().max(50).optional(),
  city: z.string().max(150).optional(),
});
export type RegisterState = { error?: string; success?: string; message?: string } | undefined;

async function deliverCode(email: string, code: string): Promise<RegisterState> {
  try {
    await sendVerificationEmail(email, code);
  } catch {
    return { error: "Не удалось отправить письмо. Повторите отправку через минуту." };
  }
}

export async function registerUser(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Проверьте данные" };
  const { email, name, password, role, phone, city } = parsed.data;
  try {
    if (!await allowAuthRequest("verification-send", email, await headers())) return { error: "Слишком много запросов. Попробуйте через 15 минут." };
    const code = await prepareRegistrationCode(email, {
      name, passwordHash: await bcrypt.hash(password, 10), role, phone: phone || null, city: city || null,
    });
    const error = await deliverCode(email, code);
    if (error) return error;
  } catch (error) { return actionError(error); }
  redirect(`/register/verify?email=${encodeURIComponent(email)}`);
}

export async function verifyEmailAction(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const code = String(formData.get("code") ?? "").trim();
  if (!email.success || !/^\d{6}$/.test(code)) return { error: "Введите email и шестизначный код из письма" };
  try {
    if (!await allowAuthRequest("verification-check", email.data, await headers())) return { error: "Слишком много запросов. Попробуйте через 15 минут." };
    const result = await completeRegistration(email.data, code);
    if (result.error) return result;
  } catch (error) { return actionError(error); }
  redirect(`/login?verified=${encodeURIComponent(email.data)}`);
}

export async function resendVerificationAction(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { error: "Укажите корректный email" };
  try {
    if (!await allowAuthRequest("verification-send", email.data, await headers())) return { error: "Слишком много запросов. Попробуйте через 15 минут." };
    const code = await prepareRegistrationCode(email.data);
    const error = await deliverCode(email.data, code);
    return error ?? { success: "Код отправлен заново. Проверьте почту." };
  } catch (error) { return actionError(error); }
}

export async function loginUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
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

  const roleHome =
    existingUser?.role === "ORGANIZER"
      ? "/organizer"
      : existingUser?.role === "VOLUNTEER"
        ? "/volunteer"
        : existingUser?.role === "ADMIN"
          ? "/admin"
          : "/";

  if (next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\")) {
    redirect(next);
  }
  redirect(roleHome);
}
