"use client";

import { useActionState } from "react";

import { createNewsPost } from "@/lib/actions/news-actions";
import { Input, Textarea, FormMessage } from "@/components/ui";
import type { NewsFormState } from "@/lib/actions/news-actions";

export function NewsForm() {
  const [state, formAction, pending] = useActionState<NewsFormState, FormData>(
    createNewsPost,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <Input label="Заголовок" name="title" required placeholder="Например: Субботник в парке Горького" />
      <Input
        label="Короткий адрес (slug)"
        name="slug"
        required
        placeholder="subbotnik-v-parke"
      />
      <Textarea
        label="Анонс (1–2 предложения)"
        name="excerpt"
        rows={2}
        placeholder="Короткое описание для списка новостей"
      />
      <Textarea
        label="Текст новости"
        name="content"
        required
        rows={8}
        placeholder={"Пишите текст новости. Абзацы разделяются пустыми строками."}
      />

      <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
        <input type="checkbox" name="published" defaultChecked className="accent-emerald-600" />
        Опубликовать сразу
      </label>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Сохраняем..." : "Создать новость"}
      </button>
    </form>
  );
}