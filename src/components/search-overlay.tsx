"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AnimeSearchResult } from "@/lib/jikan";

export function SearchOverlay({ open, onClose, onAdded }: { open: boolean; onClose: () => void; onAdded: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AnimeSearchResult[]>([]);
  const [busy, setBusy] = useState<number | null>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/anime/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
      const body = await response.json();
      if (response.ok) setResults(body.results);
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const handler = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  async function add(malId: number) {
    setBusy(malId); setMessage("");
    const response = await fetch("/api/reminders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ malId }) });
    const body = await response.json();
    setBusy(null);
    if (!response.ok) { setMessage(body.error ?? "Could not add anime"); return; }
    onAdded(); onClose();
  }

  return <AnimatePresence>{open && <motion.section role="dialog" aria-modal="true" aria-label="Search anime" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 overflow-y-auto bg-black/[.92] px-5 py-5 sm:px-12 sm:py-10">
    <button type="button" onClick={onClose} aria-label="Close search" className="relative ml-auto flex size-12 items-center justify-center border border-white/25 text-white hover:border-white"><X className="size-5" /><span className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2" /></button>
    <div className="mx-auto mt-[10vh] max-w-6xl">
      <label htmlFor="anime-search" className="sr-only">Find your anime</label>
      <div className="flex items-center border-b-2 border-white/30 focus-within:border-accent"><Search className="mr-4 size-7 shrink-0 text-accent" /><input autoFocus id="anime-search" name="query" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="FIND YOUR ANIME" className="title-font h-20 min-w-0 flex-1 bg-transparent text-4xl text-white outline-none placeholder:text-white/30 sm:h-24 sm:text-6xl" /></div>
      {message && <p className="mt-5 text-sm text-accent">{message}</p>}
      <div className="scrollbar-none mt-10 flex gap-4 overflow-x-auto pb-6">
        {results.map((anime) => <article key={anime.malId} className="w-44 shrink-0 sm:w-52">
          <div className="relative aspect-[2/3] overflow-hidden bg-[#171717]"><Image src={anime.imageUrl} alt="" fill sizes="208px" className="object-cover" /><button disabled={busy === anime.malId} onClick={() => add(anime.malId)} type="button" aria-label={`Add ${anime.title}`} className="absolute bottom-0 right-0 flex size-12 items-center justify-center border-l border-t border-white bg-[#0d0d0d] text-white hover:bg-accent disabled:opacity-50"><Plus className="size-5" /></button></div>
          <h2 className="title-font mt-3 line-clamp-2 text-2xl leading-none">{anime.titleEnglish ?? anime.title}</h2><p className="mt-2 text-xs text-white/45">{anime.airing ? "CURRENTLY AIRING" : anime.status ?? anime.type}</p>
        </article>)}
      </div>
    </div>
  </motion.section>}</AnimatePresence>;
}
