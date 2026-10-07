"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { AppShell, type DashboardView } from "@/components/app-shell";
import { NextUp } from "@/components/next-up";
import { WeekAgenda } from "@/components/week-agenda";
import { Lineup } from "@/components/lineup";
import { SearchOverlay } from "@/components/search-overlay";
import { AccountSettingsPanel } from "@/components/account-settings";
import { NotificationActivity } from "@/components/notification-activity";
import { Notice, PageHeading } from "@/components/ui";
import { apiRequest, errorMessage } from "@/lib/client-api";
import { isComplete } from "@/lib/agenda";
import type { ReminderView } from "@/lib/reminder-view";

const views: DashboardView[] = ["week", "lineup", "completed", "activity", "settings"];

export function Dashboard({ initialReminders, email, initialNow }: { initialReminders: ReminderView[]; email: string; initialNow: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const requested = params.get("view") as DashboardView;
  const view = views.includes(requested) ? requested : "week";
  const [reminders, setReminders] = useState(initialReminders);
  const [searchOpen, setSearchOpen] = useState(false);
  const [now, setNow] = useState(new Date(initialNow));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const mutation = useRef(0);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    const revision = mutation.current;
    try {
      const body = await apiRequest<{ reminders: ReminderView[] }>("/api/reminders", { signal });
      if (!signal?.aborted && revision === mutation.current) { setReminders(body.reminders); setError(""); }
    } catch (error) { if (!signal?.aborted) setError(errorMessage(error)); }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setInterval(() => {
      setNow(new Date());
      if (document.visibilityState === "visible") void refresh(controller.signal);
    }, 60_000);
    const wake = () => { if (document.visibilityState === "visible") { setNow(new Date()); void refresh(controller.signal); } };
    document.addEventListener("visibilitychange", wake);
    return () => { controller.abort(); window.clearInterval(timer); document.removeEventListener("visibilitychange", wake); };
  }, [refresh]);

  function update(reminder: ReminderView) {
    mutation.current += 1;
    setReminders((previous) => previous.some((item) => item.id === reminder.id) ? previous.map((item) => item.id === reminder.id ? reminder : item) : [...previous, reminder]);
  }
  function remove(id: string) {
    mutation.current += 1;
    setReminders((previous) => previous.filter((item) => item.id !== id));
    setNotice("Removed from your lineup.");
  }
  const active = reminders.filter((reminder) => !isComplete(reminder));
  const waiting = active.filter((reminder) => reminder.enabled && ["WAITING", "UNVERIFIED"].includes(reminder.scheduleState));
  const finished = reminders.filter(isComplete);
  const openSearch = () => setSearchOpen(true);

  return <AppShell view={view} email={email} count={active.length} onSearch={openSearch}>
    {error && <div className="dashboard-message"><Notice kind="error">{error} <button type="button" className="inline-link" onClick={() => refresh()}>Refresh your lineup</button></Notice></div>}
    {notice && <div className="dashboard-message"><Notice kind="success" onDismiss={() => setNotice("")}>{notice}</Notice></div>}
    {view === "week" && <>
      <PageHeading title="Your week, on cue." description="A little anticipation. A clear view of what’s coming." action={<button type="button" className="button button-primary" onClick={openSearch}><Plus size={17} />Add anime</button>} />
      <NextUp reminders={reminders} now={now} onAdd={openSearch} />
      <WeekAgenda reminders={reminders} now={now} onLineup={() => router.push("/dashboard?view=lineup")} />
      <div className="lineup-summary"><div><h2>Your lineup keeps its place.</h2><p>{active.length} followed {active.length === 1 ? "show" : "shows"}{waiting.length > 0 && ` · ${waiting.length} awaiting a published schedule`}{finished.length > 0 && ` · ${finished.length} completed`}</p></div><button type="button" className="text-button" onClick={() => router.push("/dashboard?view=lineup")}>Manage lineup <ArrowRight size={15} /></button></div>
    </>}
    {(view === "lineup" || view === "completed") && <Lineup key={view} reminders={reminders} completed={view === "completed"} onAdd={openSearch} onUpdated={update} onRemoved={remove} />}
    {view === "activity" && <NotificationActivity />}
    {view === "settings" && <AccountSettingsPanel />}
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onAdded={update} reminders={reminders} />
  </AppShell>;
}
