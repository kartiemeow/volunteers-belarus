"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { notifyUser } from "@/lib/notifications";

export type RatingState = { error?: string; success?: string } | undefined;

const ratingSchema = z.object({
  applicationId: z.string().min(1),
  score: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional().or(z.literal("")),
});

export async function submitRating(
  prevState: RatingState,
  formData: FormData
): Promise<RatingState> {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/zayavki");
  if (session.user.role !== "VOLUNTEER") {
    return { error: "Оценить организацию могут только волонтёры" };
  }

  const parsed = ratingSchema.safeParse(Object.fromEntries(formData.entries()));
  if (!parsed.success) {
    return { error: "Проверьте данные: оценка должна быть от 1 до 5" };
  }

  const { applicationId, score, comment } = parsed.data;

  const profile = await db.volunteerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) {
    return { error: "Сначала заполните профиль волонтёра" };
  }

  const application = await db.application.findFirst({
    where: { id: applicationId, volunteerId: profile.id, status: "DONE" },
    include: { opportunity: { include: { organizer: true } } },
  });
  if (!application) {
    return { error: "Выполненная заявка не найдена" };
  }

  const existing = await db.rating.findUnique({
    where: { applicationId },
  });
  if (existing) {
    return { error: "Вы уже оценили эту организацию" };
  }

  await db.rating.create({
    data: {
      applicationId: application.id,
      volunteerId: profile.id,
      organizationId: application.opportunity.organizerId,
      score,
      comment: comment?.trim() || null,
    },
  });

  await notifyUser(
    application.opportunity.organizer.userId,
    "RATING_RECEIVED",
    "Вам оставили новую оценку",
    `Волонтёр ${session.user.name} оценил вашу работу на ${score} из 5.`,
    "/organizer"
  );

  revalidatePath(`/ocenit/${applicationId}`);
  revalidatePath("/volunteer");
  revalidatePath(`/zayavki/${application.opportunity.id}`);
  revalidatePath("/organizer");

  return { success: "Спасибо! Ваша оценка опубликована." };
}