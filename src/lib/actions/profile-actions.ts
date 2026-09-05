"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { CATEGORY_ORDER } from "@/lib/constants";

export type ProfileState = { error?: string; success?: string } | undefined;

const volunteerProfileSchema = z.object({
  name: z.string().min(2, "Имя должно быть не короче 2 символов"),
  phone: z.string().optional().or(z.literal("")),
  city: z.string().optional().or(z.literal("")),
  bio: z.string().max(1000).optional().or(z.literal("")),
  skills: z.string().max(1000).optional().or(z.literal("")),
  interests: z.array(z.enum(CATEGORY_ORDER)).optional(),
  availability: z.string().max(1000).optional().or(z.literal("")),
});

export async function updateVolunteerProfile(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) return { error: "Нужно войти в аккаунт" };

  const interests = formData.getAll("interests");
  const parsed = volunteerProfileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone"),
    city: formData.get("city"),
    bio: formData.get("bio"),
    skills: formData.get("skills"),
    interests,
    availability: formData.get("availability"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте данные" };
  }

  const { name, phone, city, bio, skills, interests: interestsOk, availability } = parsed.data;

  await db.user.update({
    where: { id: session.user.id },
    data: {
      name,
      phone: phone || null,
      city: city || null,
    },
  });

  await db.volunteerProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      bio: bio || null,
      skills: parseList(skills),
      interests: interestsOk ?? [],
      availability: parseList(availability),
    },
    update: {
      bio: bio || null,
      skills: parseList(skills),
      interests: interestsOk ?? [],
      availability: parseList(availability),
    },
  });

  revalidatePath("/volunteer");
  revalidatePath("/volunteer/profile");
  return { success: "Профиль обновлён" };
}

const organizationProfileSchema = z.object({
  orgName: z.string().min(2, "Название организации должно быть не короче 2 символов"),
  description: z.string().max(2000).optional().or(z.literal("")),
  website: z.string().max(300).optional().or(z.literal("")),
  categories: z.array(z.enum(CATEGORY_ORDER)).optional(),
});

export async function updateOrganizationProfile(
  prevState: ProfileState,
  formData: FormData
): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user) return { error: "Нужно войти в аккаунт" };

  const categories = formData.getAll("categories") as string[];
  const parsed = organizationProfileSchema.safeParse({
    orgName: formData.get("orgName"),
    description: formData.get("description"),
    website: formData.get("website"),
    categories,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Проверьте данные" };
  }

  const { orgName, description, website, categories: categoriesOk } = parsed.data;

  await db.organizationProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      orgName,
      description: description || null,
      website: website || null,
      category: categoriesOk ?? [],
    },
    update: {
      orgName,
      description: description || null,
      website: website || null,
      category: categoriesOk ?? [],
    },
  });

  await db.user.update({
    where: { id: session.user.id },
    data: { name: orgName },
  });

  revalidatePath("/organizer");
  revalidatePath("/organizer/profile");
  return { success: "Профиль обновлён" };
}

function parseList(s: string | undefined): string[] {
  return (s ?? "")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}