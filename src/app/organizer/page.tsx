import { Pagination } from "@/components/Pagination";
import { PAGE_SIZE, pageNumber } from "@/lib/pagination";
import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  CATEGORY_SHORT,
  CATEGORY_COLORS,
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_COLORS,
} from "@/lib/constants";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function OrganizerDashboardPage(props: PageProps<"/organizer">) {
  // eslint-disable-next-line react-hooks/purity -- Dynamic Server Component needs the time of this request.
  const now = Date.now();
  const session = await auth();
  if (!session?.user) redirect("/login?next=/organizer");
  if (session.user.role !== "ORGANIZER") redirect("/volunteer");

  const params = await props.searchParams;
  const page = pageNumber(params.page);
  const attendancePage = pageNumber(params.attendancePage);
  const own = { organizer: { userId: session.user.id } };
  const attendanceWhere = { ...own, date: { lte: new Date(now) }, applications: { some: { status: "APPROVED" as const } } };
  const [orgProfile, opportunityRows, attendance, opportunityCount, totalApplications, pendingApplications, totalAttendance, overdueAttendance, attendanceCount] = await Promise.all([
    db.organizationProfile.findUnique({ where: { userId: session.user.id } }),
    db.opportunity.findMany({ where: own, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE,
      include: { _count: { select: { applications: true } } } }),
    db.opportunity.findMany({ where: attendanceWhere, orderBy: [{ date: "asc" }, { id: "asc" }], take: PAGE_SIZE, skip: (attendancePage - 1) * PAGE_SIZE,
      select: { id: true, title: true, city: true, date: true, _count: { select: { applications: { where: { status: "APPROVED" } } } } } }),
    db.opportunity.count({ where: own }),
    db.application.count({ where: { opportunity: own } }),
    db.application.count({ where: { opportunity: own, status: "PENDING" } }),
    db.application.count({ where: { opportunity: { ...own, date: { lte: new Date(now) } }, status: "APPROVED" } }),
    db.opportunity.count({ where: { ...attendanceWhere, date: { lt: new Date(now - 3 * DAY_MS) } } }),
    db.opportunity.count({ where: attendanceWhere }),
  ]);
  const pendingGroups = await db.application.groupBy({ by: ["opportunityId"], where: { opportunityId: { in: opportunityRows.map((o) => o.id) }, status: "PENDING" }, _count: true });
  const opportunities = opportunityRows.map((o) => ({ ...o, pendingCount: pendingGroups.find((group) => group.opportunityId === o.id)?._count ?? 0 }));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {orgProfile?.orgName ?? session.user.name}
          </h1>
          <p className="mt-1 text-gray-600">Кабинет организатора</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/organizer/create"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            + Новая заявка
          </Link>
          <Link
            href="/organizer/profile"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Профиль организации
          </Link>
        </div>
      </div>

      {!orgProfile?.verified && (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>Профиль ещё не верифицирован.</strong> Заявки видны всем
          пользователям, но до подтверждения модератором рядом с вашим именем
          будет отметка «Ожидает проверки».
        </div>
      )}

      {totalAttendance > 0 && (
        <div
          className={`mt-6 rounded-xl border px-5 py-4 text-sm ${
            overdueAttendance > 0
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <strong>
            {overdueAttendance > 0
              ? `Срок отметки явки истёк для ${overdueAttendance} заявки(ок)! `
              : "Не забудьте отметить явку волонтёров. "}
          </strong>
{totalAttendance} волонтёр(а) участвовали в прошедших заявках. После
события явку нужно отметить в течение 3 дней.
          <Link
            href="#attendance"
            className="ml-2 font-semibold underline hover:no-underline"
          >
            Отметить явку
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {[
          { value: opportunityCount, label: "Заявок размещено" },
          { value: totalApplications, label: "Всего откликов" },
          { value: pendingApplications, label: "Ждут вашего решения" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-2xl font-extrabold text-emerald-600">{s.value}</div>
            <div className="mt-1 text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {attendance.length > 0 && (
        <div id="attendance" className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">
            Нужно отметить явку
          </h2>
          <div className="space-y-3">
            {attendance.map((o) => {
              const isOverdue = o.date.getTime() + 3 * DAY_MS < now;
              const deadline = new Date(
                o.date.getTime() + 3 * 24 * 60 * 60 * 1000
              );
              return (
                <div
                  key={o.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white px-5 py-4 ${
                    isOverdue ? "border-red-300" : "border-amber-200"
                  }`}
                >
                  <div>
                    <div className="font-semibold text-gray-900">{o.title}</div>
                    <div className="text-sm text-gray-500">
                      {formatDate(o.date)}, {o.city}, явку нужно отметить{" "}
                      {o._count.applications} волонтёрам
                    </div>
                  </div>
                  <Link
                    href={`/organizer/opportunities/${o.id}`}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      isOverdue
                        ? "bg-red-600 text-white hover:bg-red-700"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    {isOverdue
                      ? `Срок истёк ${formatDate(deadline)}, отметить!`
                      : `До ${formatDate(deadline)}`}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Pagination pathname="/organizer" params={params} page={attendancePage} total={attendanceCount} pageKey="attendancePage" />
      {/* Opportunities */}
      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">Мои заявки</h2>

      {opportunities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-700">Заявок пока нет</p>
          <p className="mt-1 text-gray-500">
            Разместите первую заявку, и волонтёры увидят её в каталоге.
          </p>
          <Link
            href="/organizer/create"
            className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Разместить заявку
          </Link>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 md:block">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                <th className="px-5 py-3">Заявка</th>
                <th className="px-5 py-3">Направление</th>
                <th className="px-5 py-3">Город</th>
                <th className="px-5 py-3">Отклики</th>
                <th className="px-5 py-3">Статус</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {opportunities.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="font-semibold text-gray-900">
                      {o.title}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(o.date)}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-center text-xs font-semibold ${CATEGORY_COLORS[o.category]}`}>
                      {CATEGORY_SHORT[o.category]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{o.city}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {o._count.applications}
                    {o.pendingCount > 0 && (
                      <span className="ml-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                        {o.pendingCount} новых
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`rounded-full px-2.5 py-0.5 text-center text-xs font-semibold ${OPPORTUNITY_STATUS_COLORS[o.status]}`}>
                      {OPPORTUNITY_STATUS_LABELS[o.status]}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link
                      href={`/organizer/opportunities/${o.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Управлять →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 space-y-3 md:hidden">
          {opportunities.map((o) => (
            <div
              key={o.id}
              className="rounded-2xl border border-gray-200 bg-white p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-gray-900">{o.title}</div>
                  <div className="mt-0.5 text-sm text-gray-500">
                    {formatDate(o.date)}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-center text-xs font-semibold ${OPPORTUNITY_STATUS_COLORS[o.status]}`}>
                  {OPPORTUNITY_STATUS_LABELS[o.status]}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className={`rounded-full px-2.5 py-0.5 text-center text-xs font-semibold ${CATEGORY_COLORS[o.category]}`}>
                  {CATEGORY_SHORT[o.category]}
                </span>
                <span>{o.city}</span>
                <span>откликов: {o._count.applications}</span>
                {o.pendingCount > 0 && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                    {o.pendingCount} новых
                  </span>
                )}
              </div>
              <div className="mt-4 border-t border-gray-100 pt-4">
                <Link
                  href={`/organizer/opportunities/${o.id}`}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                >
                  Управлять →
                </Link>
              </div>
            </div>
          ))}
        </div>
        </>
      )}
      <Pagination pathname="/organizer" params={params} page={page} total={opportunityCount} />
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