import type { ApplicationStatus, Prisma } from "@/generated/prisma/client";
import { serializable } from "@/lib/transaction";

export async function reserveApplication(
  opportunityId: string,
  volunteerId: string,
  message?: string,
) {
  return serializable(async (tx) => {
    const opportunity = await tx.opportunity.findUnique({
      where: { id: opportunityId },
    });
    if (!opportunity || opportunity.status !== "OPEN") return false;
    if (opportunity.filledSlots >= opportunity.slots) return false;
    const existing = await tx.application.findUnique({
      where: { opportunityId_volunteerId: { opportunityId, volunteerId } },
    });
    if (existing) return false;
    await tx.opportunity.update({
      where: { id: opportunityId },
      data: { filledSlots: { increment: 1 } },
    });
    await tx.application.create({
      data: { opportunityId, volunteerId, message: message?.trim() || null },
    });
    return true;
  });
}

export async function recomputeVolunteerHours(
  tx: Prisma.TransactionClient,
  volunteerId: string,
) {
  const agg = await tx.application.aggregate({
    where: { volunteerId, status: "DONE" },
    _sum: { hoursLogged: true },
  });
  await tx.volunteerProfile.update({
    where: { id: volunteerId },
    data: { totalHours: agg._sum.hoursLogged ?? 0 },
  });
}

export async function transitionApplication(
  applicationId: string,
  status: ApplicationStatus,
  actor: { organizerUserId: string } | { volunteerUserId: string },
) {
  return serializable(async (tx) => {
    const application = await tx.application.findFirst({
      where: {
        id: applicationId,
        ...("organizerUserId" in actor
          ? { opportunity: { organizer: { userId: actor.organizerUserId } } }
          : {
              volunteer: { userId: actor.volunteerUserId },
              needsReconfirmation: true,
              status: { in: ["PENDING", "APPROVED"] },
            }),
      },
      include: {
        opportunity: { include: { organizer: true } },
        volunteer: {
          select: { userId: true, user: { select: { name: true } } },
        },
      },
    });
    if (!application || application.status === status) return null;
    if ("volunteerUserId" in actor && status !== "REJECTED") return null;
    const { opportunity } = application;
    if (
      (status === "DONE" || status === "NO_SHOW") &&
      (application.status !== "APPROVED" ||
        opportunity.date.getTime() > Date.now())
    )
      return null;
    const heldBefore =
      application.status === "PENDING" || application.status === "APPROVED";
    const holdsAfter = status === "PENDING" || status === "APPROVED";
    if (
      !heldBefore &&
      holdsAfter &&
      (opportunity.status !== "OPEN" ||
        opportunity.filledSlots >= opportunity.slots)
    )
      return null;
    if (heldBefore !== holdsAfter) {
      await tx.opportunity.update({
        where: { id: opportunity.id },
        data: { filledSlots: { increment: holdsAfter ? 1 : -1 } },
      });
    }
    await tx.application.update({
      where: { id: applicationId },
      data: { status, ...(!holdsAfter ? { needsReconfirmation: false } : {}) },
    });
    if (status === "DONE" || application.status === "DONE")
      await recomputeVolunteerHours(tx, application.volunteerId);
    if ("volunteerUserId" in actor) {
      await tx.notification.create({
        data: {
          userId: opportunity.organizer.userId,
          type: "PARTICIPATION_DECLINED",
          title: "Волонтёр отказался от участия",
          body: `${application.volunteer.user.name} отказался от участия в «${opportunity.title}» после переноса даты события.`,
          link: `/organizer/opportunities/${opportunity.id}`,
        },
      });
    } else if (status === "APPROVED" || status === "DONE") {
      await tx.notification.create({
        data: {
          userId: application.volunteer.userId,
          type:
            status === "DONE"
              ? "PARTICIPATION_CONFIRMED"
              : "APPLICATION_APPROVED",
          title:
            status === "DONE"
              ? "Выполнение подтверждено. Оцените организацию!"
              : "Ваш отклик одобрен",
          body: `Организация «${opportunity.organizer.orgName}» ${status === "DONE" ? "подтвердила выполнение" : "одобрила ваш отклик на заявку"} «${opportunity.title}».`,
          link:
            status === "DONE"
              ? `/ocenit/${applicationId}`
              : `/zayavki/${opportunity.id}`,
        },
      });
    }
    return opportunity.id;
  });
}
