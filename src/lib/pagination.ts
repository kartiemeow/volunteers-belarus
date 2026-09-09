export const PAGE_SIZE = 24;
export type SearchParams = Record<string, string | string[] | undefined>;

export function pageNumber(value: string | string[] | undefined) {
  const page = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(page) && page > 0 ? Math.min(page, 1_000_000) : 1;
}
