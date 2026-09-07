import Link from "next/link";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  verifyOrganization,
  setOpportunityStatus,
  deleteUser,
  deleteOrganization,
} from "@/lib/actions/admin-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { CATEGORY_SHORT, OPPORTUNITY_STATUS_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin");
  if (session.user.role !== "ADMIN") redirect("/");

  const [userCount, orgCount, volCount, oppCount, appCount, organizations, opportunities, users] =
    await Promise.all([
      db.user.count(),
      db.organizationProfile.count(),
      db.volunteerProfile.count(),
      db.opportunity.count(),
      db.application.count(),
      db.organizationProfile.findMany({
        include: { user: true, _count: { select: { opportunities: true } } },
        orderBy: { createdAt: "desc" },
      }),
      db.opportunity.findMany({
        include: { organizer: true },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.user.findMany({
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const pendingApplications = await db.application.count({ where: { status: "PENDING" } });

  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">Администрирование</h1>
          <p className="mt-1 text-gray-600">Обзор платформы и модерация организаций.</p>
        </div>
        <Link
          href="/admin/news"
          className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Управление новостями
        </Link>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-6">
        {[
          { value: userCount, label: "Пользователей" },
          { value: orgCount, label: "Организаций" },
          { value: volCount, label: "Волонтёров" },
          { value: oppCount, label: "Заявок" },
          { value: appCount, label: "Откликов" },
          { value: pendingApplications, label: "Ждут решения" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xl font-extrabold text-emerald-600">{s.value}</div>
            <div className="mt-1 text-xs text-gray-500">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Organizations to verify */}
      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">
        Верификация организаций
      </h2>
      <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 md:block">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Организация</th>
              <th className="px-5 py-3">Контакты</th>
              <th className="px-5 py-3">Заявок</th>
              <th className="px-5 py-3">Статус</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {organizations.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500">
                  Организаций пока нет
                </td>
              </tr>
            )}
            {organizations.map((org) => (
              <tr key={org.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-900">{org.orgName}</div>
                  <div className="text-sm text-gray-500">
                    {org.category.map((c) => CATEGORY_SHORT[c]).join(", ")}
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {org.user.email}
                  {org.user.phone && <div>{org.user.phone}</div>}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {org._count.opportunities}
                </td>
                <td className="px-5 py-4">
                  {org.verified ? (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      Верифицирована
                    </span>
                  ) : (
                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                      Ожидает проверки
                    </span>
                  )}
                </td>
                <td className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <form action={verifyOrganization}>
                      <input type="hidden" name="profileId" value={org.id} />
                      <input
                        type="hidden"
                        name="verified"
                        value={org.verified ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        {org.verified ? "Снять верификацию" : "Подтвердить"}
                      </button>
                    </form>
                    <form action={deleteOrganization}>
                      <input type="hidden" name="orgId" value={org.id} />
                      <ConfirmButton
                        confirmText={`Удалить организацию «${org.orgName}» вместе со всеми её заявками?`}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                      >
                        Удалить
                      </ConfirmButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: organisations */}
      <div className="space-y-3 md:hidden">
        {organizations.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-gray-500">
            Организаций пока нет
          </div>
        )}
        {organizations.map((org) => (
          <div key={org.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{org.orgName}</div>
                <div className="mt-0.5 text-sm text-gray-500">
                  {org.category.map((c) => CATEGORY_SHORT[c]).join(", ")}
                </div>
              </div>
              {org.verified ? (
                <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                  Верифицирована
                </span>
              ) : (
                <span className="shrink-0 rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-800">
                  Ожидает проверки
                </span>
              )}
            </div>
            <div className="mt-3 space-y-0.5 text-sm text-gray-600">
              <div className="break-all">{org.user.email}</div>
              {org.user.phone && <div>{org.user.phone}</div>}
              <div>
                Заявок: <strong>{org._count.opportunities}</strong>
              </div>
            </div>
            <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
              <form action={verifyOrganization} className="flex-1">
                <input type="hidden" name="profileId" value={org.id} />
                <input
                  type="hidden"
                  name="verified"
                  value={org.verified ? "false" : "true"}
                />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {org.verified ? "Снять верификацию" : "Подтвердить"}
                </button>
              </form>
              <form action={deleteOrganization} className="flex-1">
                <input type="hidden" name="orgId" value={org.id} />
                <ConfirmButton
                  confirmText={`Удалить организацию «${org.orgName}» вместе со всеми её заявками?`}
                  className="w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                >
                  Удалить
                </ConfirmButton>
              </form>
            </div>
          </div>
        ))}
      </div>

      {/* Users */}
      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">
        Пользователи
      </h2>
      <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 md:block">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Пользователь</th>
              <th className="px-5 py-3">Роль</th>
              <th className="px-5 py-3">Зарегистрирован</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <div className="font-semibold text-gray-900">{u.name}</div>
                  <div className="text-sm text-gray-500">{u.email}</div>
                </td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      u.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : u.role === "ORGANIZER"
                          ? "bg-sky-100 text-sky-800"
                          : "bg-emerald-100 text-emerald-800"
                    }`}
                  >
                    {u.role === "ADMIN"
                      ? "Администратор"
                      : u.role === "ORGANIZER"
                        ? "Организация"
                        : "Волонтёр"}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-500">
                  {u.createdAt.toLocaleDateString("ru-RU")}
                </td>
                <td className="px-5 py-4 text-right">
                  {u.role === "ADMIN" ? (
                    <span className="text-xs text-gray-400">Нельзя удалить</span>
                  ) : (
                    <form action={deleteUser}>
                      <input type="hidden" name="userId" value={u.id} />
                      <ConfirmButton
                        confirmText={`Удалить аккаунт пользователя «${u.name}» (${u.email})?`}
                        className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                      >
                        Удалить аккаунт
                      </ConfirmButton>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: users */}
      <div className="space-y-3 md:hidden">
        {users.map((u) => (
          <div key={u.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-gray-900">{u.name}</div>
                <div className="mt-0.5 break-all text-sm text-gray-500">{u.email}</div>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                  u.role === "ADMIN"
                    ? "bg-purple-100 text-purple-800"
                    : u.role === "ORGANIZER"
                      ? "bg-sky-100 text-sky-800"
                      : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {u.role === "ADMIN"
                  ? "Администратор"
                  : u.role === "ORGANIZER"
                    ? "Организация"
                    : "Волонтёр"}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-500">
              Зарегистрирован: {u.createdAt.toLocaleDateString("ru-RU")}
            </div>
            {u.role === "ADMIN" ? (
              <div className="mt-3 text-xs text-gray-400">Нельзя удалить</div>
            ) : (
              <form action={deleteUser} className="mt-4 border-t border-gray-100 pt-4">
                <input type="hidden" name="userId" value={u.id} />
                <ConfirmButton
                  confirmText={`Удалить аккаунт пользователя «${u.name}» (${u.email})?`}
                  className="w-full rounded-lg border border-rose-300 bg-rose-50 px-3 py-2.5 text-sm font-medium text-rose-700 hover:bg-rose-100"
                >
                  Удалить аккаунт
                </ConfirmButton>
              </form>
            )}
          </div>
        ))}
      </div>

      {/* Recent opportunities */}
      <h2 className="mt-10 mb-4 text-lg font-semibold text-gray-900">
        Последние заявки
      </h2>
      <div className="hidden overflow-x-auto rounded-2xl border border-gray-200 md:block">
        <table className="w-full text-left">
          <thead className="bg-gray-50">
            <tr className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="px-5 py-3">Заявка</th>
              <th className="px-5 py-3">Организация</th>
              <th className="px-5 py-3">Слоты</th>
              <th className="px-5 py-3">Статус</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {opportunities.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-5 py-4">
                  <a
                    href={`/zayavki/${o.id}`}
                    className="font-semibold text-gray-900 hover:text-emerald-700"
                  >
                    {o.title}
                  </a>
                  <div className="text-sm text-gray-500">{o.city}</div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{o.organizer.orgName}</td>
                <td className="px-5 py-4 text-sm text-gray-600">
                  {o.filledSlots}/{o.slots}
                </td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {OPPORTUNITY_STATUS_LABELS[o.status]}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <form action={setOpportunityStatus} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={o.id} />
                    <select
                      name="status"
                      defaultValue={o.status}
                      className="rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm"
                    >
                      <option value="OPEN">Набор открыт</option>
                      <option value="CLOSED">Набор закрыт</option>
                      <option value="COMPLETED">Завершено</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Применить
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: opportunities */}
      <div className="space-y-3 md:hidden">
        {opportunities.map((o) => (
          <div key={o.id} className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <a
                  href={`/zayavki/${o.id}`}
                  className="font-semibold text-gray-900 hover:text-emerald-700"
                >
                  {o.title}
                </a>
                <div className="mt-0.5 text-sm text-gray-500">
                  {o.city}
                </div>
                <div className="text-sm text-gray-600">{o.organizer.orgName}</div>
              </div>
              <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                {OPPORTUNITY_STATUS_LABELS[o.status]}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              Мест: {o.filledSlots}/{o.slots}
            </div>
            <form action={setOpportunityStatus} className="mt-4 flex items-center gap-2 border-t border-gray-100 pt-4">
              <input type="hidden" name="id" value={o.id} />
              <select
                name="status"
                defaultValue={o.status}
                className="flex-1 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm"
              >
                <option value="OPEN">Набор открыт</option>
                <option value="CLOSED">Набор закрыт</option>
                <option value="COMPLETED">Завершено</option>
              </select>
              <button
                type="submit"
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Применить
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}