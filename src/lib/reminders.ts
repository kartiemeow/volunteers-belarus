import { db } from "@/lib/db";
import { transaction } from "@/lib/transaction";
import { ACTIVE_STATUSES } from "@/lib/participation";

export async function sendAttendanceReminders() {
  const now = new Date();
  const expired = await db.application.findMany({ where: {
    needsReconfirmation: true, status: { in: ACTIVE_STATUSES }, opportunity: { date: { lte: now } },
  }, select: { id: true } });
  for (const { id } of expired) {
    await transaction(async (tx) => {
      const app = await tx.application.findFirst({ where: {
        id, needsReconfirmation: true, status: { in: ACTIVE_STATUSES }, opportunity: { date: { lte: now } },
      }, include: { opportunity: { include: { organizer: true } }, volunteer: true } });
      if (!app) return;
      await tx.application.update({ where: { id }, data: { status: "WITHDRAWN", needsReconfirmation: false } });
      await tx.opportunity.update({ where: { id: app.opportunityId }, data: { filledSlots: { decrement: 1 } } });
      await tx.notification.createMany({ data: [app.volunteer.userId, app.opportunity.organizer.userId].map((userId) => ({
        userId, type: "PARTICIPATION_DECLINED" as const, title: "Новая дата не подтверждена",
        body: `Участие в «${app.opportunity.title}» отменено без отметки о неявке.`,
        link: userId === app.volunteer.userId ? "/volunteer" : `/organizer/opportunities/${app.opportunityId}`,
      })) });
    });
  }
  const opportunities = await db.opportunity.findMany({ where: {
    date: { lte: now }, applications: { some: { status: "APPROVED", needsReconfirmation: false } },
  }, include: { organizer: true } });
  for (const opportunity of opportunities) {
    const dedupeKey = `attendance:${opportunity.id}:${opportunity.date.toISOString()}`;
    await db.notification.createMany({ skipDuplicates: true, data: [{
      dedupeKey, userId: opportunity.organizer.userId, type: "ATTENDANCE_REMINDER",
      title: "Отметьте явку волонтёров", body: `Событие «${opportunity.title}» уже началось. После его окончания отметьте результат участия.`,
      link: `/organizer/opportunities/${opportunity.id}`,
    }] });
  }
  await db.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 86400000) } } });
  await db.emailVerification.deleteMany({ where: { expiresAt: { lt: new Date(now.getTime() - 86400000) } } });
  return { expired: expired.length, reminders: opportunities.length };
}
