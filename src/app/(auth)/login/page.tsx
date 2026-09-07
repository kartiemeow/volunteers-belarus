import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import LoginForm from "@/components/LoginForm";

export default async function LoginPage(
  props: PageProps<"/login">
) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { next } = await props.searchParams;

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">Вход</h1>
          <p className="mb-6 text-sm text-gray-600">
            Рады видеть вас снова
          </p>
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