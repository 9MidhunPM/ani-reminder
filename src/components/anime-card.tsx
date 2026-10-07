"use client";

import { useState } from "react";
import { ExternalLink, Pause, Play, Trash2 } from "lucide-react";
import { Countdown } from "@/components/countdown";
import { AnimeCover } from "@/components/anime-cover";
import { ScheduleStatus } from "@/components/schedule-status";
import { ConfirmDialog } from "@/components/dialog";
import { Notice } from "@/components/ui";
import { apiRequest, errorMessage } from "@/lib/client-api";
import { displayTitle, formatAiring, isComplete } from "@/lib/agenda";
import type { ReminderView } from "@/lib/reminder-view";

export type ReminderActions = { onUpdated: (reminder: ReminderView) => void; onRemoved: (id: string) => void };

export function AnimeCard({ reminder, onUpdated, onRemoved }: { reminder: ReminderView } & ReminderActions) {
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");
  const title = displayTitle(reminder);
  const completed = isComplete(reminder);
  const hasSchedule = reminder.scheduleState === "SCHEDULED" && reminder.nextAiringAt && reminder.nextEpisode;

  async function toggle() {
    setBusy(true); setError("");
    try {
      const body = await apiRequest<{ reminder: ReminderView }>(`/api/reminders/${reminder.id}`, { method: "PATCH", body: JSON.stringify({ enabled: !reminder.enabled }) });
      onUpdated(body.reminder);
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setError("");
    try {
      await apiRequest(`/api/reminders/${reminder.id}`, { method: "DELETE" });
      onRemoved(reminder.id);
    } catch (error) { setError(errorMessage(error)); setConfirming(false); }
    finally { setBusy(false); }
  }

  return <article className={`lineup-card ${!reminder.enabled ? "lineup-card-paused" : ""}`}>
    <AnimeCover src={reminder.imageUrl} title={title} className="lineup-cover" sizes="(max-width: 600px) 64px, 90px" />
    <div className="lineup-card-info">
      <ScheduleStatus reminder={reminder} />
      <h2>{title}</h2>
      {reminder.titleEnglish && reminder.titleEnglish !== reminder.title && <p className="lineup-alternate">{reminder.title}</p>}
      {hasSchedule ? <p className="lineup-date">Episode {reminder.nextEpisode}<span aria-hidden="true"> · </span>{formatAiring(reminder.nextAiringAt!)} IST</p>
        : <p className="lineup-date">{completed ? `${reminder.totalEpisodes ? `${reminder.totalEpisodes} episodes · ` : ""}No further alerts`
          : "We’ll wait for AniList to publish the next airing."}</p>}
      <details className="schedule-detail"><summary>Schedule details</summary><p>{reminder.scheduleCheckedAt ? `Last checked ${formatAiring(reminder.scheduleCheckedAt)} IST.` : "The next schedule check is pending."} {reminder.syncError ? "AniList could not be reached. We’ll check again automatically." : "Dates are provided by AniList."}</p>
        {reminder.anilistId && <a href={`https://anilist.co/anime/${reminder.anilistId}`} target="_blank" rel="noreferrer">View on AniList <ExternalLink size={12} /></a>}
      </details>
    </div>
    <div className="lineup-card-actions">
      {hasSchedule && reminder.enabled && <span className="lineup-countdown"><Countdown target={reminder.nextAiringAt} /></span>}
      <div className="action-pair">
        {!completed && <button type="button" className="icon-button" disabled={busy} onClick={toggle} aria-label={`${reminder.enabled ? "Pause" : "Resume"} alerts for ${title}`} title={reminder.enabled ? "Pause alerts" : "Resume alerts"}>{reminder.enabled ? <Pause size={16} /> : <Play size={16} />}</button>}
        <button type="button" className="icon-button" disabled={busy} onClick={() => setConfirming(true)} aria-label={`Remove ${title}`} title="Remove from lineup"><Trash2 size={16} /></button>
      </div>
    </div>
    {error && <div className="lineup-card-error"><Notice kind="error" onDismiss={() => setError("")}>{error}</Notice></div>}
    <ConfirmDialog open={confirming} title="Remove from your lineup?" busy={busy} onClose={() => setConfirming(false)} onConfirm={remove} confirmLabel="Remove anime">You’ll stop following <strong>{title}</strong>. You can find and add it again later.</ConfirmDialog>
  </article>;
}
