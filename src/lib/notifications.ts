import { db } from "@/lib/db";
import type { NotificationType } from "@/generated/prisma/client";

export async function notifyUser(
  userId: string,
  type: NotificationType,
  title: string,
  body: string | null,
  link: string | null
) {
  await db.notification.create({
    data: { userId, type, title, body, link },
  });
}