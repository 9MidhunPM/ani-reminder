"use client";

import { Check, Plus, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Dialog } from "@/components/dialog";
import { AnimeCover } from "@/components/anime-cover";
import { Notice } from "@/components/ui";
import { apiRequest, errorMessage } from "@/lib/client-api";
import { formatAiring } from "@/lib/agenda";
import type { AnimeSearchResult } from "@/lib/anilist";
import type { ReminderView } from "@/lib/reminder-view";

const mediaLabels: Record<string, string> = { RELEASING: "Currently airing", FINISHED: "Season finished", NOT_YET_RELEASED: "Upcoming", CANCELLED: "Cancelled", HIATUS: "On a break" };

type SearchResponse = { query: string; results: AnimeSearchResult[]; error: string };

export function SearchOverlay({ open, onClose, onAdded, reminders }: { open: boolean; onClose: () => void; onAdded: (reminder: ReminderView) => void; reminders: ReminderView[] }) {
  const [query, setQuery] = useState("");
  const [response, setResponse] = useState<SearchResponse>({ query: "", results: [], error: "" });
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const search = query.trim();
  const valid = search.length >= 2;
  const current = response.query === search;
  const results = current ? response.results : [];
  const searching = valid && !current;

  useEffect(() => {
    if (!open || search.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const body = await apiRequest<{ results: AnimeSearchResult[] }>(`/api/anime/search?q=${encodeURIComponent(search)}`, { signal: controller.signal });
        if (!controller.signal.aborted) setResponse({ query: search, results: body.results, error: "" });
      } catch (error) {
        if (!controller.signal.aborted) setResponse({ query: search, results: [], error: errorMessage(error) });
      }
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [search, open]);

  async function add(anime: AnimeSearchResult) {
    setBusy(anime.anilistId); setMessage(null);
    try {
      const body = await apiRequest<{ reminder: ReminderView; tracked: boolean }>("/api/reminders", { method: "POST", body: JSON.stringify({ anilistId: anime.anilistId }) });
      onAdded(body.reminder);
      setMessage({ text: body.tracked ? "Already in your lineup. Your alert preference has been kept." : `${anime.titleEnglish || anime.title} added. You can send a test alert from Settings.`, error: false });
    } catch (error) { setMessage({ text: errorMessage(error), error: true }); }
    finally { setBusy(null); }
  }

  return <Dialog open={open} onClose={onClose} title="Find your next watch.">
    <p className="search-intro">Search AniList. Follow a show now, even if its next airing hasn’t been announced.</p>
    <label className="search-field search-catalog"><Search size={21} /><span className="sr-only">Search anime titles</span><input data-initial-focus type="search" className="field" value={query} onChange={(event) => { setQuery(event.target.value); setMessage(null); }} placeholder="Try One Piece, Frieren, or a favorite…" maxLength={150} /></label>
    {message && <div className="search-feedback"><Notice kind={message.error ? "error" : "success"} onDismiss={() => setMessage(null)}>{message.text}</Notice></div>}
    {searching && <p className="search-status" role="status">Searching AniList…</p>}
    {valid && current && response.error && <div className="search-feedback"><Notice kind="error">{response.error} <button type="button" className="inline-link" onClick={() => setResponse({ query: "", results: [], error: "" })}>Try searching again</button></Notice></div>}
    {valid && current && !response.error && !results.length && <p className="search-status" role="status">No titles found. Try another spelling or the Japanese title.</p>}
    {!valid && <div className="search-welcome"><Search size={31} strokeWidth={1.3} /><p>Every lineup starts with a title.</p><span>Type at least two characters to find yours.</span></div>}
    {valid && !!results.length && <><p className="search-result-count" role="status">{results.length} results from AniList</p><div className="search-results">{results.map((anime) => {
      const title = anime.titleEnglish || anime.title;
      const tracked = reminders.some((reminder) => reminder.anilistId === anime.anilistId);
      const finished = anime.status === "FINISHED" || anime.status === "CANCELLED";
      const scheduled = anime.nextAiringAt && anime.nextEpisode;
      return <article key={anime.anilistId} className="search-result"><AnimeCover src={anime.imageUrl} title={title} className="search-result-cover" sizes="80px" /><div className="search-result-info"><p className="search-result-meta">{anime.type?.replaceAll("_", " ") || "Anime"}<span>·</span>{mediaLabels[anime.status ?? ""] || "Schedule pending"}</p><h3>{title}</h3>{anime.titleEnglish && anime.titleEnglish !== anime.title && <p className="search-result-alternate">{anime.title}</p>}<p className="search-result-schedule">{finished ? `${anime.episodes ? `${anime.episodes} episodes · ` : ""}No new release alerts` : scheduled ? `Ep ${anime.nextEpisode} · ${formatAiring(anime.nextAiringAt!)} IST` : "Next airing not announced"}</p><button type="button" className={`button ${tracked ? "button-quiet" : "button-secondary"}`} disabled={tracked || finished || busy !== null} onClick={() => add(anime)}>{tracked ? <><Check size={14} />In your lineup</> : finished ? "Season closed" : busy === anime.anilistId ? "Adding…" : <><Plus size={14} />{scheduled ? "Add to lineup" : "Follow show"}</>}</button></div></article>;
    })}</div></>}
  </Dialog>;
}
