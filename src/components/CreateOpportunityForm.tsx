"use client";

import { useActionState } from "react";

import { createOpportunity } from "@/lib/actions/opportunity-actions";
import { Input, Textarea, Select, FormMessage } from "@/components/ui";
import type { OpportunityFormState } from "@/lib/actions/opportunity-actions";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/constants";

export function CreateOpportunityForm({ minDate }: { minDate: string }) {
  const [state, formAction, pending] = useActionState<
    OpportunityFormState,
    FormData
  >(createOpportunity, undefined);

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <Input
        label="Название заявки"
        name="title"
        required
        placeholder="Например: Помощь в приюте «Доброе сердце»"
      />

      <Textarea
        label="Описание"
        name="description"
        required
        rows={5}
        placeholder="Что нужно сделать, кому помогаем, какие условия — чем подробнее, тем лучше"
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Направление"
          name="category"
          required
          defaultValue={CATEGORY_ORDER[0]}
          options={CATEGORY_ORDER.map((key) => ({
            value: key,
            label: CATEGORY_LABELS[key],
          }))}
        />

        <Input label="Город" name="city" required placeholder="Например: Минск" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Дата" name="date" type="date" required min={minDate} defaultValue={minDate} />
        <Input label="Сколько волонтёров нужно" name="slots" type="number" min={1} max={1000} defaultValue="5" required />
      </div>

      <Input label="Адрес (по желанию)" name="address" placeholder="Как нас найти" />

      <Textarea
        label="Требования (по одному на строку)"
        name="requirements"
        rows={3}
        placeholder={"Например:\nВозраст от 18 лет\nСменная обувь"}
      />

      <Input
        label="Контакты для связи (по желанию)"
        name="contactInfo"
        placeholder="Телефон, Telegram, email"
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Публикуем..." : "Опубликовать заявку"}
      </button>
    </form>
  );
}