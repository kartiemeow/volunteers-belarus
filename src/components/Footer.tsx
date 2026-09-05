import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div className="col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white">
                ВБ
              </span>
              <span className="text-sm font-bold text-gray-900">
                Волонтёры Беларуси
              </span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-gray-500">
              Единый координационный центр волонтёрской помощи: приюты для
              животных, помощь пожилым, поиск пропавших людей и благоустройство
              городов.
            </p>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-900">Навигация</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/zayavki" className="hover:text-emerald-600">Заявки</Link></li>
              <li><Link href="/napravleniya" className="hover:text-emerald-600">Направления</Link></li>
              <li><Link href="/novosti" className="hover:text-emerald-600">Новости</Link></li>
              <li><Link href="/kak-eto-rabotaet" className="hover:text-emerald-600">Как это работает</Link></li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-sm font-semibold text-gray-900">Участникам</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/register" className="hover:text-emerald-600">Стать волонтёром</Link></li>
              <li><Link href="/register" className="hover:text-emerald-600">Добавить организацию</Link></li>
              <li><Link href="/kontakty" className="hover:text-emerald-600">Контакты</Link></li>
              <li><Link href="/about" className="hover:text-emerald-600">О проекте</Link></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-gray-100 pt-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Волонтёры Беларуси. Сделано с заботой о людях и городе.
        </div>
      </div>
    </footer>
  );
}