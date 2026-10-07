import type { AnimeSearchResult, AiringRecord } from "../anilist";
import type { NotificationKind, ScheduleState } from "@prisma/client";

export const AIRTIME_GRACE_MS = 30 * 60_000;
export const MORNING_WINDOW_MS = 60 * 60_000;

export function morningTime(airingAt: Date) {
  const ist = new Date(airingAt.getTime() + 330 * 60_000);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate(), 0, 30));
}

export function deliveryTime(kind: NotificationKind, airingAt: Date) {
  return kind === "MORNING" ? morningTime(airingAt) : airingAt;
}

export function deliveryWindow(kind: NotificationKind, airingAt: Date, now: Date, cutoverAt: Date) {
  const due = deliveryTime(kind, airingAt).getTime();
  const time = now.getTime();
  if (!Number.isFinite(due) || due < cutoverAt.getTime()) return "expired";
  if (time < due) return "future";
  const end = kind === "MORNING" ? Math.min(due + MORNING_WINDOW_MS, airingAt.getTime()) : due + AIRTIME_GRACE_MS;
  return time < end ? "due" : "expired";
}

export function confirmedEpisode(anime: AnimeSearchResult, airing: AiringRecord | null, episode: number, now: Date) {
  if (!airing || ![airing.id, airing.mediaId, airing.episode, airing.airingAt].every((n) => Number.isSafeInteger(n) && n > 0)) return false;
  if (airing.mediaId !== anime.anilistId || airing.episode !== episode) return false;
  if (anime.episodes !== null && (!Number.isSafeInteger(anime.episodes) || episode > anime.episodes)) return false;
  if (anime.status === "FINISHED") {
    const distance = now.getTime() - airing.airingAt * 1_000;
    return distance >= 0 && distance < AIRTIME_GRACE_MS;
  }
  return anime.status === "RELEASING" || anime.status === "NOT_YET_RELEASED";
}

export function upcomingSchedule(anime: AnimeSearchResult, now: Date) {
  if (!anime.nextAiringAt || !anime.nextEpisode || !anime.nextAiringId) return null;
  const airingAt = new Date(anime.nextAiringAt);
  if (!Number.isFinite(airingAt.getTime()) || airingAt <= now) return null;
  const airing = { id: anime.nextAiringId, mediaId: anime.anilistId, episode: anime.nextEpisode, airingAt: airingAt.getTime() / 1_000 };
  return confirmedEpisode(anime, airing, anime.nextEpisode, now) ? airing : null;
}

export function scheduleState(anime: AnimeSearchResult, now: Date): ScheduleState {
  if (anime.status === "FINISHED") return "COMPLETED";
  if (anime.status === "CANCELLED") return "CANCELLED";
  return upcomingSchedule(anime, now) ? "SCHEDULED" : "WAITING";
}
