import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatEventDate } from "@/lib/dates";
import { markAllNotificationsRead, markNotificationRead } from "@/lib/actions/notification-actions";

export default async function NotificationsPage({ searchParams }: PageProps<"/uvedomleniya">) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/uvedomleniya");
  const params = await searchParams;
  const requested = Number(params.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? Math.min(requested, 10000) : 1;
  const selected = typeof params.notification === "string" ? params.notification : "";
  const where = { userId: session.user.id, ...(selected ? { id: selected } : {}) };
  const [notifications, count] = await Promise.all([
    db.notification.findMany({ where, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 20, skip: (page - 1) * 20 }),
    db.notification.count({ where }),
  ]);
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900">Уведомления</h1>
        <form action={markAllNotificationsRead}><button className="text-sm font-medium text-emerald-700 hover:underline">Отметить всё прочитанным</button></form>
      </div>
      {selected && <Link href="/uvedomleniya" className="mt-4 inline-block text-sm text-emerald-700 hover:underline">Все уведомления</Link>}
      <div className="mt-6 space-y-4">
        {notifications.length === 0 && <p className="rounded-2xl border border-gray-200 bg-white p-8 text-gray-500">Уведомлений пока нет.</p>}
        {notifications.map((notification) => (
          <article key={notification.id} className={`rounded-2xl border p-6 ${notification.read ? "border-gray-200 bg-white" : "border-emerald-200 bg-emerald-50"}`}>
            <time dateTime={notification.createdAt.toISOString()} className="text-xs text-gray-500">{formatEventDate(notification.createdAt)}</time>
            <h2 className="mt-2 text-lg font-semibold text-gray-900">{notification.title}</h2>
            <p className="mt-2 whitespace-pre-line text-sm text-gray-600">{notification.body}</p>
            <form action={markNotificationRead} className="mt-4">
              <input type="hidden" name="id" value={notification.id} />
              <button className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                {notification.link ? "Прочитать и перейти" : "Отметить прочитанным"}
              </button>
            </form>
          </article>
        ))}
      </div>
      <nav aria-label="Страницы уведомлений" className="mt-6 flex gap-4 text-sm font-medium text-emerald-700">
        {!selected && page > 1 && <Link href={`/uvedomleniya?page=${page - 1}`}>Назад</Link>}
        {!selected && page * 20 < count && <Link href={`/uvedomleniya?page=${page + 1}`}>Далее</Link>}
      </nav>
    </div>
  );
}
