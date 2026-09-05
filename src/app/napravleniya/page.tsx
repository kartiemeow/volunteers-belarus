import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Направления помощи",
  description:
    "Четыре направления «Волонтёров Беларуси»: приюты для животных, помощь пожилым, поисково-спасательные отряды и благоустройство городов.",
};

const DIRECTIONS = [
  {
    key: "SHELTER" as const,
    icon: "🐾",
    title: "Приюты для животных",
    video: "Помощь кошкам и собакам в приютах: выгул, кормление, уборка, уход, фото для поиска новых хозяев.",
    needs: [
      "Выгул и социализация собак",
      "Уход за животными и ветеринарные помощники",
      "Уборка вольеров и кормление",
      "Фото/видео и тексты для пристройства",
      "Сбор кормов и вещей",
    ],
    who: ["Любите животных и готовы к физической работе", "Хотите помогать без специальной подготовки", "Ищете регулярное волонтёрство"],
  },
  {
    key: "ELDERLY" as const,
    icon: "🤝",
    title: "Помощь пожилым",
    video: "Поддержка одиноких пожилых людей: закупка продуктов, помощь по дому, внимание и общение.",
    needs: [
      "Покупка продуктов и лекарств",
      "Помощь по дому и в быту",
      "Сопровождение в поликлинику",
      "Регулярные звонки и общение",
      "Помощь с документами и банковскими сервисами",
    ],
    who: ["Терпимы и внимательны к другим", "Готовы к регулярной, спокойной помощи", "Цените человеческое общение"],
  },
  {
    key: "PSO" as const,
    icon: "🧭",
    title: "Поиск пропавших (ПСО)",
    video: "Участие в поисково-спасательных операциях: работа на местности, в штабе, информационная поддержка.",
    needs: [
      "Выезды на поиски вблизи городов и в лесу",
      "Работа в штабе: карты, координация, связь",
      "Расклейка и распространение ориентировок",
      "Просмотр записей камер и опрос свидетелей",
      "Операторы БПЛА и кинологи",
    ],
    who: ["Физически готовы к длительным выходам", "Способны работать в команде по инструкции", "Спокойны в стрессовых ситуациях"],
  },
  {
    key: "URBAN" as const,
    icon: "🌳",
    title: "Благоустройство городов",
    video: "Сделаем города Беларуси чище и удобнее: субботники, озеленение, ремонт во дворах и общественных местах.",
    needs: [
      "Субботники и уборка территорий",
      "Посадка деревьев и кустарников",
      "Покраска скамеек и детских площадок",
      "Мелкий ремонт и работа руками",
      "Организация локальных акций",
    ],
    who: ["Проводите много времени на природе или на воздухе", "Хотите видеть конкретный результат труда", "Готовы помочь разово или регулярно"],
  },
];

export default function NapravleniyaPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
          Направления помощи
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
          «Волонтёры Беларуси» объединяют четыре направления. Выберите то, что вам
          близко, — советы и опыт вам помогут найти.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
        {DIRECTIONS.map((d) => (
          <div
            key={d.key}
            className="flex flex-col rounded-2xl border border-gray-200 bg-white p-7"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{d.icon}</span>
              <h2 className="text-xl font-bold text-gray-900">{d.title}</h2>
            </div>
            <p className="mt-3 text-gray-600">{d.video}</p>

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Задачи волонтёров
              </div>
              <ul className="mt-2 space-y-1.5">
                {d.needs.map((n) => (
                  <li key={n} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-emerald-500">✓</span>
                    {n}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Кому подойдёт
              </div>
              <ul className="mt-2 space-y-1.5">
                {d.who.map((w) => (
                  <li key={w} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="mt-0.5 text-emerald-500">•</span>
                    {w}
                  </li>
                ))}
              </ul>
            </div>

            <Link
              href={`/zayavki?category=${d.key}`}
              className="mt-6 inline-block text-sm font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Смотреть заявки по направлению →
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}