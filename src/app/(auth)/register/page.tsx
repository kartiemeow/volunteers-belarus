import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import RegisterForm from "@/components/RegisterForm";

export default async function RegisterPage(
  props: PageProps<"/register">
) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { role } = await props.searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Регистрация</h1>
          <p className="mb-6 text-sm text-gray-600">
            Станьте волонтёром или зарегистрируйте организацию
          </p>
          <RegisterForm initialRole={role === "organizer" ? "ORGANIZER" : "VOLUNTEER"} />
        </div>
      </div>
    </div>
  );
}