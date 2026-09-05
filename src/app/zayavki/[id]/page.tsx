import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  OPPORTUNITY_STATUS_COLORS,
  OPPORTUNITY_STATUS_LABELS,
} from "@/lib/constants";
import {
  ApplyButton,
  NeedLogin,
  AlreadyApplied,
  NoSlots,
  OrganizerView,
} from "@/components/ApplyButton";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/zayavki/[id]">
): Promise<Metadata> {
  const { id } = await props.params;
  const opportunity = await db.opportunity.findUnique({ where: { id } });
  if (!opportunity) return { title: "Заявка не найдена" };
  return { title: opportunity.title };
}

export default async function OpportunityPage(
  props: PageProps<"/zayavki/[id]">
) {
  const { id } = await props.params;
  const [opportunity, session] = await Promise.all([
    db.opportunity.findUnique({
      where: { id },
      include: { organizer: { include: { user: true } } },
    }),
    auth(),
  ]);

  if (!opportunity) notFound();

  const user = session?.user;
  const isOwner = user?.role === "ORGANIZER" && opportunity.organizer.userId === user.id;

  let actionArea: React.ReactNode = null;
  if (isOwner) {
    actionArea = <OrganizerView />;
  } else if (opportunity.status !== "OPEN" || opportunity.filledSlots >= opportunity.slots) {
    actionArea = <NoSlots />;
  } else if (!user) {
    actionArea = <NeedLogin />;
  } else if (user.role !== "VOLUNTEER") {
    actionArea = <OrganizerView />;
  } else {
    const profile = await db.volunteerProfile.findUnique({
      where: { userId: user.id },
    });
    const existing = profile
      ? await db.application.findUnique({
          where: {
            opportunityId_volunteerId: {
              opportunityId: opportunity.id,
              volunteerId: profile.id,
            },
          },
        })
      : null;
    actionArea = existing ? <AlreadyApplied /> : <ApplyButton opportunityId={opportunity.id} />;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Link
            href="/zayavki"
            className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-600"
          >
            ← Все заявки
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[opportunity.category]}`}>
                {CATEGORY_LABELS[opportunity.category]}
              </span>
              <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${OPPORTUNITY_STATUS_COLORS[opportunity.status]}`}>
                {OPPORTUNITY_STATUS_LABELS[opportunity.status]}
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-bold text-gray-900">
              {opportunity.title}
            </h1>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-3 text-lg font-semibold text-gray-900">
              О заявке
            </h2>
            <p className="whitespace-pre-line leading-relaxed text-gray-700">
              {opportunity.description}
            </p>

            {opportunity.requirements.length > 0 && (
              <div className="mt-6">
                <h3 className="mb-2 text-sm font-semibold text-gray-900">
                  Требования и пожелания
                </h3>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  {opportunity.requirements.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-0.5 text-emerald-500">✓</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Детали
            </h2>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Город</dt>
                <dd className="font-medium text-gray-900">{opportunity.city}</dd>
              </div>
              {opportunity.address && (
                <div className="flex justify-between gap-4">
                  <dt className="text-gray-500">Адрес</dt>
                  <dd className="text-right font-medium text-gray-900">
                    {opportunity.address}
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Дата</dt>
                <dd className="font-medium text-gray-900">
                  {formatDate(opportunity.date)}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-gray-500">Свободные места</dt>
                <dd className="font-medium text-gray-900">
                  {Math.max(0, opportunity.slots - opportunity.filledSlots)} из{" "}
                  {opportunity.slots}
                </dd>
              </div>
            </dl>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Организатор
            </h2>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-base font-bold text-emerald-700">
                {opportunity.organizer.user.name?.[0]?.toUpperCase()}
              </span>
              <div>
                <div className="font-medium text-gray-900">
                  {opportunity.organizer.user.name}
                </div>
                {opportunity.organizer.verified && (
                  <div className="text-xs font-semibold text-emerald-600">
                    ✓ Проверенная организация
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Хотите помочь?
            </h2>
            {actionArea}
          </div>
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