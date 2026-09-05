"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { ApplicationStatus } from "@/generated/prisma/client";

export async function setApplicationStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORGANIZER") return;

  const applicationId = String(formData.get("applicationId") ?? "");
  const status = String(formData.get("status") ?? "") as ApplicationStatus;

  if (!["PENDING", "APPROVED", "REJECTED", "DONE"].includes(status)) return;

  const application = await db.application.findFirst({
    where: {
      id: applicationId,
      opportunity: { organizer: { userId: session.user.id } },
    },
    include: { opportunity: true },
  });
  if (!application) return;

  const opportunity = application.opportunity;

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

  await db.application.update({
    where: { id: applicationId },
    data: { status },
  });

  if (status === "DONE" || application.status === "DONE") {
    await recomputeVolunteerHours(application.volunteerId);
  }

  revalidatePath(`/organizer/opportunities/${opportunity.id}`);
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