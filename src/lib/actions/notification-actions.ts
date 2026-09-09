"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getNotifications } from "@/lib/notification-data";

export async function refreshNotifications() {
  const session = await auth();
  if (!session?.user) return { notifications: [], unreadCount: 0 };
  return getNotifications(session.user.id);
}

export async function markAllNotificationsRead() {
  const session = await auth();
  if (!session?.user) return { notifications: [], unreadCount: 0 };
  await db.notification.updateMany({ where: { userId: session.user.id, read: false }, data: { read: true } });
  return getNotifications(session.user.id);
}
