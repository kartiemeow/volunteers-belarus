"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";
import NotificationBell, {
  type BellNotification,
} from "@/components/NotificationBell";

const NAV_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/zayavki", label: "Заявки" },
  { href: "/organizacii", label: "Организации" },
  { href: "/napravleniya", label: "Направления" },
  { href: "/novosti", label: "Новости" },
  { href: "/about", label: "О проекте" },
];

const ROLE_HOME: Record<string, string> = {
  VOLUNTEER: "/volunteer",
  ORGANIZER: "/organizer",
  ADMIN: "/admin",
};

export default function Header({
  session,
  notifications = [],
}: {
  session: Session | null;
  notifications?: BellNotification[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const user = session?.user;
  const roleHome = user ? ROLE_HOME[user.role] ?? "/" : "/";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600">
            <svg viewBox="0 0 36 36" className="h-7 w-7" fill="#ffffff" aria-hidden="true">
              <path d="M13.996 23.498a10.866 10.866 0 0 1-5.905-5.316 7.288 7.288 0 0 1-.5-5.225 2.849 2.849 0 0 1 1.844-1.936 4.835 4.835 0 0 1 3.121.021l1.741.607c.449.225.791.619.95 1.096l.436 1.307c.19.566.72.948 1.317.948 0 0 1 0 1-1v-2.22a3.8 3.8 0 0 0-1.368-2.92l-3.82-3.183a2.001 2.001 0 0 0-1.83-.387L5.614 6.825a2 2 0 0 0-1.013.673L0 12v8.77l1.266 3.142 3.179 1.419C5.128 25.127 5.838 25 6.5 25c2.694 0 6.023.642 8.905 2.804l.937.703a.949.949 0 0 0 1.239-.088L18 28v-2c0-1-4.004-2.502-4.004-2.502z"/>
              <path d="M31.399 7.498a2 2 0 0 0-1.012-.674L25.018 5.29a2 2 0 0 0-1.83.387l-3.82 3.183A3.8 3.8 0 0 0 18 11.78V14c0 1 1 1 1 1 .597 0 1.127-.382 1.316-.949l.436-1.307c.159-.477.501-.871.95-1.096l1.741-.607a4.835 4.835 0 0 1 3.121-.021 2.85 2.85 0 0 1 1.844 1.936 7.288 7.288 0 0 1-.5 5.225 10.87 10.87 0 0 1-5.905 5.316C22.004 23.498 18 25 18 26v2l.419.419a.949.949 0 0 0 1.239.088l.937-.703C23.477 25.642 26.806 25 29.5 25c.661 0 1.372.128 2.054.332l3.18-1.42L36 20.77V12l-4.601-4.502z"/>
              <path d="M4.445 25.331c-1.571-1.3-2.176-.836-3.179-2.419-.085-.13-1.06-2.083-1.266-2.142V28l1.967-1.475c.636-.477 1.532-.91 2.479-1.193l-.001-.001zm30.289-2.419c-1.003 1.583-1.608 1.119-3.18 2.42.948.283 1.843.716 2.479 1.193L36 28v-7.23c-.206.059-1.181 2.012-1.266 2.142z"/>
            </svg>
          </span>
          <span className="hidden flex-col leading-tight sm:flex">
            <span className="text-sm font-bold text-gray-900">
              Волонтёры Беларуси
            </span>
            <span className="text-[11px] text-gray-500">
              единый координационный центр
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <NotificationBell notifications={notifications} />
              <div className="relative">
              <button
                onClick={() => setProfileOpen((v) => !v)}
                onBlur={() => setTimeout(() => setProfileOpen(false), 150)}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-800 hover:border-emerald-400 hover:bg-emerald-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                  {user.name?.[0]?.toUpperCase()}
                </span>
                <span className="max-w-[120px] truncate">{user.name}</span>
              </button>
              {profileOpen && (
                <div className="absolute right-0 top-12 w-56 rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                  <Link
                    href={roleHome}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    Личный кабинет
                  </Link>
                  {user.role === "ORGANIZER" && (
                    <Link
                      href="/organizer/create"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Создать заявку
                    </Link>
                  )}
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Выйти
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link
              href="/login"
              className="rounded-lg px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Войти
            </Link>
              <Link
                href="/register"
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Стать волонтёром
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 md:hidden"
          aria-label="Меню"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <>
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </>
            ) : (
              <>
                <path d="M3 6h18" />
                <path d="M3 12h18" />
                <path d="M3 18h18" />
              </>
            )}
          </svg>
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium ${
                  isActive(link.href)
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-gray-100 pt-3">
              {user ? (
                <>
                  <Link
                    href={roleHome}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                  >
                    Личный кабинет
                  </Link>
                  {user.role === "ORGANIZER" && (
                    <Link
                      href="/organizer/create"
                      onClick={() => setMobileOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
                    >
                      Создать заявку
                    </Link>
                  )}
                  <div className="flex items-center justify-between rounded-lg px-3 py-1.5">
                    <span className="text-sm font-medium text-gray-700">
                      Уведомления
                    </span>
                    <NotificationBell notifications={notifications} />
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/" })}
                    className="block w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <div className="flex gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-medium text-gray-700"
                  >
                    Войти
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileOpen(false)}
                    className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-center text-sm font-semibold text-white"
                  >
                    Регистрация
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}