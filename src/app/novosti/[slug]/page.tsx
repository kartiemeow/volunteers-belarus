import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/novosti/[slug]">
): Promise<Metadata> {
  const { slug } = await props.params;
  const post = await db.newsPost.findFirst({
    where: { slug, published: true },
  });
  if (!post) return { title: "Новость не найдена" };
  return { title: post.title, description: post.excerpt };
}

export default async function NewsPostPage(
  props: PageProps<"/novosti/[slug]">
) {
  const { slug } = await props.params;
  const post = await db.newsPost.findFirst({
    where: { slug, published: true },
    include: { author: { select: { name: true } } },
  });
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/novosti"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-600"
      >
        ← Все новости
      </Link>

      <div className="mt-6 flex items-center gap-2 text-sm text-gray-400">
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

      <h1 className="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
        {post.title}
      </h1>

      {post.excerpt && (
        <p className="mt-4 text-lg text-gray-600">{post.excerpt}</p>
      )}

      <div className="prose mt-8 max-w-none text-gray-700 leading-relaxed">
        {post.content.split(/\r?\n/).map((para, i) =>
          para.trim() ? (
            <p key={i} className="mb-4">
              {para}
            </p>
          ) : null
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