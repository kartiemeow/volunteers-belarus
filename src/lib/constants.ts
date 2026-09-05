export const CATEGORY_LABELS: Record<string, string> = {
  SHELTER: "Приюты для животных",
  ELDERLY: "Помощь пожилым",
  PSO: "Поиск пропавших (ПСО)",
  URBAN: "Благоустройство городов",
};

export const CATEGORY_SHORT: Record<string, string> = {
  SHELTER: "Животные",
  ELDERLY: "Пожилые",
  PSO: "Поиск людей",
  URBAN: "Благоустройство",
};

export const CATEGORY_ORDER = ["SHELTER", "ELDERLY", "PSO", "URBAN"] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  SHELTER: "bg-amber-100 text-amber-800",
  ELDERLY: "bg-sky-100 text-sky-800",
  PSO: "bg-rose-100 text-rose-800",
  URBAN: "bg-emerald-100 text-emerald-800",
};

export const STATUS_LABELS: Record<string, string> = {
  PENDING: "На рассмотрении",
  APPROVED: "Одобрено",
  REJECTED: "Отклонено",
  DONE: "Выполнено",
};

export const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  DONE: "bg-blue-100 text-blue-800",
};

export const OPPORTUNITY_STATUS_LABELS: Record<string, string> = {
  OPEN: "Набор открыт",
  CLOSED: "Набор закрыт",
  COMPLETED: "Завершено",
};

export const OPPORTUNITY_STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  CLOSED: "bg-gray-200 text-gray-700",
  COMPLETED: "bg-blue-100 text-blue-800",
};

export type CategoryKey = (typeof CATEGORY_ORDER)[number];
