"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { deleteAccount } from "@/lib/delete-account";
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

  revalidatePath("/", "layout");
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

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/zayavki");
}

export async function deleteUser(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const userId = String(formData.get("userId") ?? "");
  if (!userId || userId === session.user.id) return;

  const target = await db.user.findUnique({ where: { id: userId } });
  if (!target || target.role === "ADMIN") return;

  await deleteAccount(userId);

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/zayavki");
}

export async function deleteOrganization(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const orgId = String(formData.get("orgId") ?? "");
  if (!orgId) return;

  const org = await db.organizationProfile.findUnique({
    where: { id: orgId },
    include: { user: true },
  });
  if (!org || org.user.role === "ADMIN") return;

  await deleteAccount(org.userId);

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/zayavki");
}