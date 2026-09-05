"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export type NewsFormState = { error?: string; success?: string } | undefined;

const newsSchema = z.object({
  title: z.string().min(5, "Заголовок должен быть не короче 5 символов"),
  slug: z
    .string()
    .min(3, "Короткий адрес должен быть не короче 3 символов")
    .regex(/^[a-z0-9-]+$/, "Только латиница, цифры и дефис"),
  excerpt: z.string().max(300).optional().or(z.literal("")),
  content: z.string().min(20, "Текст должен быть не короче 20 символов"),
  published: z.boolean(),
});

export async function createNewsPost(
  prevState: NewsFormState,
  formData: FormData
): Promise<NewsFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return { error: "Доступ только для администратора" };
  }

  const parsed = newsSchema.safeParse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt"),
    content: formData.get("content"),
    published: formData.get("published") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте данные" };
  }

  const existing = await db.newsPost.findUnique({ where: { slug: parsed.data.slug } });
  if (existing) {
    return { error: "Новость с таким коротким адресом уже существует" };
  }

  await db.newsPost.create({
    data: {
      title: parsed.data.title.trim(),
      slug: parsed.data.slug.trim(),
      excerpt: parsed.data.excerpt ?? "",
      content: parsed.data.content,
      published: parsed.data.published,
      authorId: session.user.id,
    },
  });

  revalidatePath("/novosti");
  revalidatePath("/admin/news");
  return { success: "Новость опубликована" };
}

export async function toggleNewsPublished(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "true";

  await db.newsPost.update({ where: { id }, data: { published } });

  revalidatePath("/novosti");
  revalidatePath("/admin/news");
}

export async function deleteNewsPost(formData: FormData) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return;

  const id = String(formData.get("id") ?? "");
  await db.newsPost.delete({ where: { id } });

  revalidatePath("/novosti");
  revalidatePath("/admin/news");
}