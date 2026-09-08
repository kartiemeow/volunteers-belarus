import Link from "next/link";
import {
  CATEGORY_COLORS,
  CATEGORY_SHORT,
  OPPORTUNITY_STATUS_COLORS,
  OPPORTUNITY_STATUS_LABELS,
  CATEGORY_ORDER,
} from "@/lib/constants";
import { db } from "@/lib/db";
import { OpportunityFilterBar } from "@/components/OpportunityFilterBar";
import BelarusMap, { type MapCity } from "@/components/BelarusMap";
import { IconMapPin, IconCalendar } from "@/components/icons";

export const dynamic = "force-dynamic";

const CITY_SUGGESTIONS = [
  "Минск",
  "Гомель",
  "Витебск",
  "Могилёв",
  "Гродно",
  "Брест",
];

export default async function OpportunitiesPage(
  props: PageProps<"/zayavki">
) {
  const searchParams = await props.searchParams;
  const category = typeof searchParams.category === "string" ? searchParams.category : "";
  const city = typeof searchParams.city === "string" ? searchParams.city : "";
  const query = typeof searchParams.q === "string" ? searchParams.q : "";

  const where = {
    ...(category && CATEGORY_ORDER.includes(category as never)
      ? { category: category as (typeof CATEGORY_ORDER)[number] }
      : {}),
    ...(city ? { city } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { description: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const opportunities = await db.opportunity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { organizer: { include: { user: true } } },
  });

  const allOpportunities = await db.opportunity.findMany({
    select: { id: true, title: true, city: true },
  });

  const cityMap = new Map<string, { id: string; title: string }[]>();
  for (const o of allOpportunities) {
    const list = cityMap.get(o.city) ?? [];
    list.push({ id: o.id, title: o.title });
    cityMap.set(o.city, list);
  }
  const cityMarkers: MapCity[] = Array.from(cityMap.entries()).map(
    ([city, apps]) => ({ city, apps })
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Заявки на помощь</h1>
        <p className="mt-2 text-gray-600">
          Здесь собраны запросы от приютов, социальных служб, поисковых отрядов
          и городских инициатив по всей Беларуси.
        </p>
        <p className="mt-3 text-sm text-gray-700">
          <strong className="text-emerald-700">Найдено: {opportunities.length}</strong>{" "}
          {pluralize(opportunities.length)}
          {opportunities.length === 0 && (
            <Link href="/register" className="ml-3 font-medium text-emerald-600 hover:underline">
              Организация? Разместите свою заявку
            </Link>
          )}
        </p>
      </div>

      <OpportunityFilterBar
        cities={CITY_SUGGESTIONS}
        activeCategory={category}
        activeCity={city}
        query={query}
      />

      <div className="mt-6 flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="order-1 w-full lg:order-2 lg:w-80 lg:shrink-0 xl:w-96">
          <BelarusMap
            cities={cityMarkers}
            activeCity={city}
            activeCategory={category}
            activeQuery={query}
            totalCount={allOpportunities.length}
          />
        </div>

        <div className="order-2 min-w-0 flex-1 lg:order-1">
          {opportunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <p className="text-lg font-medium text-gray-700">
                По запросу ничего не найдено
              </p>
              <p className="mt-1 text-gray-500">
                Попробуйте изменить фильтры или сбросить поисковый запрос.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {opportunities.map((o) => (
            <Link
              key={o.id}
              href={`/zayavki/${o.id}`}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-2">
                <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[o.category]}`}>
                  {CATEGORY_SHORT[o.category]}
                </span>
                <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${OPPORTUNITY_STATUS_COLORS[o.status]}`}>
                  {OPPORTUNITY_STATUS_LABELS[o.status]}
                </span>
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-emerald-700">
                {o.title}
              </h3>
              <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-600">
                {o.description}
              </p>
              <div className="mt-5 space-y-1.5 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <IconMapPin className="h-4 w-4 text-emerald-600" />
                  {o.city}
                </div>
                <div className="flex items-center gap-1.5">
                  <IconCalendar className="h-4 w-4 text-emerald-600" />
                  {formatDate(o.date)}, {o.filledSlots}/{o.slots} мест
                </div>
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4 text-sm">
                <span className="font-medium text-gray-800">{o.organizer.user.name}</span>
                {o.organizer.verified ? (
                  <span className="ml-1.5 text-xs font-semibold text-emerald-600" title="Верифицированная организация">
                    ✓ проверено
                  </span>
                ) : (
                  <span className="ml-1.5 text-xs font-semibold text-yellow-700" title="Профиль ещё не подтверждён администратором">
                    ожидает проверки
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
      </div>
    </div>
    </div>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}

function pluralize(n: number) {
  const lastDigit = n % 10;
  const lastTwo = n % 100;
  if (lastTwo >= 11 && lastTwo <= 14) return "заявок";
  if (lastDigit === 1) return "заявка";
  if (lastDigit >= 2 && lastDigit <= 4) return "заявки";
  return "заявок";
}