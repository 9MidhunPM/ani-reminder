import { auth } from "@/auth";
import { prisma } from "./prisma";
import { getAnime } from "./anilist";
import { reminderHandlers } from "./api-reminders";
import { reconcileReminder } from "./scheduling/reconcile";
import { serializeReminder } from "./serialize-reminder";

export const handlers = reminderHandlers({
  authenticate: async () => (await auth())?.user?.id ?? null,
  list: (userId) => prisma.animeReminder.findMany({
    where: { userId }, orderBy: [{ enabled: "desc" }, { nextAiringAt: "asc" }, { createdAt: "desc" }],
  }),
  find: (userId, id) => prisma.animeReminder.findFirst({ where: { id, userId } }),
  findExisting: (userId, anilistId, malId) => prisma.animeReminder.findFirst({
    where: { userId, OR: [{ anilistId }, ...(malId ? [{ malId }] : [])] },
  }),
  getAnime,
  create: (userId, anime) => prisma.animeReminder.create({
    data: {
      userId, anilistId: anime.anilistId, malId: anime.malId,
      title: anime.title, titleEnglish: anime.titleEnglish, imageUrl: anime.imageUrl,
      mediaStatus: anime.status, totalEpisodes: anime.episodes,
      nextEpisode: null, nextAiringAt: null, nextAiringId: null,
      scheduleState: "UNVERIFIED", nextCheckAt: new Date(), enabled: true,
    },
  }),
  setEnabled: (userId, id, enabled) => prisma.$transaction(async (tx) => {
    const reminder = await tx.animeReminder.findFirst({ where: { id, userId } });
    if (!reminder) return null;
    const updated = await tx.animeReminder.update({
      where: { id, userId },
      data: enabled ? {
        enabled: true, nextEpisode: null, nextAiringAt: null, nextAiringId: null,
        scheduleState: "UNVERIFIED", nextCheckAt: new Date(), syncError: null,
      } : { enabled: false },
    });
    if (reminder.anilistId !== null) {
      await tx.notificationDelivery.updateMany({
        where: { userId, anilistId: reminder.anilistId, state: { in: ["PENDING", "FAILED"] } },
        data: { state: "SKIPPED", error: enabled ? "Awaiting fresh schedule verification" : "Reminder paused" },
      });
    }
    return updated;
  }),
  remove: (userId, id) => prisma.$transaction(async (tx) => {
    const reminder = await tx.animeReminder.findFirst({ where: { id, userId } });
    if (!reminder) return false;
    if (reminder.anilistId !== null) {
      await tx.notificationDelivery.updateMany({
        where: { userId, anilistId: reminder.anilistId, state: { in: ["PENDING", "FAILED"] } },
        data: { state: "SKIPPED", error: "Reminder removed" },
      });
    }
    // Receipt/tombstone rows intentionally survive removing and re-adding a title.
    await tx.animeReminder.deleteMany({ where: { id, userId } });
    return true;
  }),
  reconcile: (reminder, snapshot) => reconcileReminder(reminder, { snapshot }),
  serialize: serializeReminder,
});
