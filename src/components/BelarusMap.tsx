"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  BELARUS_CITY_COORDS,
  BELARUS_MAP_PATH,
  MAP_BOUNDS,
} from "@/lib/map-data";

export type MapApplication = { id: string; title: string };
export type MapCity = { city: string; apps: MapApplication[] };

const LON_SPAN = MAP_BOUNDS.lonMax - MAP_BOUNDS.lonMin;
const LAT_SPAN = MAP_BOUNDS.latMax - MAP_BOUNDS.latMin;
const WORLD_W = 100;
const WORLD_H = 51.17;
const MIN_SCALE = 1;
const MAX_SCALE = 9;

export default function BelarusMap({
  cities,
  activeCity,
  activeCategory,
  activeQuery,
  totalCount,
  organizer = "",
  archive = false,
}: {
  cities: MapCity[];
  activeCity: string;
  activeCategory: string;
  activeQuery: string;
  totalCount: number;
  organizer?: string;
  archive?: boolean;
}) {
  const router = useRouter();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ s: 1, tx: 0, ty: (100 - WORLD_H) / 2 });
  const sRef = useRef(1);
  const txRef = useRef(0);
  const tyRef = useRef((100 - WORLD_H) / 2);
  const dragRef = useRef<{ x: number; y: number } | null>(null);

  function applyView(s: number, tx: number, ty: number) {
    sRef.current = s;
    txRef.current = tx;
    tyRef.current = ty;
    setView({ s, tx, ty });
  }

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * 100;
      const cy = ((e.clientY - rect.top) / rect.width) * 100;
      const s0 = sRef.current;
      const s1 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s0 * (e.deltaY < 0 ? 1.2 : 0.85)));
      const wx = (cx - txRef.current) / s0;
      const wy = (cy - tyRef.current) / s0;
      applyView(s1, cx - wx * s1, cy - wy * s1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  function zoomAt(factor: number, cx = 50, cy = 50) {
    const s0 = sRef.current;
    const s1 = Math.min(MAX_SCALE, Math.max(MIN_SCALE, s0 * factor));
    const wx = (cx - txRef.current) / s0;
    const wy = (cy - tyRef.current) / s0;
    applyView(s1, cx - wx * s1, cy - wy * s1);
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    dragRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const dx = ((e.clientX - drag.x) / rect.width) * 100;
    const dy = ((e.clientY - drag.y) / rect.width) * 100;
    dragRef.current = { x: e.clientX, y: e.clientY };
    const cl = (v: number) => Math.min(150, Math.max(-150, v));
    applyView(sRef.current, cl(txRef.current + dx), cl(tyRef.current + dy));
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function selectCity(city: string) {
    const next = city === activeCity ? "" : city;
    const params = new URLSearchParams();
    if (organizer) params.set("organizer", organizer);
    if (archive) params.set("archive", "1");
    if (activeCategory) params.set("category", activeCategory);
    if (activeQuery) params.set("q", activeQuery);
    if (next) params.set("city", next);
    router.push(`/zayavki${params.size > 0 ? `?${params.toString()}` : ""}`);
  }

  const markers = cities
    .map((city) => {
      const coord = BELARUS_CITY_COORDS[city.city];
      if (!coord) return null;
      const fx = (coord.lon - MAP_BOUNDS.lonMin) / LON_SPAN;
      const fyLat = (MAP_BOUNDS.latMax - coord.lat) / LAT_SPAN;
      return { ...city, fx, fyLat, active: city.city === activeCity };
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="w-full lg:w-80 xl:w-96">
      <div
        ref={wrapRef}
        className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-2xl bg-emerald-600 shadow-sm"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div
          className="absolute left-0 top-0"
          style={{
            left: `${view.tx}%`,
            top: `${view.ty}%`,
            width: `${WORLD_W * view.s}%`,
            height: `${WORLD_H * view.s}%`,
          }}
        >
          <svg
            viewBox={`0 0 ${WORLD_W} ${WORLD_H}`}
            preserveAspectRatio="none"
            className="block h-full w-full"
            aria-hidden="true"
          >
            <path
              d={BELARUS_MAP_PATH}
              fill="#ffffff"
              fillOpacity={0.18}
              stroke="#ffffff"
              strokeOpacity={0.4}
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>

        {markers.map((m) => {
          const sx = m.fx * WORLD_W * view.s + view.tx;
          const sy = m.fyLat * WORLD_H * view.s + view.ty;
          if (sx < -10 || sx > 110 || sy < -10 || sy > 110) return null;
          const alignX =
            m.fx < 0.3 ? "left-0" : m.fx > 0.7 ? "right-0" : "left-1/2 -translate-x-1/2";
          const alignY = m.fyLat < 0.45 ? "top-full mt-2" : "bottom-full mb-2";
          return (
            <div
              key={m.city}
              className="group absolute z-10"
              style={{
                left: `${sx}%`,
                top: `${sy}%`,
                transform: "translate(-50%, -50%)",
              }}
              onPointerDown={(e) => e.stopPropagation()}
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
                    {m.apps.length} {pluralize(m.apps.length)}
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

        {markers.length > 0 && (
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] font-semibold text-white">
            {totalCount} {pluralize(totalCount)}
          </div>
        )}

        <div className="pointer-events-none absolute right-2.5 top-2.5 flex flex-col gap-1.5">
          <button
            type="button"
            aria-label="Приблизить"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => zoomAt(1.3)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-emerald-700 shadow transition hover:bg-white"
          >
            +
          </button>
          <button
            type="button"
            aria-label="Отдалить"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => zoomAt(1 / 1.3)}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-lg font-bold text-emerald-700 shadow transition hover:bg-white"
          >
            −
          </button>
        </div>
      </div>
      <p className="mt-1.5 text-center text-xs text-gray-500">
        Колесо мыши — приближение, перетаскивание — перемещение
      </p>
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