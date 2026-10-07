import type { AnimeReminder } from "@prisma/client";
import type { ReminderView } from "./reminder-view";

export function serializeReminder(reminder: AnimeReminder): ReminderView {
  return {
    id: reminder.id, anilistId: reminder.anilistId, title: reminder.title,
    titleEnglish: reminder.titleEnglish, imageUrl: reminder.imageUrl,
    nextEpisode: reminder.nextEpisode, nextAiringAt: reminder.nextAiringAt?.toISOString() ?? null,
    totalEpisodes: reminder.totalEpisodes, enabled: reminder.enabled,
    scheduleState: reminder.scheduleState, mediaStatus: reminder.mediaStatus,
    scheduleCheckedAt: reminder.scheduleCheckedAt?.toISOString() ?? null,
    syncError: reminder.syncError, createdAt: reminder.createdAt.toISOString(),
  };
}
