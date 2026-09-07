import type { ApplicationStatus } from "@/generated/prisma/client";

export type Reliability = {
  resolved: number;
  done: number;
  noShow: number;
  noShowRate: number;
  doneRate: number;
  isUnreliable: boolean;
};

export function getVolunteerReliability(
  applications: { status: ApplicationStatus; createdAt: Date }[]
): Reliability {
  const resolvedApps = applications
    .filter((a) => a.status === "DONE" || a.status === "NO_SHOW")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  const resolved = resolvedApps.length;
  const done = resolvedApps.filter((a) => a.status === "DONE").length;
  const noShow = resolvedApps.filter((a) => a.status === "NO_SHOW").length;

  const noShowRate = resolved > 0 ? noShow / resolved : 0;
  const doneRate = resolved > 0 ? done / resolved : 0;

  const first3 = resolvedApps.slice(0, 3);
  const first3AllNoShow =
    first3.length === 3 && first3.every((a) => a.status === "NO_SHOW");

  const isUnreliable =
    resolved > 0 && !(doneRate >= 0.6) && (noShowRate >= 0.4 || first3AllNoShow);

  return { resolved, done, noShow, noShowRate, doneRate, isUnreliable };
}