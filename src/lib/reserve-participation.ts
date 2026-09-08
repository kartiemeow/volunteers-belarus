import { transaction } from "@/lib/transaction";
import { ActionError } from "@/lib/action-result";

export async function reserveParticipation(userId: string, opportunityId: string, message?: string) {
  return transaction(async (tx) => {
    const profile = await tx.volunteerProfile.findUnique({ where: { userId }, include: { user: true } });
    if (!profile?.user.city || !profile.user.phone) throw new ActionError("Заполните город и телефон в профиле волонтёра");
    const opportunity = await tx.opportunity.findUnique({ where: { id: opportunityId } });
    if (!opportunity || opportunity.status !== "OPEN" || opportunity.date <= new Date()) throw new ActionError("Набор на эту заявку уже закрыт");
    const existing = await tx.application.findUnique({ where: { opportunityId_volunteerId: { opportunityId, volunteerId: profile.id } } });
    if (existing) throw new ActionError("Вы уже отправляли отклик. Повторная запись недоступна — свяжитесь с организатором");
    const reserved = await tx.opportunity.updateMany({
      where: { id: opportunityId, status: "OPEN", date: { gt: new Date() }, filledSlots: { lt: opportunity.slots } },
      data: { filledSlots: { increment: 1 } },
    });
    if (!reserved.count) throw new ActionError("Все места уже заняты");
    await tx.application.create({ data: { opportunityId, volunteerId: profile.id, message: message?.trim() || null } });
  });
}
