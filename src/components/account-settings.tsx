"use client";

import { useEffect, useState, type FormEvent } from "react";
import { signOut } from "next-auth/react";
import { ArrowUpRight, BellRing, Eye, EyeOff, LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/dialog";
import { Notice, PageHeading } from "@/components/ui";
import { LoadingState } from "@/components/loading-state";
import { apiRequest, errorMessage } from "@/lib/client-api";
import type { AccountSettings, NotificationView } from "@/lib/reminder-view";

export function AccountSettingsPanel() {
  const [settings, setSettings] = useState<AccountSettings | null>(null);
  const [loadError, setLoadError] = useState("");
  const [retry, setRetry] = useState(0);
  const [topic, setTopic] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState<"save" | "test" | "delete" | null>(null);
  const [message, setMessage] = useState<{ text: string; kind: "info" | "error" | "success" } | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ settings: AccountSettings }>("/api/account", { signal: controller.signal }).then((body) => {
      if (!controller.signal.aborted) { setSettings(body.settings); setLoadError(""); }
    }).catch((error) => { if (!controller.signal.aborted) setLoadError(errorMessage(error)); });
    return () => controller.abort();
  }, [retry]);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!settings) return;
    setBusy("save"); setMessage(null);
    try {
      const body = await apiRequest<{ settings: AccountSettings }>("/api/account", { method: "PATCH", body: JSON.stringify({ morningEnabled: settings.morningEnabled, airtimeEnabled: settings.airtimeEnabled, ...(topic.trim() ? { ntfyTopic: topic.trim() } : {}) }) });
      setSettings(body.settings); setTopic(""); setMessage({ text: "Your notification preferences have been saved.", kind: "success" });
    } catch (error) { setMessage({ text: errorMessage(error), kind: "error" }); }
    finally { setBusy(null); }
  }

  async function test() {
    setBusy("test"); setMessage(null);
    try {
      const body = await apiRequest<{ notification: NotificationView; testNotification: "sent" | "failed" | "uncertain" }>("/api/notifications", { method: "POST", body: "{}" });
      setMessage(body.testNotification === "sent"
        ? { text: "ntfy accepted your test message. Check the device subscribed to your saved topic.", kind: "success" }
        : body.testNotification === "uncertain"
          ? { text: "The delivery result is uncertain. Check your ntfy app before sending another test.", kind: "info" }
          : { text: "The test could not be sent. Check your saved topic and try again shortly.", kind: "error" });
    } catch (error) { setMessage({ text: errorMessage(error), kind: "error" }); }
    finally { setBusy(null); }
  }

  async function removeAccount() {
    setBusy("delete"); setMessage(null);
    try { await apiRequest("/api/account", { method: "DELETE" }); await signOut({ callbackUrl: "/" }); }
    catch (error) { setConfirming(false); setMessage({ text: errorMessage(error), kind: "error" }); setBusy(null); }
  }

  return <>
    <PageHeading title="Make it yours." description="A quieter lineup starts with the right notifications." />
    {loadError && <Notice kind="error">{loadError} <button type="button" className="inline-link" onClick={() => setRetry((value) => value + 1)}>Try again</button></Notice>}
    {!settings && !loadError && <LoadingState label="Loading your preferences…" />}
    {message && <div className="settings-message"><Notice kind={message.kind} onDismiss={() => setMessage(null)}>{message.text}</Notice></div>}
    {settings && <div className="settings-layout"><form onSubmit={save} className="settings-form">
      <section className="settings-section"><h2>Your alerts</h2><p>Choose when you’d like a nudge. Release times follow AniList’s published schedule.</p>
        <label className="preference-row"><span><strong>Airing-day reminder</strong><small>A morning reminder at 6:00 AM IST. Early airings skip the morning reminder.</small></span><input type="checkbox" disabled={busy !== null} checked={settings.morningEnabled} onChange={(event) => setSettings({ ...settings, morningEnabled: event.target.checked })} className="switch" /></label>
        <label className="preference-row"><span><strong>Episode airtime</strong><small>An alert at the published airing time. Streaming availability can vary.</small></span><input type="checkbox" disabled={busy !== null} checked={settings.airtimeEnabled} onChange={(event) => setSettings({ ...settings, airtimeEnabled: event.target.checked })} className="switch" /></label>
      </section>
      <section className="settings-section"><h2>Your ntfy topic</h2><p>{settings.topicConfigured ? "A topic is configured. Enter a new one below only if you want to replace it." : "Set a topic to receive alerts in the ntfy app."}</p><label htmlFor="replacement-topic" className="field-label">Replace topic</label><div className="password-field"><input id="replacement-topic" disabled={busy !== null} className="field" type={visible ? "text" : "password"} value={topic} onChange={(event) => setTopic(event.target.value)} minLength={12} maxLength={64} pattern={"[a-zA-Z0-9_\\-]+"} autoComplete="off" placeholder="Enter a new private topic" aria-describedby="topic-guidance" /><button type="button" onClick={() => setVisible(!visible)} aria-label={visible ? "Hide topic" : "Show topic"}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><p id="topic-guidance" className="field-hint">12–64 letters, numbers, underscores, or hyphens. Leave blank to keep your saved topic.</p></section>
      <button type="submit" className="button button-primary" disabled={busy !== null}>{busy === "save" ? "Saving…" : "Save preferences"}</button>
    </form>
    <aside className="settings-help"><BellRing size={24} strokeWidth={1.4} /><h2>A quick sound check.</h2><p>Install ntfy on your phone, then subscribe to the same topic you saved here.</p><a className="text-button" href="https://ntfy.sh/docs/subscribe/phone/" target="_blank" rel="noreferrer">Open ntfy setup guide <ArrowUpRight size={15} /></a><div className="settings-test"><p>Already subscribed? Send a test to your saved topic.</p><button type="button" className="button button-secondary" disabled={busy !== null || !settings.topicConfigured || !!topic.trim()} onClick={test}><BellRing size={15} />{busy === "test" ? "Sending test…" : "Send test notification"}</button>{topic.trim() && <p className="field-hint">Save your new topic before testing it.</p>}</div><p className="settings-help-note">Keep your topic hard to guess. Your saved topic is never displayed here.</p></aside>
    <section className="settings-account"><div><h2>Your account</h2><p>{settings.email}</p></div><button type="button" className="button button-secondary" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={15} />Sign out</button></section>
    <section className="settings-delete"><div><h2>Leave AniReminder</h2><p>Permanently delete your account, lineup, and notification history.</p></div><button type="button" className="button button-danger" onClick={() => setConfirming(true)} disabled={busy !== null}>Delete account</button></section>
    </div>}
    <ConfirmDialog open={confirming} title="Delete your account?" busy={busy === "delete"} onClose={() => setConfirming(false)} onConfirm={removeAccount} confirmLabel="Delete account">Your lineup, notification history, and account will be permanently removed. This cannot be undone.</ConfirmDialog>
  </>;
}
