"use client";

import { useActionState } from "react";
import { applyToOpportunity } from "@/lib/actions/application-actions";
import { Textarea, FormMessage } from "@/components/ui";
import type { ApplicationState } from "@/lib/actions/application-actions";

export function ApplyButton({
  opportunityId,
}: {
  opportunityId: string;
}) {
  const [state, formAction, pending] = useActionState<ApplicationState, FormData>(
    applyToOpportunity,
    undefined
  );

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <FormMessage state={state} />
      <div>
        <Textarea
          label="Сообщение организатору (необязательно)"
          name="message"
          placeholder="Коротко расскажите, почему хотите помочь: опыт, доступное время, транспорт..."
          rows={3}
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
      >
        {pending ? "Отправляем..." : "Откликнуться"}
      </button>
    </form>
  );
}

export function NeedLogin() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Чтобы откликнуться на заявку, нужно войти в аккаунт волонтёра.
      </p>
      <a
        href="/login"
        className="block w-full rounded-xl bg-emerald-600 px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        Войти или зарегистрироваться
      </a>
    </div>
  );
}

export function AlreadyApplied() {
  return (
    <div className="rounded-xl bg-green-50 px-5 py-4 text-sm font-medium text-green-700">
      ✓ Вы уже откликнулись на эту заявку. Статус можно отслеживать в личном
      кабинете.
    </div>
  );
}

export function NoSlots() {
  return (
    <div className="rounded-xl bg-gray-100 px-5 py-4 text-sm font-medium text-gray-600">
      Все места на эту заявку уже заняты.
    </div>
  );
}

export function OrganizerView() {
  return (
    <div className="rounded-xl bg-gray-100 px-5 py-4 text-sm font-medium text-gray-600">
      Это ваша заявка. Управлять откликами можно в личном кабинете организатора.
    </div>
  );
}