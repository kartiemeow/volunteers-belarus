"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BELARUS_CITY_COORDS,
  BELARUS_MAP_PATH,
  MAP_BOUNDS,
} from "@/lib/map-data";

export type MapApplication = { id: string; title: string };
export type MapCity = { city: string; apps: MapApplication[] };

export default function BelarusMap({
  cities,
  activeCity,
  activeCategory,
  activeQuery,
  totalCount,
}: {
  cities: MapCity[];
  activeCity: string;
  activeCategory: string;
  activeQuery: string;
  totalCount: number;
}) {
  const router = useRouter();
  const { lonMin, lonMax, latMin, latMax } = MAP_BOUNDS;
  const lonSpan = lonMax - lonMin;
  const latSpan = latMax - latMin;

  function selectCity(city: string) {
    const next = city === activeCity ? "" : city;
    const params = new URLSearchParams();
    if (activeCategory) params.set("category", activeCategory);
    if (activeQuery) params.set("q", activeQuery);
    if (next) params.set("city", next);
    router.push(`/zayavki${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  const markers = cities
    .map((city) => {
      const coord = BELARUS_CITY_COORDS[city.city];
      if (!coord) return null;
      const x = ((coord.lon - lonMin) / lonSpan) * 100;
      const y = ((latMax - coord.lat) / latSpan) * 100;
      return { ...city, x, y, active: city.city === activeCity };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="w-full max-w-sm md:w-80">
      <div className="relative aspect-square w-full select-none rounded-2xl bg-emerald-600 shadow-sm">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden="true"
        >
          <path
            d={BELARUS_MAP_PATH}
            fill="#ffffff"
            fillOpacity={0.18}
            stroke="#ffffff"
            strokeOpacity={0.35}
            strokeWidth={0.4}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        {markers.map((m) => {
          const alignX =
            m.x < 30 ? "left-0" : m.x > 70 ? "right-0" : "left-1/2 -translate-x-1/2";
          const alignY = m.y < 45 ? "top-full mt-2" : "bottom-full mb-2";
          return (
            <div
              key={m.city}
              className="group absolute z-10 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
            >
              <button
                type="button"
                onClick={() => selectCity(m.city)}
                aria-label={`Показать заявки в городе ${m.city}`}
                className={`block rounded-full transition-transform ${
                  m.active
                    ? "h-3.5 w-3.5 scale-110 bg-white ring-4 ring-emerald-300"
                    : "h-3 w-3 bg-white/90 ring-2 ring-emerald-300 group-hover:scale-150"
                }`}
              />
              {m.active && (
                <span className="pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                  {m.city}
                </span>
              )}
              <div
                className={`pointer-events-none absolute z-30 hidden w-56 group-hover:block ${alignY} ${alignX}`}
              >
                <div className="rounded-xl bg-white p-3 shadow-xl shadow-emerald-950/30">
                  <p className="text-sm font-bold text-emerald-800">{m.city}</p>
                  <p className="mt-0.5 text-xs font-medium text-emerald-600">
                    {m.apps.length}{" "}
                    {pluralize(m.apps.length)}
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {m.apps.slice(0, 3).map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`/zayavki/${a.id}`}
                          className="block truncate text-xs font-medium text-emerald-700 hover:underline"
                        >
                          {a.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                  {m.apps.length > 3 && (
                    <p className="mt-1 text-xs text-emerald-600/80">
                      и ещё {m.apps.length - 3}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        <div className="pointer-events-none absolute bottom-2.5 left-1/2 -translate-x-1/2 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
          {totalCount} {pluralize(totalCount)} во всех городах
        </div>
      </div>
    </div>
  );
}

function pluralize(n: number) {
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "заявок";
  if (lastDigit === 1) return "заявка";
  if (lastDigit >= 2 && lastDigit <= 4) return "заявки";
  return "заявок";
}