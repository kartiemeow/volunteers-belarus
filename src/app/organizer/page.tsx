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

const NOW = Date.now();
const DAY_MS = 24 * 60 * 60 * 1000;

export default async function OrganizerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/organizer");
  if (session.user.role !== "ORGANIZER") redirect("/volunteer");

  const [orgProfile, opportunities] = await Promise.all([
    db.organizationProfile.findUnique({ where: { userId: session.user.id } }),
    db.opportunity.findMany({
      where: { organizer: { userId: session.user.id } },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { applications: true } },
        applications: {
          where: { status: "PENDING" },
          select: { id: true },
        },
      },
    }),
  ]);

  const attendance = await db.opportunity.findMany({
    where: {
      organizer: { userId: session.user.id },
      date: { lte: new Date() },
      applications: { some: { status: "APPROVED" } },
    },
    include: {
      applications: {
        where: { status: "APPROVED" },
        select: { id: true },
      },
    },
    orderBy: { date: "asc" },
  });

  const totalAttendance = attendance.reduce(
    (sum, o) => sum + o.applications.length,
    0
  );
  const overdueAttendance = attendance.filter(
    (o) => o.date.getTime() + 3 * DAY_MS < NOW
  ).length;

  const totalApplications = opportunities.reduce(
    (sum, o) => sum + o._count.applications,
    0
  );
  const pendingApplications = opportunities.reduce(
    (sum, o) => sum + o.applications.length,
    0
  );

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
          { value: opportunities.length, label: "Заявок размещено" },
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
              const isOverdue = o.date.getTime() + 3 * DAY_MS < NOW;
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
                      {o.applications.length} волонтёрам
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
                    {o.applications.length > 0 && (
                      <span className="ml-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                        {o.applications.length} новых
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
                {o.applications.length > 0 && (
                  <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                    {o.applications.length} новых
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