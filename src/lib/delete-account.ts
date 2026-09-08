import { transaction } from "@/lib/transaction";
import { recomputeVolunteerHours, ACTIVE_STATUSES } from "@/lib/participation";

export async function deleteAccount(userId: string) {
  await transaction(async (tx) => {
    const user = await tx.user.findUnique({ where: { id: userId }, include: { volunteerProfile: true, organizationProfile: true } });
    if (!user || user.role === "ADMIN") return;
    const apps = await tx.application.findMany({
      where: { OR: [
        { volunteer: { userId } }, { opportunity: { organizer: { userId } } },
      ] }, select: { opportunityId: true, volunteerId: true },
    });
    await tx.user.delete({ where: { id: userId } });
    for (const id of new Set(apps.map((a) => a.opportunityId))) {
      if (!await tx.opportunity.findUnique({ where: { id } })) continue;
      const count = await tx.application.count({ where: { opportunityId: id, status: { in: ACTIVE_STATUSES } } });
      await tx.opportunity.update({ where: { id }, data: { filledSlots: count } });
    }
    for (const id of new Set(apps.map((a) => a.volunteerId))) {
      if (await tx.volunteerProfile.findUnique({ where: { id } })) await recomputeVolunteerHours(tx, id);
    }
  });
}
