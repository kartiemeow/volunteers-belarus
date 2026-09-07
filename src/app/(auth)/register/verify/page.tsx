import { redirect } from "next/navigation";
import Link from "next/link";

import { auth } from "@/lib/auth";
import VerifyEmailForm from "@/components/VerifyEmailForm";

export default async function VerifyEmailPage(
  props: PageProps<"/register/verify">
) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { email } = await props.searchParams;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/register");
  }

  return (
    <div className="flex min-h-[calc(100svh-4rem)] items-center justify-center px-4 py-6 sm:py-12">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="mb-1 text-2xl font-bold text-gray-900">
            Подтверждение почты
          </h1>
          <p className="mb-6 text-sm text-gray-600">
            Мы отправили 6-значный код на{" "}
            <span className="font-semibold text-gray-800">{email}</span>.
            Письмо придёт в течение пары минут, проверьте папку «Спам».
          </p>
          <VerifyEmailForm email={email} />
          <p className="mt-6 text-center text-sm text-gray-600">
            Уже есть аккаунт?{" "}
            <Link href="/login" className="font-medium text-emerald-600 hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}