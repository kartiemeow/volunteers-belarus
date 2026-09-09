"use client";

import { useActionState } from "react";

import { rescheduleOpportunity } from "@/lib/actions/organizer-actions";
import { Input, FormMessage } from "@/components/ui";
import type { OpportunityFormState } from "@/lib/actions/opportunity-actions";

export function RescheduleOpportunityForm({
  opportunityId,
  currentDate,
}: {
  opportunityId: string;
  currentDate: string;
}) {
  const [state, formAction, pending] = useActionState<
    OpportunityFormState,
    FormData
  >(rescheduleOpportunity, undefined);

  return (
    <form action={formAction} className="space-y-3">
      <FormMessage state={state} />
      <input type="hidden" name="id" value={opportunityId} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Input
          label="Новая дата и время (Минск)"
          name="date"
          type="datetime-local"
          defaultValue={currentDate}
          required
        />
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {pending ? "Сохраняем..." : "Изменить дату"}
          </button>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Волонтёры, которые откликнулись на заявку, получат уведомление об изменении
        даты и смогут подтвердить участие или отказаться.
      </p>
    </form>
  );
}