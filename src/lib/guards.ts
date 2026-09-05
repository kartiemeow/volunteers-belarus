import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/");
  return session.user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) redirect("/");
  return user;
}

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}

export async function getVolunteerProfile(userId: string) {
  return db.volunteerProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
}

export async function getOrganizationProfile(userId: string) {
  return db.organizationProfile.findUnique({
    where: { userId },
    include: { user: true },
  });
}
