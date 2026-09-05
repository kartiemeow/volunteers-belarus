"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerUser } from "@/lib/actions/auth-actions";
import { Input, FormMessage } from "@/components/ui";
import type { RegisterState } from "@/lib/actions/auth-actions";

export default function RegisterForm({
  initialRole = "VOLUNTEER",
}: {
  initialRole?: "VOLUNTEER" | "ORGANIZER";
}) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    registerUser,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Кто вы?
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 p-3 text-sm font-medium text-gray-700 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700">
              <input type="radio" name="role" value="VOLUNTEER" defaultChecked={initialRole === "VOLUNTEER"} className="accent-emerald-600" />
              Волонтёр
            </label>
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-gray-300 p-3 text-sm font-medium text-gray-700 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50 has-[:checked]:text-emerald-700">
              <input type="radio" name="role" value="ORGANIZER" defaultChecked={initialRole === "ORGANIZER"} className="accent-emerald-600" />
              Организация
            </label>
          </div>
        </div>

        <Input label="Имя / Название организации" name="name" required placeholder="Как к вам обращаться" />
        <Input label="Email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        <Input label="Пароль" name="password" type="password" required autoComplete="new-password" placeholder="Минимум 8 символов" />
        <Input label="Телефон (необязательно)" name="phone" type="tel" placeholder="+375 ..." />
        <Input label="Город (необязательно)" name="city" placeholder="Минск" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Создаём аккаунт..." : "Зарегистрироваться"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Уже есть аккаунт?{" "}
        <Link href="/login" className="font-medium text-emerald-600 hover:underline">
          Войти
        </Link>
      </p>
    </form>
  );
}
