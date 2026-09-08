import { cache } from "react";
import { unstable_cache } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { CATEGORY_ORDER } from "@/lib/constants";
import { PAGE_SIZE, type SearchParams } from "@/lib/pagination";

export function catalogFilters(params: SearchParams) {
  const category =
    typeof params.category === "string" &&
    CATEGORY_ORDER.includes(params.category as never)
      ? (params.category as (typeof CATEGORY_ORDER)[number])
      : undefined;
  return {
    category,
    city: typeof params.city === "string" ? params.city : "",
    query: typeof params.q === "string" ? params.q : "",
  };
}
type Filters = ReturnType<typeof catalogFilters>;
export function catalogWhere({
  category,
  city,
  query,
}: Filters): Prisma.OpportunityWhereInput {
  const term = query.replace(/[\\%_]/g, "\\$&");
  return {
    ...(category ? { category } : {}),
    ...(city ? { city } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: term, mode: "insensitive" } },
            { description: { contains: term, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}
const cardSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  city: true,
  date: true,
  status: true,
  slots: true,
  filledSlots: true,
} satisfies Prisma.OpportunitySelect;

export const getCatalog = unstable_cache(
  async (filters: Filters, page: number) => {
    const where = catalogWhere(filters);
    const [opportunities, total] = await Promise.all([
      db.opportunity.findMany({
        where,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        select: {
          ...cardSelect,
          organizer: {
            select: { verified: true, user: { select: { name: true } } },
          },
        },
      }),
      db.opportunity.count({ where }),
    ]);
    return { opportunities, total };
  },
  ["catalog-v1"],
  { revalidate: 60, tags: ["opportunities"] },
);

export const getRecentOpportunities = unstable_cache(
  () =>
    db.opportunity.findMany({
      where: { status: "OPEN" },
      take: 6,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: cardSelect,
    }),
  ["recent-opportunities-v1"],
  { revalidate: 60, tags: ["opportunities"] },
);

export const getHomeStats = unstable_cache(
  async () => {
    const [volunteers, opportunities, applications, organizations] =
      await Promise.all([
        db.user.count({ where: { role: "VOLUNTEER" } }),
        db.opportunity.count(),
        db.application.count({ where: { status: "APPROVED" } }),
        db.organizationProfile.count(),
      ]);
    return { volunteers, opportunities, applications, organizations };
  },
  ["home-stats-v1"],
  { revalidate: 60, tags: ["statistics"] },
);

export const getOpportunity = cache(
  unstable_cache(
    (id: string) =>
      db.opportunity.findUnique({
        where: { id },
        include: {
          organizer: { include: { user: { select: { name: true } } } },
        },
      }),
    ["opportunity-v1"],
    { revalidate: 60, tags: ["opportunities"] },
  ),
);

export const getOrganizationRating = unstable_cache(
  (id: string) =>
    db.rating.aggregate({
      _avg: { score: true },
      _count: true,
      where: { organizationId: id },
    }),
  ["organization-rating-v1"],
  { revalidate: 60, tags: ["organizations"] },
);

export type CitySummary = {
  city: string;
  count: number;
  apps: { id: string; title: string }[];
};
export const getMapCities = unstable_cache(
  async ({ category, city, query }: Filters) => {
    const pattern = `%${query.replace(/[\\%_]/g, "\\$&")}%`;
    return db.$queryRaw<CitySummary[]>(Prisma.sql`
    WITH ranked AS (
      SELECT id, title, city, ROW_NUMBER() OVER (PARTITION BY city ORDER BY "createdAt" DESC, id DESC) AS position
      FROM "Opportunity"
      WHERE true
        ${category ? Prisma.sql`AND category = ${category}::"Category"` : Prisma.empty}
        ${city ? Prisma.sql`AND city = ${city}` : Prisma.empty}
        ${query ? Prisma.sql`AND (title ILIKE ${pattern} OR description ILIKE ${pattern})` : Prisma.empty}
    )
    SELECT city, COUNT(*)::int AS count,
      json_agg(json_build_object('id', id, 'title', title) ORDER BY position) FILTER (WHERE position <= 3) AS apps
    FROM ranked GROUP BY city ORDER BY city
  `);
  },
  ["map-cities-v1"],
  { revalidate: 60, tags: ["opportunities"] },
);
