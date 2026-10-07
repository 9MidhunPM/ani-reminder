export type ScheduleState = "UNVERIFIED" | "SCHEDULED" | "WAITING" | "COMPLETED" | "CANCELLED";

export type ReminderView = {
  id: string;
  anilistId: number | null;
  title: string;
  titleEnglish: string | null;
  imageUrl: string;
  nextEpisode: number | null;
  nextAiringAt: string | null;
  totalEpisodes: number | null;
  enabled: boolean;
  scheduleState: ScheduleState;
  mediaStatus: string | null;
  scheduleCheckedAt: string | null;
  syncError: string | null;
  createdAt: string;
};

export type AccountSettings = {
  email: string;
  morningEnabled: boolean;
  airtimeEnabled: boolean;
  topicConfigured: boolean;
};

export type NotificationView = {
  id: string;
  title: string;
  episode: number | null;
  kind: "MORNING" | "AIRTIME" | "TEST";
  state: "PENDING" | "CLAIMED" | "SENT" | "FAILED" | "UNCERTAIN" | "SKIPPED";
  scheduledFor: string;
  sentAt: string | null;
  error: string | null;
};
