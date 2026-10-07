"use client";

import { useEffect, useState } from "react";
import { Bell, RefreshCw, Sunrise, Zap } from "lucide-react";
import { EmptyState, Notice, PageHeading } from "@/components/ui";
import { apiRequest, errorMessage } from "@/lib/client-api";
import { formatAiring } from "@/lib/agenda";
import type { NotificationView } from "@/lib/reminder-view";

type ActivityPage = { notifications: NotificationView[]; nextCursor: string | null };
const states: Record<NotificationView["state"], { label: string; tone: string }> = {
  PENDING: { label: "Queued", tone: "waiting" }, CLAIMED: { label: "Sending", tone: "waiting" },
  SENT: { label: "Accepted by ntfy", tone: "scheduled" }, FAILED: { label: "Failed", tone: "error" },
  UNCERTAIN: { label: "Unconfirmed", tone: "waiting" }, SKIPPED: { label: "Skipped", tone: "paused" },
};

export function NotificationActivity() {
  const [items, setItems] = useState<NotificationView[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    apiRequest<ActivityPage>("/api/notifications", { signal: controller.signal }).then((body) => {
      if (!controller.signal.aborted) { setItems(body.notifications); setCursor(body.nextCursor); }
    }).catch((error) => { if (!controller.signal.aborted) setError(errorMessage(error)); });
    return () => controller.abort();
  }, []);

  async function load(more = false) {
    setBusy(true); setError("");
    try {
      const body = await apiRequest<ActivityPage>(`/api/notifications${more && cursor ? `?cursor=${encodeURIComponent(cursor)}` : ""}`);
      setItems((previous) => more ? [...(previous ?? []), ...body.notifications.filter((item) => !previous?.some((existing) => existing.id === item.id))] : body.notifications);
      setCursor(body.nextCursor);
    } catch (error) { setError(errorMessage(error)); }
    finally { setBusy(false); }
  }

  return <><PageHeading title="The delivery log." description="A clear record of your release alerts and test messages." action={<button type="button" className="button button-secondary" disabled={busy} onClick={() => load()}><RefreshCw size={15} />{busy ? "Refreshing…" : "Refresh"}</button>} />
    {error && <Notice kind="error">{error} <button type="button" className="inline-link" onClick={() => load()}>Try again</button></Notice>}
    {!items && !error && <p className="loading-copy" role="status">Loading your notification history…</p>}
    {items?.length === 0 && <EmptyState title="Quiet, for now." action={<a className="button button-secondary" href="/dashboard?view=settings">Send a test from Settings</a>}>When a release alert or test message is sent, its delivery result appears here.</EmptyState>}
    {!!items?.length && <><p className="activity-note">“Accepted by ntfy” means the service accepted the message. Check your device to confirm you received it.</p><ol className="activity-list">{items.map((item) => {
      const Icon = item.kind === "MORNING" ? Sunrise : item.kind === "AIRTIME" ? Zap : Bell;
      const status = states[item.state];
      return <li key={item.id} className="activity-item"><span className="activity-icon"><Icon size={19} strokeWidth={1.6} /></span><div className="activity-item-main"><p className="activity-kind">{item.kind === "MORNING" ? "Airing-day reminder" : item.kind === "AIRTIME" ? "Episode airtime" : "Test notification"}</p><h2>{item.title}{item.episode !== null && <span> · Episode {item.episode}</span>}</h2><p className="activity-date">{formatAiring(item.sentAt || item.scheduledFor)} IST</p>{item.state === "UNCERTAIN" && <p className="activity-explanation">The delivery result could not be confirmed. Check ntfy before retrying.</p>}{item.state === "FAILED" && <p className="activity-explanation">The service did not accept this message.</p>}{item.state === "SKIPPED" && <p className="activity-explanation">This alert was no longer needed when it was checked.</p>}</div><span className={`status-badge status-${status.tone}`}>{status.label}</span></li>;
    })}</ol>{cursor && <div className="activity-more"><button type="button" className="button button-secondary" disabled={busy} onClick={() => load(true)}>{busy ? "Loading…" : "Load earlier notifications"}</button></div>}</>}
  </>;
}
