"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { markAllNotificationsRead, refreshNotifications } from "@/lib/actions/notification-actions";

export type BellNotification = {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell({
  notifications: initialNotifications,
  unreadCount,
}: {
  notifications: BellNotification[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  const [data, setData] = useState({ notifications: initialNotifications, unreadCount });
  const [previousNotifications, setPreviousNotifications] = useState(initialNotifications);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);
  const request = useRef(0);
  if (previousNotifications !== initialNotifications) {
    setPreviousNotifications(initialNotifications);
    setData({ notifications: initialNotifications, unreadCount });
  }
  const { notifications, unreadCount: unread } = data;
  async function update(markRead = false) {
    const version = ++request.current;
    setPending(true);
    setError(false);
    try {
      const next = await (markRead ? markAllNotificationsRead() : refreshNotifications());
      if (version === request.current) setData(next);
    } catch {
      if (version === request.current) setError(true);
    } finally {
      if (version === request.current) setPending(false);
    }
  }

  return (
    <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
      <button
        onClick={() => { setOpen(!open); if (!open) void update(); }}
        aria-expanded={open}
        aria-label="Уведомления"
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-[340px] rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <span className="text-sm font-semibold text-gray-900">
              Уведомления
            </span>
            {unread > 0 && (
              <form action={() => update(true)}>
                <button
                  type="submit"
                  disabled={pending}
                  className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Отметить всё прочитанным
                </button>
              </form>
            )}
          </div>

          {error && <p role="alert" className="px-4 py-2 text-sm text-red-700">Не удалось обновить уведомления. Попробуйте ещё раз.</p>}
          <div aria-busy={pending} className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">
                Пока нет уведомлений
              </p>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={n.link ?? "#"}
                  onClick={() => setOpen(false)}
                  className={`block border-b border-gray-50 px-4 py-3 last:border-b-0 hover:bg-gray-50 ${
                    n.read ? "" : "bg-emerald-50/50"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 text-xs leading-relaxed text-gray-500 line-clamp-2">
                          {n.body}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}