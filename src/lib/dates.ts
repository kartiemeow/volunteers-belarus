export const EVENT_TIME_ZONE = "Europe/Minsk";

export function formatEventDate(date: Date | string) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: EVENT_TIME_ZONE, day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(new Date(date)) + " (Минск)";
}

export function toEventInput(date: Date) {
  const parts = new Intl.DateTimeFormat("sv-SE", {
    timeZone: EVENT_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (key: string) => parts.find((p) => p.type === key)!.value;
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function parseEventDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  // Events are scheduled in Belarus, which uses UTC+03:00 year-round.
  const date = new Date(`${value}:00+03:00`);
  if (!Number.isFinite(date.getTime()) || toEventInput(date) !== value) return null;
  return date;
}
