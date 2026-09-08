"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { CitySummary } from "@/lib/public-opportunities";

const BelarusMap = dynamic(() => import("@/components/BelarusMap"), {
  loading: () => <p>Загружаем карту…</p>,
});

export function CatalogMap({
  activeCity,
  activeCategory,
  activeQuery,
}: {
  activeCity: string;
  activeCategory: string;
  activeQuery: string;
}) {
  const [open, setOpen] = useState(false);
  const [cities, setCities] = useState<CitySummary[] | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      city: activeCity,
      category: activeCategory,
      q: activeQuery,
    });
    fetch(`/api/opportunity-map?${params}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("map");
        return response.json();
      })
      .then(setCities)
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [open, activeCity, activeCategory, activeQuery]);
  return (
    <div>
      <button
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setCities(null);
          setError(false);
        }}
        className="mb-3 rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm font-medium"
      >
        {open ? "Скрыть карту" : "Показать на карте"}
      </button>
      {open &&
        (error ? (
          <p role="alert">
            Не удалось загрузить карту. Закройте и откройте её ещё раз.
          </p>
        ) : cities ? (
          <BelarusMap
            cities={cities}
            activeCity={activeCity}
            activeCategory={activeCategory}
            activeQuery={activeQuery}
            totalCount={cities.reduce((sum, city) => sum + city.count, 0)}
          />
        ) : (
          <p role="status">Загружаем карту…</p>
        ))}
    </div>
  );
}
