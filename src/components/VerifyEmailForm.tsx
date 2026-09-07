"use client";

import { useActionState } from "react";
import Link from "next/link";

import {
  resendVerificationAction,
  verifyEmailAction,
} from "@/lib/actions/auth-actions";
import { Input, FormMessage } from "@/components/ui";
import type { RegisterState } from "@/lib/actions/auth-actions";

export default function VerifyEmailForm({ email }: { email: string }) {
  const [verifyState, verifyAction, verifyPending] = useActionState<
    RegisterState,
    FormData
  >(verifyEmailAction, undefined);

  const [resendState, resendAction, resendPending] = useActionState<
    RegisterState,
    FormData
  >(resendVerificationAction, undefined);

  return (
    <div className="space-y-5">
      <FormMessage state={verifyState} />
      <FormMessage state={resendState} />

      <form action={verifyAction} className="space-y-5">
        <input type="hidden" name="email" value={email} />
        <Input
          label="Код подтверждения"
          name="code"
          inputMode="numeric"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="6 цифр из письма"
          required
          autoComplete="one-time-code"
          autoFocus
        />
        <button
          type="submit"
          disabled={verifyPending}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
        >
          {verifyPending ? "Проверяем..." : "Подтвердить"}
        </button>
      </form>

      <form action={resendAction} className="space-y-3">
        <input type="hidden" name="email" value={email} />
        <button
          type="submit"
          disabled={resendPending}
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
        >
          {resendPending ? "Отправляем..." : "Отправить код ещё раз"}
        </button>
      </form>

      <p className="text-center text-sm text-gray-600">
        Не регистрировались?{" "}
        <Link href="/register" className="font-medium text-emerald-600 hover:underline">
          Регистрация
        </Link>
      </p>
    </div>
  );
}