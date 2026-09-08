import { Pagination } from "@/components/Pagination";
import { PAGE_SIZE, pageNumber } from "@/lib/pagination";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  setApplicationStatus,
  setApplicationHours,
} from "@/lib/actions/organizer-actions";
import {
  CATEGORY_LABELS,
  STATUS_LABELS,
  STATUS_COLORS,
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_STATUS_COLORS,
} from "@/lib/constants";
import { reliabilityFromCounts } from "@/lib/reliability";
import { RescheduleOpportunityForm } from "@/components/RescheduleOpportunityForm";
import { IconMapPin } from "@/components/icons";

export const dynamic = "force-dynamic";

const DAY_MS = 24 * 60 * 60 * 1000;

export default async function ManageOpportunityPage(
  props: PageProps<"/organizer/opportunities/[id]">
) {
  // eslint-disable-next-line react-hooks/purity -- Dynamic Server Component needs the time of this request.
  const now = Date.now();
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ORGANIZER") redirect("/volunteer");

  const { id } = await props.params;
  const params = await props.searchParams;
  const page = pageNumber(params.page);
  const opportunity = await db.opportunity.findFirst({
    where: { id, organizer: { userId: session.user.id } },
    include: {
      _count: { select: { applications: true } },
      applications: {
        include: {
          volunteer: {
            include: {
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
        orderBy: [{ createdAt: "asc" }, { id: "asc" }],
        take: PAGE_SIZE, skip: (page - 1) * PAGE_SIZE,
      },
    },
  });
  if (!opportunity) notFound();
  const reliabilityGroups = await db.application.groupBy({
    by: ["volunteerId", "status"], where: { volunteerId: { in: opportunity.applications.map((a) => a.volunteerId) }, status: { in: ["DONE", "NO_SHOW"] } }, _count: true,
  });
  const unreliable = new Set(opportunity.applications.filter((a) => {
    const count = (status: string) => reliabilityGroups.find((group) => group.volunteerId === a.volunteerId && group.status === status)?._count ?? 0;
    return reliabilityFromCounts(count("DONE"), count("NO_SHOW")).isUnreliable;
  }).map((a) => a.volunteerId));

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <Link
        href="/organizer"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-600"
      >
        ← Назад в кабинет
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            {opportunity.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
            <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700">
              {CATEGORY_LABELS[opportunity.category]}
            </span>
            <span className="flex items-center gap-1">
              <IconMapPin className="h-4 w-4 text-emerald-600" />
              {opportunity.city}
            </span>
            <span>{formatDate(opportunity.date)}</span>
            <span>
              мест: {opportunity.filledSlots}/{opportunity.slots}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/zayavki/${opportunity.id}`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Публичная страница
          </Link>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${OPPORTUNITY_STATUS_COLORS[opportunity.status]}`}>
            {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
          </span>
        </div>
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">
        Перенос события
      </h2>
      <div className="rounded-2xl border border-gray-200 bg-white p-6">
        <p className="mb-4 text-sm text-gray-500">
          Если дата или время события изменились, обновите их здесь.
          Откликнувшиеся волонтёры получат уведомление и смогут подтвердить
          участие заново или отказаться.
        </p>
        <RescheduleOpportunityForm
          opportunityId={opportunity.id}
          currentDate={toDatetimeLocal(opportunity.date)}
        />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">
        Отклики волонтёров
      </h2>

      {opportunity.applications.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-lg font-medium text-gray-700">
            Откликов пока нет
          </p>
          <p className="mt-1 text-gray-500">
            Заявка опубликована в каталоге, волонтёры могут откликнуться.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {opportunity.applications.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-gray-900">
                    {a.volunteer.user.name}
                  </div>
                  <div className="mt-0.5 text-sm text-gray-500">
                    {a.volunteer.user.email}
                    {a.volunteer.user.phone && (
                      <span>, {a.volunteer.user.phone}</span>
                    )}
                    {a.volunteer.totalHours > 0 && (
                      <span>, ⏱ {a.volunteer.totalHours} ч помощи</span>
                    )}
                  </div>
                  {unreliable.has(a.volunteerId) && (
                    <span className="mt-1.5 inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
                      Ненадёжный
                    </span>
                  )}
                  {a.volunteer.skills.length > 0 && (
                    <div className="mt-1.5 text-sm text-gray-600">
                      Навыки: {a.volunteer.skills.join(", ")}
                    </div>
                  )}
                  {a.message && (
                    <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">
                      «{a.message}»
                    </p>
                  )}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_COLORS[a.status]}`}>
                  {STATUS_LABELS[a.status]}
                </span>
                {a.needsReconfirmation &&
                  (a.status === "PENDING" || a.status === "APPROVED") && (
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                      Ожидает подтверждения
                    </span>
                  )}
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
                {a.status === "PENDING" && (
                  <>
                    <form action={setApplicationStatus}>
                      <input type="hidden" name="applicationId" value={a.id} />
                      <input type="hidden" name="status" value="APPROVED" />
                      <button
                        type="submit"
                        className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Одобрить
                      </button>
                    </form>
                    <form action={setApplicationStatus}>
                      <input type="hidden" name="applicationId" value={a.id} />
                      <input type="hidden" name="status" value="REJECTED" />
                      <button
                        type="submit"
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        Отклонить
                      </button>
                    </form>
                  </>
                )}

                {a.status === "APPROVED" &&
                  (isPast(opportunity.date, now) ? (
                    <>
                      <span className="text-sm text-gray-500">
                        Отметьте явку волонтёра{overdue(opportunity.date, now) ? (
                          <strong className="text-red-600">: срок истёк!</strong>
                        ) : (
                          <strong>: до {deadline(opportunity.date)}</strong>
                        )}
                      </span>
                      <form action={setApplicationStatus}>
                        <input type="hidden" name="applicationId" value={a.id} />
                        <input type="hidden" name="status" value="DONE" />
                        <button
                          type="submit"
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                        >
                          Явился
                        </button>
                      </form>
                      <form action={setApplicationStatus}>
                        <input type="hidden" name="applicationId" value={a.id} />
                        <input type="hidden" name="status" value="NO_SHOW" />
                        <button
                          type="submit"
                          className="rounded-lg border border-rose-300 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                        >
                          Не явился
                        </button>
                      </form>
                    </>
                  ) : (
                    <span className="text-sm text-gray-500">
                      Явку можно отметить после {formatDate(opportunity.date)}
                    </span>
                  ))}

                {a.status === "DONE" && (
                  <form action={setApplicationHours} className="flex items-center gap-2">
                    <input
                      type="hidden"
                      name="applicationId"
                      value={a.id}
                    />
                    <label className="text-sm text-gray-500">Часы:</label>
                    <input
                      type="number"
                      name="hours"
                      min={0}
                      max={24}
                      defaultValue={a.hoursLogged}
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
                    />
                    <button
                      type="submit"
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Сохранить
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination pathname={`/organizer/opportunities/${id}`} params={params} page={page} total={opportunity._count.applications} />
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

function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function isPast(d: Date, now: number) {
  return d.getTime() <= now;
}

function overdue(d: Date, now: number) {
  return d.getTime() + 3 * DAY_MS < now;
}

function deadline(d: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
  }).format(new Date(d.getTime() + 3 * DAY_MS));
}
