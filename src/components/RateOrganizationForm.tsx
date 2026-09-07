"use client";

import { useState } from "react";
import { useActionState } from "react";
import { submitRating, type RatingState } from "@/lib/actions/rating-actions";
import { FormMessage } from "@/components/ui";
import { IconStar } from "@/components/icons";

export default function RateOrganizationForm({
  applicationId,
  orgName,
  opportunityTitle,
}: {
  applicationId: string;
  orgName: string;
  opportunityTitle: string;
}) {
  const [score, setScore] = useState(5);
  const [state, formAction] = useActionState<RatingState, FormData>(
    submitRating,
    undefined
  );

  const SCORE_LABELS = ["1 — ужасно", "2 — плохо", "3 — нормально", "4 — хорошо", "5 — отлично"];

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-8">
        <h1 className="text-2xl font-bold text-gray-900">Оцените организацию</h1>
        <p className="mt-2 text-sm text-gray-600">
          Вы помогали на заявке «{opportunityTitle}». Как вы оцените работу
          организации «{orgName}»?
        </p>

        <form action={formAction} className="mt-6 space-y-6">
          <input type="hidden" name="applicationId" value={applicationId} />

          <div>
            <span className="mb-2 block text-sm font-medium text-gray-700">
              Ваша оценка
            </span>
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setScore(value)}
                    aria-label={`Оценка ${value}`}
                    className="transition-colors"
                  >
                    <IconStar
                      className={`h-9 w-9 ${
                        value <= score
                          ? "text-amber-400"
                          : "text-gray-300 hover:text-amber-200"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {SCORE_LABELS[score - 1]}
              </span>
            </div>
            <input type="hidden" name="score" value={score} />
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-gray-700">
              Комментарий (необязательно)
            </span>
            <textarea
              name="comment"
              rows={4}
              placeholder="Что понравилось, как организована помощь..."
              className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </label>

          <FormMessage state={state} />

          {state?.success ? (
            <a
              href="/volunteer?tab=moe-zayavki"
              className=" block w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Вернуться в кабинет
            </a>
          ) : (
            <button
              type="submit"
              className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Отправить оценку
            </button>
          )}
        </form>
      </div>
    </div>
  );
}