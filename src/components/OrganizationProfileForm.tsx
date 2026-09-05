"use client";

import { useActionState } from "react";

import { updateOrganizationProfile } from "@/lib/actions/profile-actions";
import { Input, Textarea, FormMessage } from "@/components/ui";
import type { ProfileState } from "@/lib/actions/profile-actions";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/constants";

export function OrganizationProfileForm({
  orgName,
  description,
  website,
  categories,
}: {
  orgName: string;
  description: string;
  website: string;
  categories: string[];
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateOrganizationProfile,
    undefined
  );

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <Input label="Название организации" name="orgName" required defaultValue={orgName} />
      <Textarea
        label="О вашей организации"
        name="description"
        placeholder="Чем занимаетесь, сколько лет, где работаете"
        defaultValue={description}
        rows={4}
      />
      <Input label="Сайт" name="website" defaultValue={website} placeholder="https://" />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          Направления работы
        </span>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_ORDER.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
            >
              <input
                type="checkbox"
                name="categories"
                value={key}
                defaultChecked={categories.includes(key)}
                className="accent-emerald-600"
              />
              {CATEGORY_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60 sm:w-auto sm:px-8"
      >
        {pending ? "Сохраняем..." : "Сохранить"}
      </button>
    </form>
  );
}