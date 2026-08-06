"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import type { AnimeReminder } from "@prisma/client";
import { Countdown } from "@/components/countdown";

export function AnimeCard({ reminder, variant, onChanged }: { reminder: AnimeReminder; variant: "wide" | "narrow"; onChanged: () => void }) {
  const target = reminder.nextAiringAt.toString();
  const today = new Date(target).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }) === new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" });

  async function toggle() {
    await fetch(`/api/reminders/${reminder.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !reminder.enabled }) });
    onChanged();
  }
  async function remove() {
    await fetch(`/api/reminders/${reminder.id}`, { method: "DELETE" });
    onChanged();
  }

  return <article className={`group relative overflow-hidden border bg-[#151515] ${today ? "border-accent" : "border-white/15"} ${variant === "wide" ? "min-h-[440px] lg:col-span-7 lg:row-span-2" : "min-h-[280px] lg:col-span-5"}`}>
    <Image src={reminder.imageUrl} alt="" fill sizes={variant === "wide" ? "(min-width: 1024px) 58vw, 100vw" : "(min-width: 1024px) 42vw, 100vw"} className={`object-cover transition-transform duration-500 group-hover:scale-[1.02] ${!reminder.enabled ? "opacity-35 grayscale" : ""}`} />
    <div className="card-shade absolute inset-0" />
    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
      {today && <p className="mb-3 flex items-center gap-2 text-xs uppercase tracking-[.18em] text-accent"><span className="signal-pulse size-1.5 rounded-full bg-accent" />Airing today</p>}
      <h2 className={`title-font max-w-[18ch] uppercase leading-[.95] text-white ${variant === "wide" ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl"}`}>{reminder.titleEnglish ?? reminder.title}</h2>
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/55"><span>EPISODE {reminder.nextEpisode}</span><span>{new Date(target).toLocaleString("en-IN", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" })} IST</span><Countdown target={target} /></div>
      <div className="mt-5 flex items-center gap-3 border-t border-white/20 pt-4">
        <label className="flex cursor-pointer items-center gap-2 text-xs text-white/65"><span className="relative inline-flex w-9 shrink-0 border border-white/25 p-0.5 has-checked:border-accent has-checked:bg-accent"><span className="aspect-square w-1/2 bg-white transition-transform group-has-checked:translate-x-full" /><input checked={reminder.enabled} onChange={toggle} type="checkbox" aria-label={`Toggle reminders for ${reminder.title}`} className="absolute inset-0 size-full appearance-none focus:outline-none" /></span>{reminder.enabled ? "REMINDERS ON" : "PAUSED"}</label>
        <button type="button" onClick={remove} aria-label={`Delete ${reminder.title}`} className="relative ml-auto flex size-9 items-center justify-center border border-white/20 text-white/60 hover:border-accent hover:text-accent"><Trash2 className="size-4" /><span className="pointer-fine:hidden absolute left-1/2 top-1/2 size-[max(100%,3rem)] -translate-1/2" /></button>
      </div>
    </div>
  </article>;
}
