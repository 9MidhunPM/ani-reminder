import type { AnimeReminder, Prisma } from "@prisma/client";
import { getAnime, type AnimeSearchResult, type AiringRecord } from "../anilist";
import { prisma } from "../prisma";
import { deliveryTime, deliveryWindow, scheduleState, upcomingSchedule } from "./policy";
import { ProviderDeferred } from "./provider-budget";

export async function reconcileIntents(tx: Prisma.TransactionClient, reminder: AnimeReminder, airing: AiringRecord, now: Date, cutoverAt: Date) {
  if (!reminder.anilistId) return;
  const user = await tx.user.findUnique({ where: { id: reminder.userId } });
  if (!user) return;
  const airingAt = new Date(airing.airingAt * 1_000);
  for (const kind of ["MORNING", "AIRTIME"] as const) {
    const enabled = reminder.enabled && (kind === "MORNING" ? user.morningEnabled : user.airtimeEnabled);
    const expired = deliveryWindow(kind, airingAt, now, cutoverAt) === "expired";
    const data = {
      title: reminder.titleEnglish ?? reminder.title, airingAt, sourceId: airing.id,
      scheduledFor: deliveryTime(kind, airingAt),
      state: enabled && !expired ? "PENDING" as const : "SKIPPED" as const,
      error: expired ? "Delivery window expired or predates cutover" : enabled ? null : "Reminders disabled",
    };
    const key = { userId: reminder.userId, anilistId: reminder.anilistId, episode: airing.episode, kind };
    // Updating only untouched outcomes preserves deduplication across removal/re-add and reschedules.
    await tx.notificationDelivery.createMany({ data: [{ ...key, ...data }], skipDuplicates: true });
    await tx.notificationDelivery.updateMany({ where: { ...key, state: { in: ["PENDING", "FAILED", "SKIPPED"] } }, data });
  }
}

export async function reconcileReminder(reminder: AnimeReminder, options: { now?: Date; snapshot?: AnimeSearchResult } = {}): Promise<AnimeReminder> {
  const now = options.now ?? new Date();
  if (!reminder.anilistId) {
    return prisma.animeReminder.update({ where: { id: reminder.id }, data: {
      nextEpisode: null, nextAiringAt: null, nextAiringId: null, scheduleState: "UNVERIFIED",
      syncError: "This legacy title needs to be added again from AniList.", nextCheckAt: new Date(now.getTime() + 86_400_000),
    } });
  }
  let anime: AnimeSearchResult;
  try { anime = options.snapshot ?? await getAnime(reminder.anilistId); }
  catch (error) {
    await prisma.animeReminder.update({ where: { id: reminder.id }, data: {
      syncError: "The published schedule could not be verified. Notifications are deferred.",
      nextCheckAt: error instanceof ProviderDeferred ? error.retryAt : new Date(now.getTime() + 5 * 60_000),
    } });
    throw error;
  }
  if (anime.anilistId !== reminder.anilistId) throw new Error("Schedule identity mismatch");
  const airing = upcomingSchedule(anime, now);
  const state = scheduleState(anime, now);
  const interval = state === "COMPLETED" || state === "CANCELLED" ? 86_400_000 : 6 * 3_600_000;
  return prisma.$transaction(async (tx) => {
    const current = await tx.animeReminder.findUniqueOrThrow({ where: { id: reminder.id } });
    const updated = await tx.animeReminder.update({ where: { id: reminder.id }, data: {
      title: anime.title, titleEnglish: anime.titleEnglish, imageUrl: anime.imageUrl,
      totalEpisodes: anime.episodes, mediaStatus: anime.status, scheduleState: state,
      nextEpisode: airing?.episode ?? null, nextAiringId: airing?.id ?? null,
      nextAiringAt: airing ? new Date(airing.airingAt * 1_000) : null,
      broadcastDay: airing ? anime.broadcastDay : null, broadcastTime: airing ? anime.broadcastTime : null,
      broadcastTimezone: "Asia/Kolkata", scheduleCheckedAt: now, syncError: null,
      nextCheckAt: new Date(Math.min(now.getTime() + interval, airing ? airing.airingAt * 1_000 : Infinity)),
    } });
    const control = await tx.schedulerControl.findUniqueOrThrow({ where: { id: "main" } });
    if (airing) await reconcileIntents(tx, { ...updated, enabled: current.enabled }, airing, now, control.cutoverAt);
    // Keep older pending episode intents: exact-record verification decides whether they aired.
    return updated;
  });
}
