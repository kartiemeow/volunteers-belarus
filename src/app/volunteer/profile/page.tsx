import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { VolunteerProfileForm } from "@/components/VolunteerProfileForm";

export const dynamic = "force-dynamic";

export default async function VolunteerProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/volunteer/profile");
  if (session.user.role !== "VOLUNTEER") redirect("/");

  const [user, profile] = await Promise.all([
    db.user.findUnique({ where: { id: session.user.id } }),
    db.volunteerProfile.findUnique({ where: { userId: session.user.id } }),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/volunteer"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-600"
      >
        ← Назад в кабинет
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Профиль волонтёра
        </h1>
        <p className="mt-1 text-gray-600">
          Расскажите о себе — так организаторам будет проще подобрать вам заявку.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <VolunteerProfileForm
          name={user?.name ?? ""}
          phone={user?.phone ?? ""}
          city={user?.city ?? ""}
          bio={profile?.bio ?? ""}
          skills={profile?.skills ?? []}
          interests={profile?.interests ?? []}
          availability={profile?.availability ?? []}
        />
      </div>
    </div>
  );
}