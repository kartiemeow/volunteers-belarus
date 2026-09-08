import { cache } from "react";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/pagination";

export const getNews = unstable_cache(
  async (page: number) => {
    const [posts, total] = await Promise.all([
      db.newsPost.findMany({
        where: { published: true },
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          createdAt: true,
        },
      }),
      db.newsPost.count({ where: { published: true } }),
    ]);
    return { posts, total };
  },
  ["news-list-v1"],
  { revalidate: 60, tags: ["news"] },
);

export const getNewsPost = cache(
  unstable_cache(
    (slug: string) =>
      db.newsPost.findFirst({
        where: { slug, published: true },
        select: { title: true, excerpt: true, content: true, createdAt: true },
      }),
    ["news-post-v1"],
    { revalidate: 60, tags: ["news"] },
  ),
);
