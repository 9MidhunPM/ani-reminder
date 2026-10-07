import type { ReminderView } from "@/lib/reminder-view";

export const AIRING_TIMEZONE = "Asia/Kolkata";
export const displayTitle = (reminder: Pick<ReminderView, "title" | "titleEnglish">) => reminder.titleEnglish || reminder.title;
export const isComplete = (reminder: ReminderView) => ["COMPLETED", "CANCELLED"].includes(reminder.scheduleState);

export function scheduledReminders(reminders: ReminderView[], now = new Date()) {
  return reminders.filter((reminder) => reminder.enabled && reminder.scheduleState === "SCHEDULED"
    && reminder.nextEpisode !== null && reminder.nextAiringAt !== null
    && new Date(reminder.nextAiringAt).getTime() > now.getTime())
    .sort((a, b) => new Date(a.nextAiringAt!).getTime() - new Date(b.nextAiringAt!).getTime());
}

export function dateKey(date: string | Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: AIRING_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(date));
}

export function formatAiring(date: string, includeDay = true) {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: AIRING_TIMEZONE, ...(includeDay ? { weekday: "short", day: "numeric", month: "short" } as const : {}),
    hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(date));
}

export type AgendaDay = { key: string; date: Date; today: boolean; reminders: ReminderView[] };

export function buildAgenda(reminders: ReminderView[], now = new Date()): AgendaDay[] {
  const upcoming = scheduledReminders(reminders, now);
  const start = new Date(`${dateKey(now)}T00:00:00+05:30`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start.getTime() + index * 86_400_000);
    const key = dateKey(date);
    return { key, date, today: index === 0, reminders: upcoming.filter((reminder) => dateKey(reminder.nextAiringAt!) === key) };
  });
}

export type LineupFilter = "all" | "scheduled" | "waiting" | "paused";
export type LineupSort = "airing" | "title" | "added";

export function filterLineup(reminders: ReminderView[], query: string, filter: LineupFilter, sort: LineupSort, completed = false) {
  const needle = query.trim().toLocaleLowerCase();
  return reminders.filter((reminder) => isComplete(reminder) === completed
    && (!needle || `${reminder.title} ${reminder.titleEnglish ?? ""}`.toLocaleLowerCase().includes(needle))
    && (filter === "all" || (filter === "paused" ? !reminder.enabled : reminder.enabled
      && (filter === "scheduled" ? reminder.scheduleState === "SCHEDULED" : ["WAITING", "UNVERIFIED"].includes(reminder.scheduleState)))))
    .sort((a, b) => sort === "title" ? displayTitle(a).localeCompare(displayTitle(b))
      : sort === "added" ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      : (a.nextAiringAt ? new Date(a.nextAiringAt).getTime() : Infinity) - (b.nextAiringAt ? new Date(b.nextAiringAt).getTime() : Infinity)
        || displayTitle(a).localeCompare(displayTitle(b)));
}
