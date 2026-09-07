import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import RateOrganizationForm from "@/components/RateOrganizationForm";
import { IconThumbsUp } from "@/components/icons";

export const dynamic = "force-dynamic";

export default async function RateOrganizationPage({
  params,
}: PageProps<"/ocenit/[applicationId]">) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/zayavki");
  if (session.user.role !== "VOLUNTEER") redirect("/org");

  const { applicationId } = await params;

  const profile = await db.volunteerProfile.findUnique({
    where: { userId: session.user.id },
  });
  if (!profile) redirect("/volunteer/profile");

  const application = await db.application.findFirst({
    where: {
      id: applicationId,
      volunteerId: profile.id,
      status: "DONE",
    },
    include: { opportunity: { include: { organizer: true } } },
  });
  if (!application) {
    redirect("/volunteer");
  }

  const existing = await db.rating.findUnique({
    where: { applicationId: application.id },
  });
  if (existing) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-8">
          <div className="flex items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <IconThumbsUp className="h-12 w-12" />
          </div>
          <h1 className="mt-3 text-xl font-bold text-gray-900">Спасибо!</h1>
          <p className="mt-2 text-gray-600">
            Вы уже оценили организацию «{application.opportunity.organizer.orgName}».
          </p>
          <Link
            href="/volunteer"
            className="mt-5 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Вернуться в кабинет
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RateOrganizationForm
      applicationId={application.id}
      orgName={application.opportunity.organizer.orgName}
      opportunityTitle={application.opportunity.title}
    />
  );
}