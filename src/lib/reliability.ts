import type { ApplicationStatus } from "@/generated/prisma/client";

export type Reliability = {
  resolved: number;
  done: number;
  noShow: number;
  noShowRate: number;
  doneRate: number;
  isUnreliable: boolean;
};

export function reliabilityFromCounts(done: number, noShow: number): Reliability {
  const resolved = done + noShow;
  const noShowRate = resolved > 0 ? noShow / resolved : 0;
  const doneRate = resolved > 0 ? done / resolved : 0;
  return { resolved, done, noShow, noShowRate, doneRate, isUnreliable: resolved > 0 && doneRate < 0.6 };
}

export function getVolunteerReliability(applications: { status: ApplicationStatus }[]): Reliability {
  return reliabilityFromCounts(
    applications.filter((a) => a.status === "DONE").length,
    applications.filter((a) => a.status === "NO_SHOW").length,
  );
}
