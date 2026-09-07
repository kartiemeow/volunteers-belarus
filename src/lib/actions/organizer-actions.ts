"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";
import type { ApplicationStatus } from "@/generated/prisma/client";
import type { OpportunityFormState } from "./opportunity-actions";

export async function setApplicationStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORGANIZER") return;

  const applicationId = String(formData.get("applicationId") ?? "");
  const status = String(formData.get("status") ?? "") as ApplicationStatus;

  if (!["PENDING", "APPROVED", "REJECTED", "DONE", "NO_SHOW"].includes(status))
    return;

  const application = await db.application.findFirst({
    where: {
      id: applicationId,
      opportunity: { organizer: { userId: session.user.id } },
    },
    include: {
      opportunity: { include: { organizer: { include: { user: true } } } },
    },
  });
  if (!application) return;

  const opportunity = application.opportunity;

  const isAttendance = status === "DONE" || status === "NO_SHOW";
  if (isAttendance && application.status !== "APPROVED") return;
  if (isAttendance && opportunity.date.getTime() > Date.now()) return;

  if (status === "APPROVED" && application.status !== "APPROVED") {
    if (opportunity.filledSlots >= opportunity.slots) return;
    await db.opportunity.update({
      where: { id: opportunity.id },
      data: { filledSlots: { increment: 1 } },
    });
  }

  if (application.status === "APPROVED" && status !== "APPROVED") {
    await db.opportunity.update({
      where: { id: opportunity.id },
      data: { filledSlots: { decrement: 1 } },
    });
  }

  const changedFrom = application.status;
  await db.application.update({
    where: { id: applicationId },
    data: { status },
  });

  if (
    (status === "DONE" && changedFrom === "APPROVED") ||
    (changedFrom === "DONE" && application.status !== "DONE")
  ) {
    await recomputeVolunteerHours(application.volunteerId);
  }

  if (status === "APPROVED" && changedFrom !== "APPROVED") {
    const volunteer = await db.volunteerProfile.findUnique({
      where: { id: application.volunteerId },
      include: { user: true },
    });
    if (volunteer) {
      await notifyUser(
        volunteer.userId,
        "APPLICATION_APPROVED",
        "Ваш отклик одобрен",
        `Организация «${opportunity.organizer.orgName}» одобрила ваш отклик на заявку «${opportunity.title}».`,
        `/zayavki/${opportunity.id}`
      );
    }
  }

  if (status === "DONE" && changedFrom !== "DONE") {
    const volunteer = await db.volunteerProfile.findUnique({
      where: { id: application.volunteerId },
      include: { user: true },
    });
    if (volunteer) {
      await notifyUser(
        volunteer.userId,
        "PARTICIPATION_CONFIRMED",
        "Выполнение подтверждено. Оцените организацию!",
        `Организация «${opportunity.organizer.orgName}» подтвердила, что вы выполнили заявку «${opportunity.title}». Будем рады, если вы оцените работу организации.`,
        `/ocenit/${applicationId}`
      );
    }
  }

  revalidatePath(`/organizer/opportunities/${opportunity.id}`);
  revalidatePath("/organizer");
  revalidatePath("/volunteer");
}

export async function setApplicationHours(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORGANIZER") return;

  const applicationId = String(formData.get("applicationId") ?? "");
  const hours = Math.max(0, Math.min(24, Number(formData.get("hours") ?? 0)));

  const application = await db.application.findFirst({
    where: {
      id: applicationId,
      opportunity: { organizer: { userId: session.user.id } },
    },
    include: { opportunity: true },
  });
  if (!application) return;

  await db.application.update({
    where: { id: applicationId },
    data: { hoursLogged: hours },
  });

  await recomputeVolunteerHours(application.volunteerId);

  revalidatePath(`/organizer/opportunities/${application.opportunity.id}`);
  revalidatePath("/organizer");
  revalidatePath("/volunteer");
}

async function recomputeVolunteerHours(volunteerId: string) {
  const agg = await db.application.aggregate({
    where: { volunteerId, status: "DONE" },
    _sum: { hoursLogged: true },
  });
  await db.volunteerProfile.update({
    where: { id: volunteerId },
    data: { totalHours: agg._sum.hoursLogged ?? 0 },
  });
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

  await db.opportunity.update({
    where: { id },
    data: { date: newDate },
  });

  const affectedApplications = await db.application.findMany({
    where: { opportunityId: id, status: { in: ["PENDING", "APPROVED"] } },
    include: {
      volunteer: { include: { user: true } },
      opportunity: { include: { organizer: true } },
    },
  });

  if (affectedApplications.length > 0) {
    await db.application.updateMany({
      where: { opportunityId: id, status: { in: ["PENDING", "APPROVED"] } },
      data: { needsReconfirmation: true },
    });
  }

  const newLabel = formatFullDate(newDate);
  for (const app of affectedApplications) {
    await notifyUser(
      app.volunteer.userId,
      "DATE_CHANGED",
      "Дата события изменена",
      `Организация «${app.opportunity.organizer.orgName}» перенесла событие «${app.opportunity.title}». Новая дата: ${newLabel}. Подтвердите участие или откажитесь в личном кабинете.`,
      "/volunteer"
    );
  }

  revalidatePath(`/organizer/opportunities/${id}`);
  revalidatePath("/organizer");
  revalidatePath(`/zayavki/${id}`);
  revalidatePath("/zayavki");
  revalidatePath("/volunteer");

  return {
    success: `Дата события изменена. Волонтёры уведомлены (${affectedApplications.length}).`,
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