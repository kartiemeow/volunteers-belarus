"use client";

import { useActionState } from "react";
import Link from "next/link";

import { loginUser } from "@/lib/actions/auth-actions";
import { Input, FormMessage } from "@/components/ui";
import type { RegisterState } from "@/lib/actions/auth-actions";

export default function LoginForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<RegisterState, FormData>(
    loginUser,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      {next && <input type="hidden" name="next" value={next} />}

      <div className="space-y-4">
        <Input label="Email" name="email" type="email" required autoComplete="email" placeholder="you@example.com" />
        <Input label="Пароль" name="password" type="password" required autoComplete="current-password" placeholder="Ваш пароль" />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Входим..." : "Войти"}
      </button>

      <p className="text-center text-sm text-gray-600">
        Нет аккаунта?{" "}
        <Link href="/register" className="font-medium text-emerald-600 hover:underline">
          Зарегистрироваться
        </Link>
      </p>
    </form>
  );
}