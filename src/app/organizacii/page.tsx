import type { Metadata } from "next";
import Link from "next/link";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  CATEGORY_ORDER,
} from "@/lib/constants";
import { getOrganizations } from "@/lib/public-organizations";
import { Pagination } from "@/components/Pagination";
import { pageNumber } from "@/lib/pagination";
import { IconStar } from "@/components/icons";


export const metadata: Metadata = { title: "Организации" };

export default async function OrganizationsPage(props: PageProps<"/organizacii">) {
  const params = await props.searchParams;
  const page = pageNumber(params.page);
  const { organizations, total } = await getOrganizations(page);

  if (total === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h1 className="text-3xl font-bold text-gray-900">Организации</h1>
        <p className="mt-2 text-gray-600">
          Здесь появится список приютов, отрядов и городских инициатив, которые
          публикуют заявки на нашем сайте.
        </p>
        <div className="mt-6 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-700">
            Организации ещё не зарегистрировались
          </p>
          <p className="mt-1 text-gray-500">
            Это может сделать любая некоммерческая организация.
          </p>
          <Link
            href="/register"
            className="mt-4 inline-block rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Зарегистрировать организацию
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-gray-900">Организации</h1>
      <p className="mt-2 max-w-2xl text-gray-600">
        Приюты, поисковые отряды, социальные службы и городские инициативы,
        которые публикуют заявки на помощь волонтёрам.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {organizations.map((org) => {
          const { openCount, doneCount, helpedVolunteers, ratingCount, ratingAvg } = org;

          return (
            <div
              key={org.id}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-bold text-emerald-700">
                  {org.orgName[0]?.toUpperCase()}
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-gray-900">
                      {org.orgName}
                    </h2>
                    {org.verified && (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                        ✓ проверенная
                      </span>
                    )}
                  </div>
                  {ratingAvg !== null && (
                    <div className="mt-0.5 flex items-center gap-1 text-sm font-medium text-amber-500">
                      <IconStar className="h-4 w-4 fill-amber-500 text-amber-500" />
                      {ratingAvg.toFixed(1)}
                      <span className="text-xs font-normal text-gray-400">
                        ({ratingCount} {pluralize(ratingCount, "оценка", "оценки", "оценок")})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {org.category.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {CATEGORY_ORDER.filter((c) =>
                    org.category.includes(c)
                  ).map((c) => (
                    <span
                      key={c}
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[c]}`}
                    >
                      {CATEGORY_LABELS[c]}
                    </span>
                  ))}
                </div>
              )}

              <p className="mt-3 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-600">
                {org.description || "Описание организация ещё не добавила."}
              </p>

              <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-gray-50 p-4 text-center">
                <div>
                  <dt className="text-lg font-bold text-gray-900">{openCount}</dt>
                  <dd className="text-xs text-gray-500">
                    {pluralize(openCount, "открытая заявка", "открытые заявки", "открытых заявок")}
                  </dd>
                </div>
                <div>
                  <dt className="text-lg font-bold text-gray-900">
                    {doneCount}
                  </dt>
                  <dd className="text-xs text-gray-500">
                    {pluralize(doneCount, "выполненная заявка", "выполненные заявки", "выполненных заявок")}
                  </dd>
                </div>
                <div>
                  <dt className="text-lg font-bold text-gray-900">
                    {helpedVolunteers}
                  </dt>
                  <dd className="text-xs text-gray-500">
                    {pluralize(helpedVolunteers, "волонтёр помог", "волонтёра помогли", "волонтёров помогли")}
                  </dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                <Link
                  href="/zayavki"
                  className="text-sm font-medium text-emerald-600 hover:underline"
                >
                  Смотреть заявки
                </Link>
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-500 hover:text-emerald-600"
                  >
                    Сайт организации
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Pagination pathname="/organizacii" params={params} page={page} total={total} />
    </div>
  );
}

function pluralize(n: number, one: string, few: string, many: string) {
  const d = n % 10;
  const dd = n % 100;
  if (dd >= 11 && dd <= 14) return many;
  if (d === 1) return one;
  if (d >= 2 && d <= 4) return few;
  return many;
}