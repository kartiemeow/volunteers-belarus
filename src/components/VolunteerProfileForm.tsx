"use client";

import { useActionState, useState } from "react";

import { updateVolunteerProfile } from "@/lib/actions/profile-actions";
import {
  Input,
  Textarea,
  PhoneInput,
  CityInput,
  FormMessage,
} from "@/components/ui";
import type { ProfileState } from "@/lib/actions/profile-actions";
import { CATEGORY_ORDER, CATEGORY_LABELS } from "@/lib/constants";

const AVAILABILITY_OPTIONS = [
  "будни утро",
  "будни день",
  "будни вечер",
  "выходные утро",
  "выходные день",
  "выходные вечер",
] as const;

export function VolunteerProfileForm({
  name,
  phone,
  city,
  bio,
  skills,
  interests,
  availability,
}: {
  name: string;
  phone: string;
  city: string;
  bio: string;
  skills: string[];
  interests: string[];
  availability: string[];
}) {
  const [state, formAction, pending] = useActionState<ProfileState, FormData>(
    updateVolunteerProfile,
    undefined
  );
  const [selected, setSelected] = useState<string[]>(availability);

  const toggle = (opt: string) => {
    setSelected((prev) =>
      prev.includes(opt) ? prev.filter((x) => x !== opt) : [...prev, opt]
    );
  };

  return (
    <form action={formAction} className="space-y-5">
      <FormMessage state={state} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input label="Имя" name="name" required defaultValue={name} />
        <PhoneInput label="Телефон" name="phone" defaultValue={phone} />
      </div>
      <CityInput label="Город" name="city" defaultValue={city} />

      <Textarea
        label="О себе"
        name="bio"
        placeholder="Пара слов о том, почему вы волонтёрите"
        defaultValue={bio}
        rows={3}
      />

      <Textarea
        label="Навыки"
        name="skills"
        placeholder="Например: вождение, фото, первая помощь, англ. язык"
        defaultValue={skills.join(", ")}
        rows={2}
      />

      <div>
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          Интересующие направления
        </span>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORY_ORDER.map((key) => (
            <label
              key={key}
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50"
            >
              <input
                type="checkbox"
                name="interests"
                value={key}
                defaultChecked={interests.includes(key)}
                className="accent-emerald-600"
              />
              {CATEGORY_LABELS[key]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-1.5 block text-sm font-medium text-gray-700">
          Доступность
        </span>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((opt) => {
            const active = selected.includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => toggle(opt)}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-gray-300 bg-white text-gray-700 hover:border-emerald-400 hover:bg-emerald-50"
                }`}
              >
                {opt}
              </button>
            );
          })}
        </div>
        {AVAILABILITY_OPTIONS.map((opt) => (
          <input
            key={opt}
            type="hidden"
            name="availability"
            value={opt}
            disabled={!selected.includes(opt)}
          />
        ))}
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