import { db } from "@/lib/db";

export async function getNotifications(userId: string) {
  const [notifications, unreadCount] = await Promise.all([
    db.notification.findMany({
      where: { userId },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 10,
      select: {
        id: true,
        title: true,
        body: true,
        link: true,
        read: true,
        createdAt: true,
      },
    }),
    db.notification.count({ where: { userId, read: false } }),
  ]);
  return {
    notifications: notifications.map((n) => ({
      ...n,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  };
}
