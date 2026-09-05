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

export const dynamic = "force-dynamic";

export default async function ManageOpportunityPage(
  props: PageProps<"/organizer/opportunities/[id]">
) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "ORGANIZER") redirect("/volunteer");

  const { id } = await props.params;
  const opportunity = await db.opportunity.findFirst({
    where: { id, organizer: { userId: session.user.id } },
    include: {
      applications: {
        include: { volunteer: { include: { user: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!opportunity) notFound();

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
            <span>📍 {opportunity.city}</span>
            <span>· {formatDate(opportunity.date)}</span>
            <span>
              · мест: {opportunity.filledSlots}/{opportunity.slots}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/zayavki/${opportunity.id}`}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Публичная страница
          </a>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${OPPORTUNITY_STATUS_COLORS[opportunity.status]}`}>
            {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
          </span>
        </div>
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
            Заявка опубликована в каталоге — волонтёры могут откликнуться.
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
                      <span> · {a.volunteer.user.phone}</span>
                    )}
                    {a.volunteer.totalHours > 0 && (
                      <span> · ⏱ {a.volunteer.totalHours} ч помощи</span>
                    )}
                  </div>
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

                {a.status === "APPROVED" && (
                  <form action={setApplicationStatus}>
                    <input type="hidden" name="applicationId" value={a.id} />
                    <input type="hidden" name="status" value="DONE" />
                    <button
                      type="submit"
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Отметить выполненным
                    </button>
                  </form>
                )}

                {a.status !== "PENDING" && (
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