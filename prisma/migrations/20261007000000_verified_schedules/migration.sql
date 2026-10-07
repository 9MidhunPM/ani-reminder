BEGIN;

CREATE TYPE "ScheduleState" AS ENUM ('UNVERIFIED', 'SCHEDULED', 'WAITING', 'COMPLETED', 'CANCELLED');
CREATE TYPE "NotificationKind" AS ENUM ('MORNING', 'AIRTIME', 'TEST');
CREATE TYPE "DeliveryState" AS ENUM ('PENDING', 'CLAIMED', 'SENT', 'FAILED', 'UNCERTAIN', 'SKIPPED');

ALTER TABLE "User" ADD COLUMN "morningEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "airtimeEnabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "AnimeReminder" ALTER COLUMN "nextEpisode" DROP NOT NULL,
  ALTER COLUMN "nextAiringAt" DROP NOT NULL,
  ADD COLUMN "nextAiringId" INTEGER,
  ADD COLUMN "mediaStatus" TEXT,
  ADD COLUMN "scheduleState" "ScheduleState" NOT NULL DEFAULT 'UNVERIFIED',
  ADD COLUMN "scheduleCheckedAt" TIMESTAMP(3),
  ADD COLUMN "nextCheckAt" TIMESTAMP(3),
  ADD COLUMN "syncError" TEXT;

CREATE TABLE "SchedulerControl" (
  "id" TEXT PRIMARY KEY DEFAULT 'main',
  "deliveryEnabled" BOOLEAN NOT NULL DEFAULT false,
  "cutoverAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('UTC', CURRENT_TIMESTAMP),
  "leaseOwner" TEXT, "leaseUntil" TIMESTAMP(3),
  "nextProviderRequestAt" TIMESTAMP(3), "providerBackoffUntil" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('UTC', CURRENT_TIMESTAMP)
);
-- A shared cutover and disabled delivery prevent legacy schedules being replayed.
INSERT INTO "SchedulerControl" ("id") VALUES ('main');

CREATE TABLE "NotificationDelivery" (
  "id" TEXT PRIMARY KEY, "userId" TEXT NOT NULL, "anilistId" INTEGER,
  "episode" INTEGER, "kind" "NotificationKind" NOT NULL,
  "state" "DeliveryState" NOT NULL DEFAULT 'PENDING', "title" TEXT NOT NULL,
  "airingAt" TIMESTAMP(3), "sourceId" INTEGER, "scheduledFor" TIMESTAMP(3) NOT NULL,
  "claimedAt" TIMESTAMP(3), "sentAt" TIMESTAMP(3), "error" TEXT, "receiptId" TEXT,
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT timezone('UTC', CURRENT_TIMESTAMP),
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationDelivery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NotificationDelivery_episode_identity" CHECK (
    ("kind" = 'TEST' AND "episode" IS NULL) OR
    ("kind" <> 'TEST' AND "anilistId" IS NOT NULL AND "anilistId" > 0 AND "episode" IS NOT NULL AND "episode" > 0 AND "sourceId" IS NOT NULL AND "sourceId" > 0 AND "airingAt" IS NOT NULL)
  )
);
CREATE UNIQUE INDEX "NotificationDelivery_userId_anilistId_episode_kind_key" ON "NotificationDelivery"("userId", "anilistId", "episode", "kind");
CREATE INDEX "NotificationDelivery_state_scheduledFor_idx" ON "NotificationDelivery"("state", "scheduledFor");
CREATE INDEX "NotificationDelivery_userId_createdAt_idx" ON "NotificationDelivery"("userId", "createdAt");
CREATE INDEX "AnimeReminder_nextCheckAt_idx" ON "AnimeReminder"("nextCheckAt");

COMMIT;
