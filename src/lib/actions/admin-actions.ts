"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function verifyOrganization(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const profileId = String(formData.get("profileId") ?? "");
  const verified = formData.get("verified") === "true";

  await db.organizationProfile.update({
    where: { id: profileId },
    data: { verified },
  });

  revalidatePath("/admin");
  revalidatePath("/zayavki");
}

export async function setOpportunityStatus(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");

  if (!["OPEN", "CLOSED", "COMPLETED"].includes(status)) return;

  await db.opportunity.update({
    where: { id },
    data: { status: status as "OPEN" | "CLOSED" | "COMPLETED" },
  });

  revalidatePath("/admin");
  revalidatePath("/zayavki");
}