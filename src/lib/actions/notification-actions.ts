"use server";

import { revalidatePath } from "next/cache";

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