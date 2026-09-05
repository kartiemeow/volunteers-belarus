import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Как это работает",
  description:
    "Как устроена платформа «Волонтёры Беларуси»: пошагово для волонтёров и организаций.",
};

const VOLUNTEER_STEPS = [
  {
    title: "Зарегистрируйтесь",
    text: "Создайте аккаунт волонтёра с вашим именем, городом и телефоном. Это займёт пару минут.",
  },
  {
    title: "Заполните профиль",
    text: "Укажите навыки, свободное время и интересующие направления — так организаторам проще подобрать вам заявку.",
  },
  {
    title: "Найдите заявку",
    text: "Отфильтруйте каталог по направлению, городу или ключевым словам и откликнитесь",
  },
  {
    title: "Дождитесь ответа",
    text: "Организатор одобрит или отклонит ваш отклик. Все статусы видны в личном кабинете.",
  },
  {
    title: "Помогайте и получайте отметки",
    text: "После выполненной задачи организатор отмечает часы — они копятся в вашем профиле.",
  },
];

const ORGANIZER_STEPS = [
  {
    title: "Зарегистрируйтесь как организация",
    text: "Создайте аккаунт организатора и заполните карточку: название, описание, направления работы.",
  },
  {
    title: "Дождитесь верификации",
    text: "Администратор подтверждает профиль организации. Это защищает волонтёров от мошенников.",
  },
  {
    title: "Разместите заявку",
    text: "Опишите задачу, город, дату и нужное количество волонтёров. Заявка появится в общем каталоге.",
  },
  {
    title: "Работайте с откликами",
    text: "В личном кабинете видно всех откликнувшихся: профили, навыки и сообщения. Одобряйте подходящих.",
  },
  {
    title: "Отмечайте часы",
    text: "После выполнения задачи установите волонтёру часы — они отразятся в его профиле как опыт.",
  },
];

export default function KakEtoRabotaetPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Как это работает
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
          Платформа соединяет тех, кто готов помогать, с теми, кто нуждается в
          помощи — быстро и прозрачно.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* For volunteers */}
        <section className="rounded-2xl border border-emerald-100 bg-white p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-xl">
              🫶
            </span>
            <h2 className="text-xl font-bold text-gray-900">Для волонтёров</h2>
          </div>
          <ol className="mt-6 space-y-6">
            {VOLUNTEER_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-gray-900">{s.title}</div>
                  <div className="mt-0.5 text-sm text-gray-600">{s.text}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* For organizations */}
        <section className="rounded-2xl border border-sky-100 bg-white p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-100 text-xl">
              🏢
            </span>
            <h2 className="text-xl font-bold text-gray-900">Для организаций</h2>
          </div>
          <ol className="mt-6 space-y-6">
            {ORGANIZER_STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sky-600 text-sm font-bold text-white">
                  {i + 1}
                </span>
                <div>
                  <div className="font-semibold text-gray-900">{s.title}</div>
                  <div className="mt-0.5 text-sm text-gray-600">{s.text}</div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <div className="mt-12 rounded-2xl bg-emerald-600 px-8 py-10 text-center text-white">
        <h2 className="text-2xl font-bold">Готовы начать?</h2>
        <p className="mx-auto mt-2 max-w-xl text-emerald-50">
          Присоединяйтесь — ваша помощь действительно нужна.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/register"
            className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50"
          >
            Стать волонтёром
          </Link>
          <Link
            href="/register?role=organizer"
            className="rounded-lg border border-white/60 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Зарегистрировать организацию
          </Link>
        </div>
      </div>
    </div>
  );
}