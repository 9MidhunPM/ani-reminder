"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Search } from "lucide-react";
import { signOut } from "next-auth/react";
import type { AnimeReminder } from "@prisma/client";
import { useState } from "react";
import { AnimeCard } from "@/components/anime-card";
import { SearchOverlay } from "@/components/search-overlay";

export function Dashboard({ initialReminders, email }: { initialReminders: AnimeReminder[]; email: string }) {
  const [reminders, setReminders] = useState(initialReminders);
  const [searchOpen, setSearchOpen] = useState(false);

  async function refresh() {
    const response = await fetch("/api/reminders");
    if (response.ok) setReminders((await response.json()).reminders);
  }

  return <div className="min-h-screen lg:pl-16">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-16 flex-col items-center border-r border-white/15 bg-[#0d0d0d] py-5 lg:flex">
      <span className="title-font text-3xl text-accent">AR</span>
      <nav className="mt-16 flex flex-col gap-4" aria-label="Primary"><button type="button" aria-label="Your reminders" className="relative flex size-11 items-center justify-center border-l-2 border-accent text-white"><Bell className="size-5" /></button><button type="button" aria-label="Search anime" onClick={() => setSearchOpen(true)} className="relative flex size-11 items-center justify-center text-white/50 hover:text-white"><Search className="size-5" /></button></nav>
      <button type="button" aria-label="Sign out" onClick={() => signOut({ callbackUrl: "/login" })} className="relative mt-auto flex size-11 items-center justify-center text-white/45 hover:text-white"><LogOut className="size-5" /></button>
    </aside>
    <header className="sticky top-0 z-20 flex h-16 items-center border-b border-white/15 bg-[#0d0d0d] px-5 sm:px-8 lg:hidden"><span className="title-font text-3xl text-accent">ANI REMINDER</span><button type="button" aria-label="Search anime" onClick={() => setSearchOpen(true)} className="relative ml-auto flex size-11 items-center justify-center border border-white/20"><Search className="size-5" /></button><button type="button" aria-label="Sign out" onClick={() => signOut({ callbackUrl: "/login" })} className="relative ml-2 flex size-11 items-center justify-center border border-white/20"><LogOut className="size-5" /></button></header>

    <AnimatePresence mode="wait"><motion.main key="dashboard" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: .22, ease: "easeOut" }} className="px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
      <div className="mb-9 flex items-end justify-between border-b border-white/15 pb-6">
        <div><p className="mb-2 text-xs uppercase tracking-[.2em] text-white/40">Season watchlist / {reminders.length.toString().padStart(2, "0")}</p><h1 className="title-font text-5xl leading-none sm:text-7xl">YOUR <span className="text-accent">LINEUP</span></h1></div>
        <div className="hidden text-right text-xs text-white/35 sm:block"><p>SYNCED TO NTFY</p><p className="mt-1 max-w-56 truncate">{email}</p></div>
      </div>

      {reminders.length ? <div className="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{reminders.map((reminder) => <AnimeCard key={reminder.id} reminder={reminder} onChanged={refresh} />)}</div> : <section className="flex min-h-[58vh] flex-col items-start justify-center"><h2 className="title-font text-6xl leading-[.9] sm:text-8xl">YOUR LIST<br />IS EMPTY</h2><div className="mt-4 h-1 w-40 bg-accent" /><button type="button" onClick={() => setSearchOpen(true)} className="mt-10 flex h-12 items-center gap-3 rounded-[2px] border border-white/40 px-4 text-sm text-white hover:border-accent hover:text-accent"><Search className="size-4" />FIND YOUR ANIME</button></section>}
    </motion.main></AnimatePresence>
    <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} onAdded={refresh} />
  </div>;
}
