import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CATEGORY_COLORS, CATEGORY_SHORT, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function VolunteerDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/volunteer");
  if (session.user.role !== "VOLUNTEER") redirect("/organizer");

  const profile = await db.volunteerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const applications = await db.application.findMany({
    where: { volunteerId: profile?.id ?? "" },
    orderBy: { createdAt: "desc" },
    include: {
      opportunity: {
        include: { organizer: { include: { user: true } } },
      },
    },
  });

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    done: applications.filter((a) => a.status === "DONE").length,
    hours: applications
      .filter((a) => a.status === "DONE")
      .reduce((sum, a) => sum + a.hoursLogged, 0),
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Привет, {session.user.name}!
          </h1>
          <p className="mt-1 text-gray-600">
            Личный кабинет волонтёра
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/zayavki"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Найти заявку
          </Link>
          <Link
            href="/volunteer/profile"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Редактировать профиль
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {[
          { value: counts.total, label: "Всего откликов" },
          { value: counts.pending, label: "На рассмотрении" },
          { value: counts.approved, label: "Одобрено" },
          { value: counts.done, label: "Выполнено" },
          { value: `${counts.hours} ч`, label: "Часов помощи" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="text-2xl font-extrabold text-emerald-600">{s.value}</div>
            <div className="mt-1 text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Applications */}
      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">Мои отклики</h2>

      {applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-700">
            Вы пока не откликнулись ни на одну заявку
          </p>
          <p className="mt-1 text-gray-500">
            Найдите подходящую заявку и нажмите «Откликнуться».
          </p>
          <Link
            href="/zayavki"
            className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Смотреть заявки
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link
                    href={`/zayavki/${a.opportunity.id}`}
                    className="text-lg font-bold text-gray-900 hover:text-emerald-700"
                  >
                    {a.opportunity.title}
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[a.opportunity.category]}`}>
                      {CATEGORY_SHORT[a.opportunity.category]}
                    </span>
                    <span>📍 {a.opportunity.city}</span>
                    <span>· {formatDate(a.opportunity.date)}</span>
                    <span>· {a.opportunity.organizer.user.name}</span>
                  </div>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[a.status]}`}>
                  {STATUS_LABELS[a.status]}
                </span>
              </div>

              {a.message && (
                <p className="mt-3 rounded-lg bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <span className="font-medium text-gray-700">Ваше сообщение:</span>{" "}
                  {a.message}
                </p>
              )}

              {a.status === "DONE" && (
                <div className="mt-3 text-sm text-gray-600">
                  ⏱ Отмечено часов: <strong>{a.hoursLogged}</strong>
                </div>
              )}

              {a.status === "REJECTED" && (
                <p className="mt-3 text-sm text-gray-500">
                  К сожалению, организатор отклонил ваш отклик. Не расстраивайтесь —
                  попробуйте другие заявки.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(d);
}