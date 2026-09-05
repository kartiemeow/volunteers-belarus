"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import type { Session } from "next-auth";

const NAV_LINKS = [
  { href: "/", label: "Главная" },
  { href: "/zayavki", label: "Заявки" },
  { href: "/napravleniya", label: "Направления" },
  { href: "/novosti", label: "Новости" },
  { href: "/about", label: "О проекте" },
];

const ROLE_HOME: Record<string, string> = {
  VOLUNTEER: "/volunteer",
  ORGANIZER: "/organizer",
  ADMIN: "/admin",
};

export default function Header({ session }: { session: Session | null }) {
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
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white">
            ВБ
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