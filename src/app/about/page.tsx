import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "О проекте",
  description:
    "«Волонтёры Беларуси» — единый координационный центр помощи по всей стране: приюты, пожилые люди, поиск пропавших и благоустройство городов.",
};

const VALUES = [
  {
    icon: "🤝",
    title: "Помощь без посредников",
    text: "Организации напрямую размещают заявки, а волонтёры сами выбирают, где и как помогать.",
  },
  {
    icon: "🛡️",
    title: "Безопасность",
    text: "Организации проходят верификацию, все отклики прозрачны и видны в личных кабинетах.",
  },
  {
    icon: "🌍",
    title: "Вся страна",
    text: "Платформа работает для организаций и волонтёров из любого города и посёлка Беларуси.",
  },
  {
    icon: "⏱",
    title: "Уважение ко времени",
    text: "Чёткие даты, количество волонтёров и задачи — вы знаете, на что идёте соглашаться.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          О проекте
        </h1>
        <p className="mx-auto mt-4 text-lg leading-relaxed text-gray-600">
          «Волонтёры Беларуси» — это единая точка, где приюты для животных,
          центры помощи пожилым, поисково-спасательные отряды и городские
          инициативы встречаются с теми, кто готов помогать.
        </p>
      </div>

      <div className="mt-12 space-y-6 text-gray-700 leading-relaxed">
        <p>
          Каждый день сотни людей хотят помочь, но не знают как. А десятки
          организаций нуждаются в руках и времени, но не имеют площадки, где
          их можно найти. Мы собрали это в одном месте.
        </p>
        <p>
          Здесь нет разовых акций «для галочки». Мы строим постоянную систему:
          организация размещает заявку с понятными условиями — волонтёр
          откликается в один клик, а прогресс и потраченные часы всегда видны
          обеим сторонам.
        </p>
        <p>
          Помощь бывает разной: пара часов на субботнике, выгул собаки по
          выходным, звонок одинокому человеку, или участие в поиске пропавшего.
          Каждый вклад ценен, и каждый час — реальная польза для тех, кто в
          этом нуждается.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {VALUES.map((v) => (
          <div key={v.title} className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="text-2xl">{v.icon}</div>
            <div className="mt-3 font-bold text-gray-900">{v.title}</div>
            <p className="mt-1 text-sm text-gray-600">{v.text}</p>
          </div>
        ))}
      </div>

      <div className="mt-12 rounded-2xl bg-gray-50 p-8 text-center">
        <h2 className="text-xl font-bold text-gray-900">Присоединяйтесь</h2>
        <p className="mx-auto mt-2 max-w-xl text-gray-600">
          Если вы волонтёр, организация или просто хотите стать частью
          сообщества — начните с регистрации.
        </p>
        <div className="mt-5">
          <Link
            href="/register"
            className="inline-block rounded-lg bg-emerald-600 px-6 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}