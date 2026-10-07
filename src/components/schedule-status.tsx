import type { ReminderView } from "@/lib/reminder-view";

export function scheduleLabel(reminder: ReminderView) {
  if (reminder.scheduleState === "COMPLETED") return { label: "Season finished", tone: "completed" };
  if (reminder.scheduleState === "CANCELLED") return { label: "Cancelled", tone: "completed" };
  if (!reminder.enabled) return { label: "Paused", tone: "paused" };
  if (reminder.syncError) return { label: "Update delayed", tone: "error" };
  if (reminder.scheduleState === "SCHEDULED") return { label: "Scheduled", tone: "scheduled" };
  if (reminder.scheduleState === "UNVERIFIED") return { label: "Checking schedule", tone: "waiting" };
  return { label: "Awaiting schedule", tone: "waiting" };
}

export function ScheduleStatus({ reminder }: { reminder: ReminderView }) {
  const { label, tone } = scheduleLabel(reminder);
  return <span className={`status-badge status-${tone}`}>{label}</span>;
}
