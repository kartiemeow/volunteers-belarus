import Link from "next/link";
import { db } from "@/lib/db";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  OPPORTUNITY_STATUS_COLORS,
  OPPORTUNITY_STATUS_LABELS,
  CATEGORY_ORDER,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

const DIRECTION_DESCRIPTIONS: Record<string, string> = {
  SHELTER:
    "Помощь приютам для животных: выгул, уборка, передержка, поиск новых домов для питомцев.",
  ELDERLY:
    "Забота о пожилых людях: закупка продуктов и лекарств, помощь по дому, простое человеческое общение.",
  PSO:
    "Поисково-спасательные отряды: участие в поисках пропавших людей, патрулирование, распространение ориентировок.",
  URBAN:
    "Благоустройство городов: субботники, озеленение, уборка дворов и парков, ремонт малых архитектурных форм.",
};

const DIRECTION_ICONS: Record<string, string> = {
  SHELTER: "🐾",
  ELDERLY: "🤝",
  PSO: "🧭",
  URBAN: "🌳",
};

export default async function HomePage() {
  const [recentOpportunities, stats] = await Promise.all([
    db.opportunity.findMany({
      where: { status: "OPEN" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { organizer: { include: { user: true } } },
    }),
    Promise.all([
      db.user.count({ where: { role: "VOLUNTEER" } }),
      db.opportunity.count(),
      db.application.count({ where: { status: "APPROVED" } }),
      db.organizationProfile.count(),
    ]).then(([volunteers, opportunities, applications, organizations]) => ({
      volunteers,
      opportunities,
      applications,
      organizations,
    })),
  ]);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-700 via-emerald-600 to-teal-600 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-10 [background-image:radial-gradient(circle_at_20%_20%,white_1px,transparent_1px)] [background-size:28px_28px]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28">
          <div className="max-w-2xl">
            <p className="mb-4 inline-block rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
              Единый координационный центр
            </p>
            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
              Помогать стало проще. Вся волонтёрская помощь Беларуси — в одном
              месте.
            </h1>
            <p className="mt-5 max-w-xl text-lg text-emerald-50">
              Находите заявки от приютов, социальных служб, поисковых отрядов и
              городских инициатив. Откликайтесь, участвуйте, меняйте мир вокруг.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/zayavki"
                className="rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50"
              >
                Найти заявку
              </Link>
              <Link
                href="/register"
                className="rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
              >
                Стать волонтёром
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 md:grid-cols-4">
          {[
            { value: stats.volunteers + "+", label: "волонтёров" },
            { value: stats.opportunities, label: "заявок опубликовано" },
            { value: stats.applications, label: "одобренных откликов" },
            { value: stats.organizations, label: "организаций" },
          ].map((s) => (
            <div key={s.label} className="text-center md:text-left">
              <div className="text-3xl font-extrabold text-emerald-600">
                {s.value}
              </div>
              <div className="mt-1 text-sm text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Directions */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Направления помощи
            </h2>
            <p className="mt-2 text-gray-600">
              Выберите, кому хотите помочь — и найдите заявку рядом с вами.
            </p>
          </div>
          <Link
            href="/napravleniya"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Все направления →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORY_ORDER.map((key) => (
            <Link
              key={key}
              href={`/zayavki?category=${key}`}
              className={`group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md ${CATEGORY_COLORS[key]}`}
            >
              <span className="text-3xl">{DIRECTION_ICONS[key]}</span>
              <h3 className="mt-4 text-lg font-bold text-gray-900">
                {CATEGORY_LABELS[key]}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                {DIRECTION_DESCRIPTIONS[key]}
              </p>
              <span className="mt-4 text-sm font-semibold text-emerald-600 group-hover:underline">
                Смотреть заявки →
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent opportunities */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Свежие заявки
              </h2>
              <p className="mt-2 text-gray-600">
                Самые новые запросы на помощь от организаций.
              </p>
            </div>
            <Link
              href="/zayavki"
              className="text-sm font-medium text-emerald-600 hover:underline"
            >
              Все заявки →
            </Link>
          </div>

          {recentOpportunities.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
              <p className="text-gray-500">
                Заявок пока нет. Станьте первым организатором и разместите
                запрос на помощь.
              </p>
              <Link
                href="/register"
                className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Разместить заявку
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {recentOpportunities.map((o) => (
                <Link
                  key={o.id}
                  href={`/zayavki/${o.id}`}
                  className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[o.category]}`}
                    >
                      {CATEGORY_LABELS[o.category]}
                    </span>
                    <span
                      className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${OPPORTUNITY_STATUS_COLORS[o.status]}`}
                    >
                      {OPPORTUNITY_STATUS_LABELS[o.status]}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-gray-900 group-hover:text-emerald-700">
                    {o.title}
                  </h3>
                  <p className="mt-2 line-clamp-2 flex-1 text-sm text-gray-600">
                    {o.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                    <span>
                      📍 {o.city}
                    </span>
                    <span>
                      {o.filledSlots} / {o.slots} мест
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}