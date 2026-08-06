ALTER TABLE "AnimeReminder" ADD COLUMN "anilistId" INTEGER;
ALTER TABLE "AnimeReminder" ALTER COLUMN "malId" DROP NOT NULL;
CREATE UNIQUE INDEX "AnimeReminder_userId_anilistId_key" ON "AnimeReminder"("userId", "anilistId");
