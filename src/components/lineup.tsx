"use client";

import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { AnimeCard, type ReminderActions } from "@/components/anime-card";
import { EmptyState, PageHeading } from "@/components/ui";
import { filterLineup, type LineupFilter, type LineupSort } from "@/lib/agenda";
import type { ReminderView } from "@/lib/reminder-view";

export function Lineup({ reminders, completed = false, onAdd, onUpdated, onRemoved }: { reminders: ReminderView[]; completed?: boolean; onAdd: () => void } & ReminderActions) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<LineupFilter>("all");
  const [sort, setSort] = useState<LineupSort>("airing");
  const visible = filterLineup(reminders, query, filter, sort, completed);
  return <>
    <PageHeading title={completed ? "The closing credits." : "Your lineup."} description={completed ? "Finished seasons, kept together. Their alerts have stopped." : "Your shows, your pace. Keep track of what comes next."} action={!completed && <button type="button" className="button button-primary" onClick={onAdd}><Plus size={17} />Add anime</button>} />
    <div className="lineup-toolbar"><label className="search-field"><Search size={17} /><span className="sr-only">Search your lineup</span><input className="field" placeholder="Find a show in your lineup…" type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
      <label className="sort-field"><span>Sort by</span><select className="field" value={sort} onChange={(event) => setSort(event.target.value as LineupSort)}><option value="airing">Next airing</option><option value="title">Title A–Z</option><option value="added">Recently added</option></select></label>
    </div>
    {!completed && <div className="filter-bar" aria-label="Filter lineup">{([['all', 'All shows'], ['scheduled', 'Scheduled'], ['waiting', 'Awaiting schedule'], ['paused', 'Paused']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)} className={filter === value ? "filter-active" : ""}>{label}</button>)}</div>}
    <p className="result-count" role="status">{visible.length} {visible.length === 1 ? "show" : "shows"}{query && ` matching “${query}”`}</p>
    {visible.length ? <div className="lineup-list">{visible.map((reminder) => <AnimeCard key={reminder.id} reminder={reminder} onUpdated={onUpdated} onRemoved={onRemoved} />)}</div>
      : <EmptyState title={query || filter !== "all" ? "No matching shows" : completed ? "No closing credits yet" : "Your next season starts here"} action={!completed && !query && filter === "all" ? <button type="button" className="button button-primary" onClick={onAdd}>Find an anime <Plus size={17} /></button> : undefined}>{query || filter !== "all" ? "Try another title or filter to find your show." : completed ? "When a followed season finishes, it will appear here automatically." : "Add a show you’re following. We’ll keep its published release dates in one place."}</EmptyState>}
  </>;
}
