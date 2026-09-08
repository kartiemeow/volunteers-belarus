"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user) return;

  await db.notification.updateMany({
    where: { userId: session.user.id, read: false },
    data: { read: true },
  });

  revalidatePath("/", "layout");
}

export async function markNotificationRead(formData: FormData) {
  const session = await auth();
  if (!session?.user) return;
  const notification = await db.notification.findFirst({
    where: { id: String(formData.get("id") ?? ""), userId: session.user.id },
  });
  if (!notification) return;
  await db.notification.update({ where: { id: notification.id }, data: { read: true } });
  revalidatePath("/", "layout");
  const link = notification.link;
  if (link?.startsWith("/") && !link.startsWith("//") && !link.includes("\\")) redirect(link);
}
