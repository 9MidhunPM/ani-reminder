"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import type { AnimeReminder } from "@prisma/client";
import { Countdown } from "@/components/countdown";

export function AnimeCard({ reminder, onChanged }: { reminder: AnimeReminder; onChanged: () => void }) {
  const target = reminder.nextAiringAt.toString();
  const today = new Date(target).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });
  const displayTitle = reminder.titleEnglish ?? reminder.title;
  const airingTime = new Date(target).toLocaleString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });

  async function toggle() {
    await fetch(`/api/reminders/${reminder.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !reminder.enabled }) });
    onChanged();
  }
  async function remove() {
    await fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
    onChanged();
  }

  return <article className={`group overflow-hidden border bg-[#151515] ${today ? "border-accent" : "border-white/15"}`}>
    <div className="relative aspect-[2/3] overflow-hidden bg-[#1a1a1a]">
      <Image
        src={reminder.imageUrl}
        alt=""
        fill
        quality={90}
        sizes="(min-width: 1280px) 23vw, (min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
        className={`object-cover transition-transform duration-500 group-hover:scale-[1.025] ${!reminder.enabled ? "opacity-45 grayscale" : ""}`}
      />
      <div className="absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-3">
        <p className={`bg-[#0d0d0d]/90 px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide ${today ? "text-accent" : "text-white/70"}`}>
          {today ? "Airing today" : reminder.enabled ? "Tracking" : "Paused"}
        </p>
        <p className="bg-accent px-2.5 py-1.5 font-mono text-xs uppercase tracking-wide text-white">EP {reminder.nextEpisode}</p>
      </div>
    </div>

    <div className="flex min-h-56 flex-col gap-5 p-5">
      <div className="min-w-0">
        <h2 className="title-font line-clamp-2 text-3xl uppercase text-white sm:text-4xl">{displayTitle}</h2>
        {reminder.titleEnglish && reminder.titleEnglish !== reminder.title && <p className="mt-2 truncate text-sm text-white/40">{reminder.title}</p>}
      </div>

      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2 border-t border-white/15 pt-4 text-sm">
        <dt className="text-white/40">Next release</dt>
        <dd className="text-right text-white/80">{airingTime} IST</dd>
        <dt className="text-white/40">Countdown</dt>
        <dd className="text-right font-mono tabular-nums"><Countdown target={target} /></dd>
      </dl>

      <div className="mt-auto flex items-center gap-3 border-t border-white/15 pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-white/65 sm:text-xs"><span className="relative inline-flex w-9 shrink-0 border border-white/25 p-0.5 has-checked:border-accent has-checked:bg-accent"><span className="aspect-square w-1/2 bg-white transition-transform group-has-checked:translate-x-full" /><input checked={reminder.enabled} onChange={toggle} type="checkbox" aria-label={`Toggle reminders for ${reminder.title}`} className="absolute inset-0 size-full appearance-none focus:outline-none" /></span>{reminder.enabled ? "REMINDERS ON" : "PAUSED"}</label>
        <button type="button" onClick={remove} aria-label={`Delete ${reminder.title}`} className="relative ml-auto flex size-9 items-center justify-center border border-white/20 text-white/60 hover:border-accent hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"><Trash2 className="size-4" /><span aria-hidden="true" className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2" /></button>
      </div>
    </div>
  </article>;
}
