import Link from "next/link";
import { PAGE_SIZE, type SearchParams } from "@/lib/pagination";

export function Pagination({
  pathname,
  params,
  page,
  total,
  pageKey = "page",
}: {
  pathname: string;
  params: SearchParams;
  page: number;
  total: number;
  pageKey?: string;
}) {
  if (total <= PAGE_SIZE && page === 1) return null;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  function href(target: number) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string" && key !== pageKey) query.set(key, value);
    }
    if (target > 1) query.set(pageKey, String(target));
    return `${pathname}${query.size ? `?${query}` : ""}`;
  }
  return (
    <nav
      aria-label="Страницы списка"
      className="mt-6 flex items-center justify-center gap-5 text-sm"
    >
      {page > 1 && (
        <Link
          scroll={false}
          href={href(Math.min(page - 1, pages))}
          className="text-emerald-700 hover:underline"
        >
          ← Назад
        </Link>
      )}
      <span>
        Страница {page} из {pages}
      </span>
      {page < pages && (
        <Link
          scroll={false}
          href={href(page + 1)}
          className="text-emerald-700 hover:underline"
        >
          Далее →
        </Link>
      )}
    </nav>
  );
}
