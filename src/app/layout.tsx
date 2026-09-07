import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "cyrillic"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  const notifications = session?.user
    ? (await db.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          body: true,
          link: true,
          read: true,
          createdAt: true,
        },
      })).map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))
    : [];

  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 font-sans text-gray-900">
        <Header session={session} notifications={notifications} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}