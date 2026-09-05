import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Контакты",
  description:
    "Свяжитесь с командой «Волонтёры Беларуси»: email, сообщества и ответы на частые вопросы.",
};

const CHANNELS = [
  {
    icon: "📧",
    title: "Электронная почта",
    value: "hello@volunteers-belarus.by",
    note: "Общие вопросы, сотрудничество",
  },
  {
    icon: "💬",
    title: "Telegram",
    value: "@volunteers_belarus",
    note: "Быстрые ответы, новости направления",
  },
  {
    icon: "📱",
    title: "Instagram",
    value: "@volunteers_belarus",
    note: "Истории волонтёров и отчёты о акциях",
  },
  {
    icon: "🏢",
    title: "Для организаций",
    value: "org@volunteers-belarus.by",
    note: "Подключение приютов, отрядов и сообществ",
  },
];

const FAQ = [
  {
    q: "Сколько стоит участие?",
    a: "Всё бесплатно. Платформа и волонтёрство не берут платы — только ваше время и желание помочь.",
  },
  {
    q: "Могут ли несовершеннолетние волонтёрить?",
    a: "Это зависит от конкретной заявки и требований организатора. Указывайте возраст при отклике, а организатор решит по ситуации.",
  },
  {
    q: "Как проходит верификация организаций?",
    a: "Администратор проверяет данные организации перед публикацией заявок. Это защищает волонтёров. Если хотите ускорить — напишите нам.",
  },
  {
    q: "Что если заявка не подошла?",
    a: "Откликнуться можно на несколько заявок одновременно. Если решение организатора вас не устроило — пробуйте другие направления.",
  },
];

export default function KontaktyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">Контакты</h1>
        <p className="mx-auto mt-3 max-w-2xl text-lg text-gray-600">
          Напишите нам — мы на связи и отвечаем в течение дня.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {CHANNELS.map((c) => (
          <div
            key={c.title}
            className="rounded-2xl border border-gray-200 bg-white p-6"
          >
            <div className="text-2xl">{c.icon}</div>
            <div className="mt-3 font-bold text-gray-900">{c.title}</div>
            <div className="mt-1 text-lg font-semibold text-emerald-600">
              {c.value}
            </div>
            <div className="mt-1 text-sm text-gray-500">{c.note}</div>
          </div>
        ))}
      </div>

      <h2 className="mt-12 mb-6 text-2xl font-bold text-gray-900">
        Частые вопросы
      </h2>
      <div className="space-y-4">
        {FAQ.map((f) => (
          <div
            key={f.q}
            className="rounded-2xl border border-gray-200 bg-white p-6"
          >
            <div className="font-semibold text-gray-900">{f.q}</div>
            <p className="mt-1.5 text-sm text-gray-600">{f.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}