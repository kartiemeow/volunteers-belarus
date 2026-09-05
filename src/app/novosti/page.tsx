import Link from "next/link";
import type { Metadata } from "next";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Новости",
  description:
    "Новости волонтёрского движения Беларуси: отчёты, события и истории волонтёров.",
};

export default async function NovostiPage() {
  const posts = await db.newsPost.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Новости</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
          Отчёты с акций, истории волонтёров и новости направлений.
        </p>
      </div>

      <div className="mt-12">
        {posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
            <p className="text-lg font-medium text-gray-700">
              Новостей пока нет
            </p>
            <p className="mt-1 text-gray-500">
              Скоро здесь появятся истории и отчёты волонтёров.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <article
                key={post.id}
                className="rounded-2xl border border-gray-200 bg-white p-7"
              >
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <time dateTime={post.createdAt.toISOString()}>
                    {formatDate(post.createdAt)}
                  </time>
                  {post.author.name && (
                    <>
                      <span>·</span>
                      <span>{post.author.name}</span>
                    </>
                  )}
                </div>
                <Link
                  href={`/novosti/${post.slug}`}
                  className="mt-2 block text-xl font-bold text-gray-900 hover:text-emerald-700"
                >
                  {post.title}
                </Link>
                {post.excerpt && (
                  <p className="mt-2 text-gray-600">{post.excerpt}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}