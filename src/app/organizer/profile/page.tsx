import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { OrganizationProfileForm } from "@/components/OrganizationProfileForm";

export const dynamic = "force-dynamic";

export default async function OrganizationProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/organizer/profile");
  if (session.user.role !== "ORGANIZER") redirect("/");

  const profile = await db.organizationProfile.findUnique({
    where: { userId: session.user.id },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Link
        href="/organizer"
        className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-emerald-600"
      >
        ← Назад в кабинет
      </Link>

      <div className="mt-4">
        <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
          Профиль организации
        </h1>
        <p className="mt-1 text-gray-600">
          Эти данные волонтёры видят рядом с вашими заявками.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <OrganizationProfileForm
          orgName={profile?.orgName ?? session.user.name ?? ""}
          description={profile?.description ?? ""}
          website={profile?.website ?? ""}
          categories={profile?.category ?? []}
        />
      </div>
    </div>
  );
}