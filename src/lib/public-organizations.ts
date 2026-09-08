import { unstable_cache } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db";
import { PAGE_SIZE } from "@/lib/pagination";

type OrganizationStats = {
  id: string;
  doneCount: number;
  helpedVolunteers: number;
};
export const getOrganizations = unstable_cache(
  async (page: number) => {
    const [organizations, total] = await Promise.all([
      db.organizationProfile.findMany({
        orderBy: [{ verified: "desc" }, { createdAt: "asc" }, { id: "asc" }],
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        select: {
          id: true,
          orgName: true,
          description: true,
          website: true,
          verified: true,
          category: true,
          _count: { select: { opportunities: { where: { status: "OPEN" } } } },
        },
      }),
      db.organizationProfile.count(),
    ]);
    const ids = organizations.map((org) => org.id);
    if (!ids.length) return { organizations: [], total };
    const [attendance, ratings] = await Promise.all([
      db.$queryRaw<OrganizationStats[]>(Prisma.sql`
      SELECT o."organizerId" AS id, COUNT(*)::int AS "doneCount", COUNT(DISTINCT a."volunteerId")::int AS "helpedVolunteers"
      FROM "Application" a JOIN "Opportunity" o ON o.id = a."opportunityId"
      WHERE a.status = 'DONE' AND o."organizerId" IN (${Prisma.join(ids)}) GROUP BY o."organizerId"
    `),
      db.rating.groupBy({
        by: ["organizationId"],
        where: { organizationId: { in: ids } },
        _avg: { score: true },
        _count: true,
      }),
    ]);
    return {
      organizations: organizations.map((org) => {
        const stats = attendance.find((row) => row.id === org.id);
        const rating = ratings.find((row) => row.organizationId === org.id);
        return {
          ...org,
          openCount: org._count.opportunities,
          doneCount: stats?.doneCount ?? 0,
          helpedVolunteers: stats?.helpedVolunteers ?? 0,
          ratingCount: rating?._count ?? 0,
          ratingAvg: rating?._avg.score ?? null,
        };
      }),
      total,
    };
  },
  ["organizations-v1"],
  { revalidate: 60, tags: ["organizations"] },
);
