CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "ntfyTopic" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AnimeReminder" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "malId" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "titleEnglish" TEXT,
  "imageUrl" TEXT NOT NULL,
  "nextEpisode" INTEGER NOT NULL,
  "nextAiringAt" TIMESTAMP(3) NOT NULL,
  "broadcastDay" TEXT,
  "broadcastTime" TEXT,
  "broadcastTimezone" TEXT,
  "totalEpisodes" INTEGER,
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "morningNotifiedFor" TIMESTAMP(3),
  "airtimeNotifiedFor" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AnimeReminder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "AnimeReminder_userId_malId_key" ON "AnimeReminder"("userId", "malId");
CREATE INDEX "AnimeReminder_enabled_nextAiringAt_idx" ON "AnimeReminder"("enabled", "nextAiringAt");
ALTER TABLE "AnimeReminder" ADD CONSTRAINT "AnimeReminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
