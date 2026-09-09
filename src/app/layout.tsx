import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/skeletons";
import { auth } from "@/lib/auth";
import { getNotifications } from "@/lib/notification-data";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "Волонтёры Беларуси. Единый координационный центр",
    template: "%s | Волонтёры Беларуси",
  },
  description:
    "Единый координационный центр волонтёрской помощи: приюты для животных, помощь пожилым, поиск пропавших людей и благоустройство городов.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 font-sans text-gray-900">
        <Suspense fallback={<HeaderSkeleton />}>
          <SiteHeader />
        </Suspense>
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}

async function SiteHeader() {
  const session = await auth();

const { notifications, unreadCount } = session?.user
    ? await getNotifications(session.user.id)
    : { notifications: [], unreadCount: 0 };
  return <Header session={session} notifications={notifications} unreadCount={unreadCount} />;
}

function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <Skeleton className="flex h-9 w-9 items-center justify-center rounded-xl" />
          <span className="hidden flex-col gap-1.5 sm:flex">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-2.5 w-44" />
          </span>
        </div>
        <nav className="hidden items-center gap-1 lg:flex">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-8 w-20 rounded-lg" />
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex">
          <Skeleton className="h-9 w-20 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>
        <Skeleton className="flex h-10 w-10 items-center justify-center rounded-lg lg:hidden" />
      </div>
    </header>
  );
}