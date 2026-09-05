"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export type ApplicationState = { error?: string; success?: string } | undefined;

const applySchema = z.object({
  opportunityId: z.string().min(1),
  message: z.string().max(2000).optional().or(z.literal("")),
});

export async function applyToOpportunity(
  prevState: ApplicationState,
  formData: FormData
): Promise<ApplicationState> {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?next=/zayavki/${formData.get("opportunityId")}`);
  }
  if (session.user.role !== "VOLUNTEER") {
    return { error: "Откликнуться на заявку могут только волонтёры" };
  }

  const parsed = applySchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Не удалось отправить отклик: проверьте данные" };
  }

  const { opportunityId, message } = parsed.data;

  const profile = await db.volunteerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return { error: "Сначала заполните профиль волонтёра" };
  }

  const opportunity = await db.opportunity.findUnique({
    where: { id: opportunityId },
  });
  if (!opportunity) {
    return { error: "Заявка не найдена" };
  }
  if (opportunity.status !== "OPEN") {
    return { error: "Набор на эту заявку уже закрыт" };
  }
  if (opportunity.filledSlots >= opportunity.slots) {
    return { error: "Все места уже заняты" };
  }

  const existing = await db.application.findUnique({
    where: {
      opportunityId_volunteerId: {
        opportunityId,
        volunteerId: profile.id,
      },
    },
  });
  if (existing) {
    return { error: "Вы уже отправляли отклик на эту заявку" };
  }

  await db.application.create({
    data: {
      opportunityId,
      volunteerId: profile.id,
      message: message?.trim() || null,
    },
  });

  revalidatePath(`/zayavki/${opportunityId}`);
  return { success: "Отклик отправлен! Организатор свяжется с вами." };
}

export async function toggleOpportunityStatus(formData: FormData) {
  const session = await auth();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!session?.user || session.user.role !== "ORGANIZER") return;

  const opportunity = await db.opportunity.findFirst({
    where: {
      id,
      organizer: { userId: session.user.id },
    },
  });
  if (!opportunity) return;

  await db.opportunity.update({
    where: { id },
    data: { status: status as "OPEN" | "CLOSED" },
  });

  revalidatePath(`/zayavki/${id}`);
  revalidatePath("/organizer");
}