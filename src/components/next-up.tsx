import { ArrowUpRight, CalendarClock } from "lucide-react";
import { AnimeCover } from "@/components/anime-cover";
import { Countdown } from "@/components/countdown";
import { displayTitle, formatAiring, scheduledReminders } from "@/lib/agenda";
import type { ReminderView } from "@/lib/reminder-view";

export function NextUp({ reminders, now, onAdd }: { reminders: ReminderView[]; now: Date; onAdd: () => void }) {
  const next = scheduledReminders(reminders, now)[0];
  if (!next) return <section className="next-up next-up-empty" aria-labelledby="next-up-heading">
    <div><p className="eyebrow">Up next</p><h2 id="next-up-heading" className="title-font">Room for your<br /><span className="accent">next favorite.</span></h2><p>{reminders.length ? "Your followed shows are quiet for now. Published airings will appear here." : "Find your shows. We’ll take care of the release dates."}</p><button className="button button-primary" onClick={onAdd} type="button">Find an anime <ArrowUpRight size={17} /></button></div>
    <CalendarClock className="next-up-empty-icon" strokeWidth={.8} aria-hidden="true" />
  </section>;
  const title = displayTitle(next);
  return <section className="next-up" aria-labelledby="next-up-heading">
    <div className="next-up-main"><div className="next-up-kicker"><span className="eyebrow">Up next in your lineup</span><span className="status-badge status-scheduled">Published airing</span></div>
      <h2 id="next-up-heading" className="title-font">{title}</h2>
      <p className="next-up-date">Episode {next.nextEpisode}<span aria-hidden="true"> / </span>{formatAiring(next.nextAiringAt!)} IST</p>
      <div className="next-up-bottom"><span className="next-up-countdown"><Countdown target={next.nextAiringAt} /><small>until scheduled airing</small></span>{next.anilistId && <a href={`https://anilist.co/anime/${next.anilistId}`} target="_blank" rel="noreferrer" className="next-up-source">View on AniList <ArrowUpRight size={16} /></a>}</div>
      {next.syncError && <p className="next-up-warning">Schedule updates are delayed. Showing the last published airing.</p>}
    </div>
    <AnimeCover src={next.imageUrl} title={title} className="next-up-cover" sizes="(max-width: 600px) 110px, 220px" priority />
  </section>;
}
