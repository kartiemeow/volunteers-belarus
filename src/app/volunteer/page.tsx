import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  confirmParticipation,
  declineParticipation,
} from "@/lib/actions/application-actions";
import { getVolunteerReliability } from "@/lib/reliability";
import { CATEGORY_COLORS, CATEGORY_SHORT, STATUS_COLORS, STATUS_LABELS } from "@/lib/constants";
import { IconAlert, IconMapPin, IconStar } from "@/components/icons";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "vse", label: "Все" },
  { key: "aktivnye", label: "Активные" },
  { key: "vypolnennye", label: "Выполненные" },
  { key: "ne-yavilsya", label: "Не явился" },
];

export default async function VolunteerDashboardPage({
  searchParams,
}: PageProps<"/volunteer">) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/volunteer");
  if (session.user.role !== "VOLUNTEER") redirect("/organizer");

  const { tab } = await searchParams;
  const activeTab = TABS.some((t) => t.key === tab) ? tab : "vse";

  const profile = await db.volunteerProfile.findUnique({
    where: { userId: session.user.id },
  });

  const [applications, ratings] = await Promise.all([
    db.application.findMany({
      where: { volunteerId: profile?.id ?? "" },
      orderBy: { createdAt: "desc" },
      include: {
        opportunity: {
          include: { organizer: { include: { user: true } } },
        },
      },
    }),
    db.rating.findMany({
      where: { volunteerId: profile?.id ?? "" },
      select: { applicationId: true },
    }),
  ]);

  const ratedApps = new Set(ratings.map((r) => r.applicationId));

  const reliability = getVolunteerReliability(applications);

  const counts = {
    total: applications.length,
    pending: applications.filter((a) => a.status === "PENDING").length,
    approved: applications.filter((a) => a.status === "APPROVED").length,
    done: applications.filter((a) => a.status === "DONE").length,
    hours: applications
      .filter((a) => a.status === "DONE")
      .reduce((sum, a) => sum + a.hoursLogged, 0),
  };

  const filtered = applications.filter((a) => {
    if (activeTab === "aktivnye")
      return a.status === "PENDING" || a.status === "APPROVED";
    if (activeTab === "vypolnennye") return a.status === "DONE";
    if (activeTab === "ne-yavilsya") return a.status === "NO_SHOW";
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            Привет, {session.user.name}!
          </h1>
          <p className="mt-1 text-gray-600">Личный кабинет волонтёра</p>
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

      {reliability.isUnreliable && (
        <div className="mt-6 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <strong>Ненадёжный волонтёр.</strong> Вы не явились на{" "}
            {reliability.noShow} из {reliability.resolved} запланированных заявок.
            Организации видят эту отметку при выборе волонтёров. Бейдж снимется,
            когда более 60% ваших заявок будут выполнены.
          </div>
        </div>
      )}

      {reliability.resolved === 0 && (
        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
Отличное начало! Выполняйте заявки, и организации будут видеть вашу
надёжность и охотнее брать вас на помощь.
        </div>
      )}

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

      {/* Tabs */}
      <h2 className="mt-10 text-lg font-semibold text-gray-900">Мои заявки</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "vse" ? "/volunteer" : `/volunteer?tab=${t.key}`}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              activeTab === t.key
                ? "bg-emerald-600 text-white"
                : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-700">
            {activeTab === "vse"
              ? "Вы пока не откликнулись ни на одну заявку"
              : "В этой вкладке пока пусто"}
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
        <div className="mt-4 space-y-4">
          {filtered.map((a) => {
            const couldRate = a.status === "DONE" && !ratedApps.has(a.id);
            return (
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
                      <span className={`rounded-full px-2.5 py-0.5 text-center text-xs font-semibold ${CATEGORY_COLORS[a.opportunity.category]}`}>
                        {CATEGORY_SHORT[a.opportunity.category]}
                      </span>
                      <span className="flex items-center gap-1">
                      <IconMapPin className="h-4 w-4 text-emerald-600" />
                      {a.opportunity.city}
                    </span>
                      <span>{formatDate(a.opportunity.date)}, {a.opportunity.organizer.user.name}</span>
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
                  <p className="mt-3 text-sm text-gray-600">
                    ⏱ Отмечено часов: <strong>{a.hoursLogged}</strong>
                  </p>
                )}

                {a.status === "REJECTED" && (
                  <p className="mt-3 text-sm text-gray-500">
К сожалению, организатор отклонил ваш отклик. Не расстраивайтесь,
попробуйте другие заявки.
                  </p>
                )}

                {a.status === "NO_SHOW" && (
                  <p className="mt-3 text-sm text-rose-600">
                    Организация отметила, что вы не явились. Напишите ей, если
                    это ошибка, от вас зависит рейтинг надёжности.
                  </p>
                )}

                {a.needsReconfirmation &&
                  (a.status === "PENDING" || a.status === "APPROVED") && (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                      <p className="text-sm font-semibold text-amber-900">
                        Дата события изменилась
                      </p>
                      <p className="mt-0.5 text-sm text-amber-800">
                        Организация перенесла событие. Новая дата:{" "}
                        <strong>{formatDateTime(a.opportunity.date)}</strong>.
                        Подтвердите участие или откажитесь.
                      </p>
                    </div>
                  )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                  {couldRate && (
                    <Link
                      href={`/ocenit/${a.id}`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                    >
                      <IconStar className="h-4 w-4 text-white" />
                      Оценить организацию
                    </Link>
                  )}
                  {a.status === "DONE" && ratedApps.has(a.id) && (
                    <span className="inline-flex items-center gap-1.5 text-sm text-gray-500">
                      <IconStar className="h-4 w-4 text-amber-500" />
                      Вы оценили организацию. Спасибо!
                    </span>
                  )}
                  {a.needsReconfirmation &&
                    (a.status === "PENDING" || a.status === "APPROVED") && (
                      <>
                        <form action={confirmParticipation}>
                          <input type="hidden" name="applicationId" value={a.id} />
                          <button
                            type="submit"
                            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                          >
                            Подтверждаю участие
                          </button>
                        </form>
                        <form action={declineParticipation}>
                          <input type="hidden" name="applicationId" value={a.id} />
                          <button
                            type="submit"
                            className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                          >
                            Отказаться
                          </button>
                        </form>
                      </>
                    )}
                </div>
              </div>
            );
          })}
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

function formatDateTime(d: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}