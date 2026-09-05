import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { NewsForm } from "@/components/NewsForm";
import { toggleNewsPublished, deleteNewsPost } from "@/lib/actions/news-actions";

export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/news");
  if (session.user.role !== "ADMIN") redirect("/");

  const posts = await db.newsPost.findMany({
    orderBy: { createdAt: "desc" },
    include: { author: { select: { name: true } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-600"
      >
        ← В администрирование
      </Link>

      <h1 className="mt-4 text-2xl font-bold text-gray-900 sm:text-3xl">
        Новости
      </h1>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <h2 className="mb-5 text-lg font-semibold text-gray-900">
          Создать новость
        </h2>
        <NewsForm />
      </div>

      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">
        Созданные новости
      </h2>
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-500">
            Публикаций пока нет
          </div>
        )}
        {posts.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-200 bg-white p-5"
          >
            <div>
              <div className="font-semibold text-gray-900">{p.title}</div>
              <div className="mt-0.5 text-sm text-gray-500">
                /novosti/{p.slug} · {formatDate(p.createdAt)}
                {p.author.name ? ` · ${p.author.name}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.published ? (
                <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  Опубликована
                </span>
              ) : (
                <span className="rounded-full bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-600">
                  Черновик
                </span>
              )}
              <form action={toggleNewsPublished} className="flex">
                <input type="hidden" name="id" value={p.id} />
                <input
                  type="hidden"
                  name="published"
                  value={p.published ? "false" : "true"}
                />
                <button
                  type="submit"
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {p.published ? "Снять с публикации" : "Опубликовать"}
                </button>
              </form>
              <form action={deleteNewsPost} className="flex">
                <input type="hidden" name="id" value={p.id} />
                <button
                  type="submit"
                  className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  Удалить
                </button>
              </form>
            </div>
          </div>
        ))}
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