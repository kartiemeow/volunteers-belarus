ALTER TYPE "ApplicationStatus" ADD VALUE 'WITHDRAWN';

CREATE TABLE "RateLimit" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "count" INTEGER NOT NULL DEFAULT 0,
  "expiresAt" TIMESTAMP(3) NOT NULL
);

ALTER TABLE "Notification" ADD COLUMN "dedupeKey" TEXT;
CREATE UNIQUE INDEX "Notification_dedupeKey_key" ON "Notification"("dedupeKey");
CREATE INDEX "Notification_userId_read_createdAt_idx" ON "Notification"("userId", "read", "createdAt");
CREATE INDEX "Opportunity_status_date_idx" ON "Opportunity"("status", "date");
CREATE INDEX "Application_volunteerId_status_idx" ON "Application"("volunteerId", "status");

-- Restore counters from their source records before enforcing nonnegative reservations.
UPDATE "Opportunity" o SET "filledSlots" = (
  SELECT COUNT(*) FROM "Application" a WHERE a."opportunityId" = o.id AND a.status IN ('PENDING', 'APPROVED')
);
UPDATE "VolunteerProfile" v SET "totalHours" = COALESCE((
  SELECT SUM(a."hoursLogged") FROM "Application" a WHERE a."volunteerId" = v.id AND a.status = 'DONE'
), 0);
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_filledSlots_nonnegative" CHECK ("filledSlots" >= 0);
