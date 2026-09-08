"use server";

import { revalidatePath, updateTag } from "next/cache";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { transitionApplication, recomputeVolunteerHours } from "@/lib/application-service";
import { serializable } from "@/lib/transaction";
import type { ApplicationStatus } from "@/generated/prisma/client";
import type { OpportunityFormState } from "./opportunity-actions";

export async function setApplicationStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORGANIZER") return;

  const applicationId = String(formData.get("applicationId") ?? "");
  const status = String(formData.get("status") ?? "") as ApplicationStatus;

  if (!["PENDING", "APPROVED", "REJECTED", "DONE", "NO_SHOW"].includes(status))
    return;

  const opportunityId = await transitionApplication(applicationId, status, { organizerUserId: session.user.id });
  if (!opportunityId) return;
  updateTag("opportunities");
  updateTag("organizations");
  updateTag("statistics");
  revalidatePath(`/zayavki/${opportunityId}`);

  revalidatePath(`/organizer/opportunities/${opportunityId}`);
  revalidatePath("/organizer");
  revalidatePath("/volunteer");
  revalidatePath("/zayavki");
}

export async function setApplicationHours(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORGANIZER") return;

  const applicationId = String(formData.get("applicationId") ?? "");
  const hours = Math.max(0, Math.min(24, Number(formData.get("hours") ?? 0)));

  if (!Number.isInteger(hours)) return;
  const opportunityId = await serializable(async (tx) => {
    const application = await tx.application.findFirst({
      where: { id: applicationId, opportunity: { organizer: { userId: session.user.id } } },
    });
    if (!application) return null;
    await tx.application.update({ where: { id: applicationId }, data: { hoursLogged: hours } });
    await recomputeVolunteerHours(tx, application.volunteerId);
    return application.opportunityId;
  });
  if (!opportunityId) return;

  revalidatePath(`/organizer/opportunities/${opportunityId}`);
  revalidatePath("/organizer");
  revalidatePath("/volunteer");
}

export async function rescheduleOpportunity(
  prevState: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORGANIZER") {
    return { error: "Доступно только организациям" };
  }

  const id = String(formData.get("id") ?? "");
  const dateRaw = String(formData.get("date") ?? "");
  const newDate = new Date(dateRaw);
  if (Number.isNaN(newDate.getTime())) {
    return { error: "Укажите корректную дату и время" };
  }

  const opportunity = await db.opportunity.findFirst({
    where: { id, organizer: { userId: session.user.id } },
  });
  if (!opportunity) return { error: "Заявка не найдена" };

  if (opportunity.date.getTime() === newDate.getTime()) {
    return { success: "Дата не изменилась" };
  }

  if (newDate.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
    return { error: "Новая дата не может быть в прошлом" };
  }

  const affectedCount = await serializable(async (tx) => {
    const current = await tx.opportunity.findFirst({ where: { id, organizer: { userId: session.user.id } }, include: { organizer: true } });
    if (!current || current.date.getTime() === newDate.getTime()) return 0;
    await tx.opportunity.update({ where: { id }, data: { date: newDate } });
    const affected = await tx.application.findMany({
      where: { opportunityId: id, status: { in: ["PENDING", "APPROVED"] } },
      select: { volunteer: { select: { userId: true } } },
    });
    await tx.application.updateMany({
      where: { opportunityId: id, status: { in: ["PENDING", "APPROVED"] } },
      data: { needsReconfirmation: true },
    });
    for (let offset = 0; offset < affected.length; offset += 500) {
      await tx.notification.createMany({ data: affected.slice(offset, offset + 500).map((app) => ({
        userId: app.volunteer.userId, type: "DATE_CHANGED", title: "Дата события изменена",
        body: `Организация «${current.organizer.orgName}» перенесла событие «${current.title}». Новая дата: ${formatFullDate(newDate)}. Подтвердите участие или откажитесь в личном кабинете.`,
        link: "/volunteer",
      })) });
    }
    return affected.length;
  });

  updateTag("opportunities");
  updateTag("organizations");
  updateTag("statistics");
  revalidatePath(`/organizer/opportunities/${id}`);
  revalidatePath("/organizer");
  revalidatePath(`/zayavki/${id}`);
  revalidatePath("/zayavki");
  revalidatePath("/volunteer");

  return {
    success: `Дата события изменена. Волонтёры уведомлены (${affectedCount}).`,
  };
}

function formatFullDate(d: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}
