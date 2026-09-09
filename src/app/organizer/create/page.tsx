import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { CreateOpportunityForm } from "@/components/CreateOpportunityForm";

import { toEventInput } from "@/lib/dates";

export default async function CreateOpportunityPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/organizer/create");
  if (session.user.role !== "ORGANIZER") redirect("/");

  const minDate = toEventInput(new Date(new Date().getTime() + 60 * 1000));

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
          Новая заявка
        </h1>
        <p className="mt-1 text-gray-600">
Опишите задачу, и волонтёры увидят её в общем каталоге и смогут
откликнуться.
        </p>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
        <CreateOpportunityForm minDate={minDate} />
      </div>
    </div>
  );
}