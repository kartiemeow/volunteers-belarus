import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage(
  props: PageProps<"/login">
) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { next, verified } = await props.searchParams;

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-6 sm:py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Вход</h1>
          <p className="mb-6 text-sm text-gray-600">
            Рады видеть вас снова
          </p>
          {typeof verified === "string" && (
            <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Почта подтверждена! Войдите, чтобы продолжить.
            </div>
          )}
          <LoginForm
            next={
              typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
                ? next
                : undefined
            }
          />
        </div>
      </div>
    </div>
  );
}