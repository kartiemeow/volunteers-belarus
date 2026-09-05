import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";

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
    default: "Волонтёры Беларуси — единый координационный центр",
    template: "%s — Волонтёры Беларуси",
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

  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 font-sans text-gray-900">
        <Header session={session} />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}