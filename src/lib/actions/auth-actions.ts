"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { db } from "@/lib/db";
import { auth, signIn } from "@/lib/auth";
import type { Role } from "@/generated/prisma/client";

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

export async function registerUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const raw = Object.fromEntries(formData.entries());
  const parsed = registerSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверьте правильность данных",
    };
  }

  const { name, email, password, role, phone, city } = parsed.data;

  const existing = await db.user.findUnique({
    where: { email: email.toLowerCase() },
  });
  if (existing) {
    return { error: "Пользователь с таким email уже существует" };
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: role as Role,
      phone: phone || null,
      city: city || null,
    },
  });

  if (role === "VOLUNTEER") {
    await db.volunteerProfile.create({ data: { userId: user.id } });
  } else {
    await db.organizationProfile.create({
      data: {
        userId: user.id,
        orgName: name.trim(),
      },
    });
  }

  await signIn("credentials", {
    email: email.toLowerCase(),
    password,
    redirect: false,
  });

  redirect(role === "ORGANIZER" ? "/organizer" : "/");
}

export async function loginUser(
  prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Неверный email или пароль" };
    }
    throw error;
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
