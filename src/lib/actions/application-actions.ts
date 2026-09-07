"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

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

  const noSlots = new Error("no-slots");
  try {
    await db.$transaction(async (tx) => {
      const reserved = await tx.opportunity.updateMany({
        where: { id: opportunityId, filledSlots: { lt: opportunity.slots } },
        data: { filledSlots: { increment: 1 } },
      });
      if (reserved.count === 0) throw noSlots;
      await tx.application.create({
        data: {
          opportunityId,
          volunteerId: profile.id,
          message: message?.trim() || null,
        },
      });
    });
  } catch (err) {
    if (err === noSlots) {
      return { error: "Все места уже заняты" };
    }
    return { error: "Не удалось отправить отклик. Попробуйте ещё раз." };
  }

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

export async function confirmParticipation(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VOLUNTEER") return;

  const applicationId = String(formData.get("applicationId") ?? "");
  const volunteer = await db.volunteerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!volunteer) return;

  const application = await db.application.findFirst({
    where: { id: applicationId, volunteerId: volunteer.id },
  });
  if (!application || !application.needsReconfirmation) return;
  if (application.status !== "PENDING" && application.status !== "APPROVED") return;

  await db.application.update({
    where: { id: applicationId },
    data: { needsReconfirmation: false },
  });

  revalidatePath("/volunteer");
  revalidatePath(`/zayavki/${application.opportunityId}`);
  revalidatePath(`/organizer/opportunities/${application.opportunityId}`);
}

export async function declineParticipation(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "VOLUNTEER") return;

  const applicationId = String(formData.get("applicationId") ?? "");
  const volunteer = await db.volunteerProfile.findUnique({
    where: { userId: session.user.id },
    include: { user: { select: { name: true } } },
  });
  if (!volunteer) return;

  const application = await db.application.findFirst({
    where: { id: applicationId, volunteerId: volunteer.id },
    include: {
      opportunity: { include: { organizer: { include: { user: true } } } },
    },
  });
  if (!application || !application.needsReconfirmation) return;

  if (application.status === "PENDING" || application.status === "APPROVED") {
    await db.opportunity.update({
      where: { id: application.opportunityId },
      data: {
        filledSlots: {
          decrement: application.opportunity.filledSlots > 0 ? 1 : 0,
        },
      },
    });
  }

  await db.application.update({
    where: { id: applicationId },
    data: { status: "REJECTED", needsReconfirmation: false },
  });

  await notifyUser(
    application.opportunity.organizer.userId,
    "PARTICIPATION_DECLINED",
    "Волонтёр отказался от участия",
    `${volunteer.user.name} отказался от участия в «${application.opportunity.title}» после переноса даты события.`,
    `/organizer/opportunities/${application.opportunityId}`
  );

  revalidatePath("/volunteer");
  revalidatePath(`/zayavki/${application.opportunityId}`);
  revalidatePath(`/organizer/opportunities/${application.opportunityId}`);
  revalidatePath("/zayavki");
  revalidatePath("/organizer");
}