"use client";

import { useState } from "react";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { applyToOpportunity } from "@/lib/actions/application-actions";
import { Textarea, FormMessage } from "@/components/ui";
import { ConfettiBurst } from "@/components/ConfettiBurst";
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
  const router = useRouter();
  const [closed, setClosed] = useState(false);
  const success = state?.success;
  const showPopup = success && !closed;

  const closePopup = () => {
    setClosed(true);
    router.refresh();
  };

  return (
    <>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="opportunityId" value={opportunityId} />
        {showPopup ? null : <FormMessage state={state} />}
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
      {showPopup && (
        <ConfettiBurst message={success} onClose={closePopup} />
      )}
    </>
  );
}

export function NeedLogin({ opportunityId }: { opportunityId: string }) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Чтобы откликнуться на заявку, нужно войти в аккаунт волонтёра.
      </p>
      <a
        href={`/login?next=${encodeURIComponent(`/zayavki/${opportunityId}`)}`}
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
      Набор на эту заявку недоступен: событие прошло, набор закрыт или все места заняты.
    </div>
  );
}

export function OrganizerView() {
  return (
    <div className="rounded-xl bg-gray-100 px-5 py-4 text-sm font-medium text-gray-600">
      Откликаться на заявки могут только волонтёры. Организаторы управляют своими заявками в личном кабинете.
    </div>
  );
}