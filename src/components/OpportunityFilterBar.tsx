"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CATEGORY_ORDER, CATEGORY_SHORT } from "@/lib/constants";

export function OpportunityFilterBar({
  cities,
  activeCategory = "",
  activeCity = "",
  query = "",
}: {
  cities: string[];
  activeCategory?: string;
  activeCity?: string;
  query?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(query);

  function apply(params: Record<string, string | undefined>) {
    const sp = new URLSearchParams();
    const category = params.category ?? activeCategory;
    const city = params.city ?? activeCity;
    const sQuery = params.q ?? q;
    if (category) sp.set("category", category);
    if (city) sp.set("city", city);
    if (sQuery) sp.set("q", sQuery);
    startTransition(() => router.push(`/zayavki${sp.size ? `?${sp.toString()}` : ""}`));
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              🔍
            </span>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") apply({});
              }}
              placeholder="Поиск по названию или описанию..."
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>

        {/* Category */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => apply({ category: "" })}
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
              !activeCategory
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Все
          </button>
          {CATEGORY_ORDER.map((key) => (
            <button
              key={key}
              onClick={() => apply({ category: key })}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
                activeCategory === key
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {CATEGORY_SHORT[key]}
            </button>
          ))}
        </div>

        {/* City */}
        <select
          value={activeCity}
          onChange={(e) => apply({ city: e.target.value })}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Все города</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}