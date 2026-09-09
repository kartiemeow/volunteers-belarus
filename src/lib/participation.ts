import type { ApplicationStatus, Prisma } from "@/generated/prisma/client";
import { ActionError } from "@/lib/action-result";

export const ACTIVE_STATUSES: ApplicationStatus[] = ["PENDING", "APPROVED"];

export async function recomputeVolunteerHours(tx: Prisma.TransactionClient, volunteerId: string) {
  const hours = await tx.application.aggregate({
    where: { volunteerId, status: "DONE" }, _sum: { hoursLogged: true },
  });
  await tx.volunteerProfile.update({ where: { id: volunteerId }, data: { totalHours: hours._sum.hoursLogged ?? 0 } });
}

export async function changeParticipation(
  tx: Prisma.TransactionClient, applicationId: string, userId: string,
  role: "VOLUNTEER" | "ORGANIZER", status: ApplicationStatus,
) {
  const app = await tx.application.findFirst({
    where: { id: applicationId, ...(role === "ORGANIZER"
      ? { opportunity: { organizer: { userId } } } : { volunteer: { userId } }) },
    include: { opportunity: { include: { organizer: true } }, volunteer: { include: { user: true } } },
  });
  if (!app) throw new ActionError("Отклик не найден");
  if (app.status === status) return app;
  const active = ACTIVE_STATUSES.includes(app.status);
  const attendance = status === "DONE" || status === "NO_SHOW";
  if (role === "VOLUNTEER") {
    if (status !== "WITHDRAWN" || !active) throw new ActionError("Этот отклик уже нельзя отменить");
    if (!app.needsReconfirmation && app.opportunity.date <= new Date()) {
      throw new ActionError("Событие уже началось. Свяжитесь с организатором");
    }
  } else {
    const allowed = app.status === "PENDING" ? ["APPROVED", "REJECTED"]
      : app.status === "APPROVED" ? ["DONE", "NO_SHOW"] : [];
    if (!allowed.includes(status)) throw new ActionError("Этот переход статуса недоступен");
    if (attendance && (app.needsReconfirmation || app.opportunity.date > new Date())) {
      throw new ActionError("Явку можно отметить после начала события и подтверждения новой даты");
    }
  }
  const changed = await tx.application.updateMany({
    where: { id: app.id, status: app.status, updatedAt: app.updatedAt },
    data: { status, needsReconfirmation: status === "APPROVED" && app.needsReconfirmation },
  });
  if (!changed.count) throw new ActionError("Отклик уже изменён. Обновите страницу");
  if (active && !ACTIVE_STATUSES.includes(status)) {
    await tx.opportunity.update({ where: { id: app.opportunityId }, data: { filledSlots: { decrement: 1 } } });
  }
  if (status === "DONE") await recomputeVolunteerHours(tx, app.volunteerId);
  if (status === "APPROVED" || status === "DONE") {
    await tx.notification.create({ data: {
      userId: app.volunteer.userId,
      type: status === "APPROVED" ? "APPLICATION_APPROVED" : "PARTICIPATION_CONFIRMED",
      title: status === "APPROVED" ? "Ваш отклик одобрен" : "Выполнение подтверждено. Оцените организацию!",
      body: `«${app.opportunity.title}» — ${app.opportunity.organizer.orgName}`,
      link: status === "DONE" ? `/ocenit/${app.id}` : "/volunteer",
    } });
  }
  if (status === "WITHDRAWN") {
    await tx.notification.create({ data: {
      userId: app.opportunity.organizer.userId, type: "PARTICIPATION_DECLINED",
      title: "Волонтёр отменил участие", body: `${app.volunteer.user.name}: «${app.opportunity.title}»`,
      link: `/organizer/opportunities/${app.opportunityId}`,
    } });
  }
  return app;
}
