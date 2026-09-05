"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CATEGORY_ORDER } from "@/lib/constants";

export type OpportunityFormState =
  | { error?: string; success?: string }
  | undefined;

const createOpportunitySchema = z.object({
  title: z.string().min(5, "Название должно быть не короче 5 символов"),
  description: z.string().min(20, "Опишите заявку подробнее (минимум 20 символов)"),
  category: z.enum(CATEGORY_ORDER),
  city: z.string().min(2, "Укажите город"),
  address: z.string().optional().or(z.literal("")),
  date: z.string().min(1, "Укажите дату"),
  slots: z.coerce.number().int().min(1).max(1000),
  requirements: z.string().optional().or(z.literal("")),
  contactInfo: z.string().optional().or(z.literal("")),
});

export async function createOpportunity(
  prevState: OpportunityFormState,
  formData: FormData
): Promise<OpportunityFormState> {
  const session = await auth();
  if (!session?.user || session.user.role !== "ORGANIZER") {
    return { error: "Размещать заявки могут только организации" };
  }

  const orgProfile = await db.organizationProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!orgProfile) {
    return { error: "Сначала заполните профиль организации" };
  }

  const parsed = createOpportunitySchema.safeParse(
    Object.fromEntries(formData.entries())
  );
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Проверьте правильность данных",
    };
  }

  const { title, description, category, city, address, date, slots, requirements, contactInfo } =
    parsed.data;

  const isoDate = new Date(date);
  const yesterday = Date.now() - 24 * 60 * 60 * 1000;
  if (isoDate.getTime() < yesterday) {
    return { error: "Дата не может быть в прошлом" };
  }

  const opportunity = await db.opportunity.create({
    data: {
      title: title.trim(),
      description: description.trim(),
      category,
      city: city.trim(),
      address: address?.trim() || null,
      date: isoDate,
      slots,
      requirements: parseList(requirements),
      contactInfo: contactInfo?.trim() || null,
      organizerId: orgProfile.id,
    },
  });

  revalidatePath("/zayavki");
  redirect(`/zayavki/${opportunity.id}`);
}

function parseList(s: string | undefined): string[] {
  return (s ?? "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}