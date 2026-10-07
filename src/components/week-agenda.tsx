import { ArrowRight } from "lucide-react";
import { AnimeCover } from "@/components/anime-cover";
import { AIRING_TIMEZONE, buildAgenda, displayTitle, formatAiring } from "@/lib/agenda";
import type { ReminderView } from "@/lib/reminder-view";

export function WeekAgenda({ reminders, now, onLineup }: { reminders: ReminderView[]; now: Date; onLineup: () => void }) {
  const days = buildAgenda(reminders, now);
  const count = days.reduce((sum, day) => sum + day.reminders.length, 0);
  return <section className="week-section" aria-labelledby="week-heading">
    <div className="section-heading"><div><h2 id="week-heading">The next seven days</h2><p>{count} scheduled {count === 1 ? "release" : "releases"}<span aria-hidden="true"> · </span>All times in IST</p></div><button type="button" className="text-button" onClick={onLineup}>Your lineup <ArrowRight size={15} /></button></div>
    <div className="week-grid">{days.map((day) => <section key={day.key} className={`week-day ${day.today ? "week-day-today" : ""}`} aria-label={day.date.toLocaleDateString("en-IN", { timeZone: AIRING_TIMEZONE, weekday: "long", day: "numeric", month: "long" })}>
      <header className="week-day-heading"><span>{day.today ? "Today" : day.date.toLocaleDateString("en-IN", { timeZone: AIRING_TIMEZONE, weekday: "short" })}</span><strong>{day.date.toLocaleDateString("en-IN", { timeZone: AIRING_TIMEZONE, day: "2-digit" })}</strong><span className="week-day-month">{day.date.toLocaleDateString("en-IN", { timeZone: AIRING_TIMEZONE, month: "short" })}</span></header>
      <div className="week-day-items">{day.reminders.length ? day.reminders.map((reminder) => <article key={reminder.id} className="week-event">
        <AnimeCover src={reminder.imageUrl} title={displayTitle(reminder)} className="week-event-cover" sizes="(max-width: 700px) 50px, 120px" />
        <div><p className="week-event-time">{formatAiring(reminder.nextAiringAt!, false)}</p><h3>{displayTitle(reminder)}</h3><p className="week-event-episode">Episode {reminder.nextEpisode}</p></div>
      </article>) : <p className="quiet-day"><span aria-hidden="true">—</span> No releases</p>}</div>
    </section>)}</div>
    <p className="schedule-footnote">Only published airings appear here. When a show takes a break, its place in your lineup stays.</p>
  </section>;
}
