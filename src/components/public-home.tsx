"use client";

import Link from "next/link";
import { ArrowDownRight, ArrowRight, BellRing, CalendarClock, Check, Plus, Radio, Search, ShieldCheck } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

const schedule = [
  { day: "MON", title: "ONE PIECE", episode: "EP 1173", time: "19:46 IST", color: "bg-accent" },
  { day: "WED", title: "SOLO LEVELING", episode: "EP 13", time: "21:30 IST", color: "bg-[#e9e0d2] text-[#0d0d0d]" },
  { day: "FRI", title: "WITCH HAT ATELIER", episode: "EP 08", time: "20:00 IST", color: "bg-[#7193a4]" },
];

const motionEase = [0.22, 1, 0.36, 1] as const;

export function PublicHome({ isAuthenticated }: { isAuthenticated: boolean }) {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? undefined : { opacity: 0, y: 24 };
  const revealIn = reduceMotion ? undefined : { opacity: 1, y: 0 };

  return <main id="main-content" className="overflow-hidden bg-background text-foreground">
    <a href="#how-it-works" className="sr-only z-50 bg-white px-4 py-3 text-black focus:not-sr-only focus:fixed focus:left-4 focus:top-4">Skip to how it works</a>
    <section className="relative min-h-[92dvh] border-b border-white/15">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(230,53,53,.18),transparent_26%),linear-gradient(115deg,#0d0d0d_0%,#11100f_48%,#321515_100%)]" aria-hidden="true" />
      <div className="absolute inset-y-0 right-0 w-full bg-[url('https://cdn.myanimelist.net/images/anime/1015/138006l.jpg')] bg-cover bg-[position:62%_18%] opacity-25 mix-blend-screen lg:w-[49%] lg:bg-[center_18%] lg:opacity-50" aria-hidden="true" />
      <div className="absolute inset-0 bg-[linear-gradient(0deg,#0d0d0d_0%,rgba(13,13,13,.78)_60%,rgba(13,13,13,.25)_100%)] lg:bg-[linear-gradient(90deg,#0d0d0d_0%,rgba(13,13,13,.96)_35%,rgba(13,13,13,.1)_100%)]" aria-hidden="true" />

      <header className="relative z-10 flex items-center justify-between border-b border-white/15 px-5 py-5 sm:px-8 lg:px-12">
        <Link href="/" aria-label="AniReminder homepage" className="title-font text-3xl leading-none text-white">ANI<span className="text-accent">/</span>REMINDER</Link>
        <nav className="flex items-center gap-2 sm:gap-5" aria-label="Main navigation">
          <a href="#how-it-works" className="hidden px-3 py-3 text-sm text-white/65 transition-colors hover:text-white sm:inline-flex">HOW IT WORKS</a>
          {!isAuthenticated && <Link href="/login" className="px-3 py-3 text-sm text-white/65 transition-colors hover:text-white">SIGN IN</Link>}
          <Link href={isAuthenticated ? "/dashboard" : "/signup"} className="inline-flex min-h-11 items-center justify-center border border-white/30 px-4 py-3 text-sm text-white transition-colors hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{isAuthenticated ? "OPEN DASHBOARD" : "START TRACKING"}</Link>
        </nav>
      </header>

      <div className="relative z-10 mx-auto flex min-h-[calc(92dvh-81px)] max-w-[1440px] items-end px-5 pb-12 pt-20 sm:px-8 sm:pb-16 lg:px-12 lg:pb-20">
        <motion.div initial={reveal} animate={revealIn} transition={{ duration: .7, ease: motionEase }} className="max-w-3xl">
          <h1 className="title-font max-w-[10ch] text-[clamp(4rem,11vw,9rem)] leading-[.8] tracking-tight text-balance text-white">NEVER MISS THE NEXT EPISODE.</h1>
          <p className="mt-8 max-w-[43ch] text-lg leading-7 text-pretty text-white/70 sm:text-xl">AniReminder watches the release calendar for you and sends a precise ntfy alert when your shows are about to air.</p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#how-it-works" className="group inline-flex min-h-13 items-center gap-3 bg-[#f5f3ef] px-5 py-3 text-base font-medium text-[#0d0d0d] transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">SEE HOW IT WORKS <ArrowDownRight className="size-5 transition-transform duration-150 group-hover:translate-y-0.5 group-hover:translate-x-0.5" /></a>
            <Link href={isAuthenticated ? "/dashboard" : "/signup"} className="inline-flex min-h-13 items-center gap-2 border border-white/30 px-5 py-3 text-base text-white transition-colors hover:border-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{isAuthenticated ? "OPEN YOUR LINEUP" : "CREATE YOUR LINEUP"} <ArrowRight className="size-4" /></Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-7 gap-y-3 border-t border-white/20 pt-5 font-mono text-xs uppercase tracking-wide text-white/45">
            <span className="inline-flex items-center gap-2"><Radio className="size-4 text-accent" /> ANILIST SCHEDULES</span>
            <span className="inline-flex items-center gap-2"><BellRing className="size-4 text-accent" /> NTFY DELIVERY</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="size-4 text-accent" /> PRIVATE BY DEFAULT</span>
          </div>
        </motion.div>

        <motion.div initial={reduceMotion ? undefined : { opacity: 0, x: 26 }} animate={reduceMotion ? undefined : { opacity: 1, x: 0 }} transition={{ delay: .25, duration: .8, ease: motionEase }} className="absolute bottom-10 right-6 hidden w-[31%] max-w-[430px] border-l border-t border-white/20 bg-[#0d0d0d]/75 p-5 backdrop-blur-sm xl:block">
          <div className="flex items-center justify-between border-b border-white/15 pb-4"><p className="font-mono text-xs uppercase tracking-[.18em] text-accent">Next transmissions</p><span className="font-mono text-xs text-white/35">LIVE CALENDAR</span></div>
          <div className="pt-2">{schedule.map((item) => <div key={item.title} className="flex items-center gap-4 border-b border-white/10 py-4 last:border-0"><span className="w-8 font-mono text-xs text-white/40">{item.day}</span><span className={`size-2 shrink-0 ${item.color}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm text-white">{item.title}</p><p className="mt-1 font-mono text-xs text-white/40">{item.episode}</p></div><p className="font-mono text-xs text-white/55">{item.time}</p></div>)}</div>
        </motion.div>
      </div>
      <a href="#how-it-works" aria-label="Scroll to learn how AniReminder works" className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 text-white/35 transition-colors hover:text-white sm:block"><ArrowDownRight className="size-6 rotate-45" /></a>
    </section>

    <section id="how-it-works" className="border-b border-white/15 bg-[#f0ece6] text-[#171615]">
      <div className="mx-auto grid max-w-[1440px] gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[.7fr_1.3fr] lg:gap-20 lg:px-12">
        <div><h2 className="title-font max-w-[10ch] text-6xl leading-[.86] tracking-tight sm:text-8xl">FROM AIRING TIME TO PHONE SCREEN.</h2><p className="mt-7 max-w-[38ch] text-lg leading-7 text-[#5d5851]">Three decisions, then the calendar does the remembering. Your lineup stays quiet until it matters.</p></div>
        <div className="relative">
          <div className="absolute bottom-8 left-[17px] top-8 w-px bg-[#171615]/15" aria-hidden="true" />
          <ol className="relative space-y-12">
            <motion.li initial={reduceMotion ? undefined : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ duration: .45, ease: motionEase }} className="flex gap-6"><span className="z-10 flex size-9 shrink-0 items-center justify-center bg-[#b32b2b] font-mono text-sm text-white">01</span><div><h3 className="title-font text-4xl leading-none">FIND THE SHOW</h3><p className="mt-3 max-w-[46ch] text-base leading-7 text-[#5d5851]">Search the AniList catalog and pick the title you are actually waiting for. Exact airing data comes with it.</p><div className="mt-5 flex max-w-md items-center gap-3 border-b-2 border-[#171615] py-3"><Search className="size-5 text-[#b32b2b]" /><span className="font-mono text-sm text-[#171615]/55">find one piece</span><Check className="ml-auto size-5 text-[#b32b2b]" /></div></div></motion.li>
            <motion.li initial={reduceMotion ? undefined : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ delay: .08, duration: .45, ease: motionEase }} className="flex gap-6"><span className="z-10 flex size-9 shrink-0 items-center justify-center bg-[#171615] font-mono text-sm text-white">02</span><div><h3 className="title-font text-4xl leading-none">BUILD YOUR LINEUP</h3><p className="mt-3 max-w-[46ch] text-base leading-7 text-[#5d5851]">Add only what you want to follow. Pause a show for a break, resume when you are ready, or clear it completely.</p><div className="mt-5 flex max-w-md items-center gap-3 border border-[#171615]/20 bg-[#e6e0d8] p-3"><div className="flex size-10 items-center justify-center bg-[#b32b2b] text-white"><Plus className="size-5" /></div><div><p className="text-sm font-medium">ONE PIECE</p><p className="mt-1 font-mono text-xs text-[#5d5851]">EPISODE 1173 / TRACKING</p></div><CalendarClock className="ml-auto size-5 text-[#b32b2b]" /></div></div></motion.li>
            <motion.li initial={reduceMotion ? undefined : { opacity: 0, y: 18 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, amount: .35 }} transition={{ delay: .16, duration: .45, ease: motionEase }} className="flex gap-6"><span className="z-10 flex size-9 shrink-0 items-center justify-center bg-[#171615] font-mono text-sm text-white">03</span><div><h3 className="title-font text-4xl leading-none">GET THE SIGNAL</h3><p className="mt-3 max-w-[46ch] text-base leading-7 text-[#5d5851]">Your private ntfy topic gets a test message immediately, then the useful alerts: airing day and episode-out time.</p><div className="mt-5 max-w-md border-l-2 border-[#b32b2b] bg-[#e6e0d8] p-4"><p className="font-mono text-xs uppercase tracking-wide text-[#b32b2b]">AniReminder / test delivered</p><p className="mt-3 text-base leading-6">ONE PIECE added. You will be reminded when episode 1173 airs.</p></div></div></motion.li>
          </ol>
        </div>
      </div>
    </section>

    <section className="border-b border-white/15 bg-background">
      <div className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 sm:py-28 lg:px-12">
        <div className="flex flex-col justify-between gap-8 border-b border-white/15 pb-10 sm:flex-row sm:items-end"><h2 className="title-font max-w-[12ch] text-6xl leading-[.86] tracking-tight text-white sm:text-8xl">LESS CHECKING. MORE WATCHING.</h2><p className="max-w-[35ch] text-base leading-7 text-white/55 sm:text-right">A release tracker that respects the difference between “available somewhere” and “airing next.”</p></div>
        <dl className="grid divide-y divide-white/15 pt-2 lg:grid-cols-4 lg:divide-x lg:divide-y-0">
          <div className="py-8 sm:px-7 sm:first:pl-0"><dt className="title-font text-4xl text-white">EXACT</dt><dd className="mt-3 max-w-[27ch] text-base leading-6 text-white/50">Airing times are normalized to your schedule, not buried in a generic status.</dd></div>
          <div className="py-8 sm:px-7"><dt className="title-font text-4xl text-white">PRIVATE</dt><dd className="mt-3 max-w-[27ch] text-base leading-6 text-white/50">Your ntfy topic is kept server-side and encrypted at rest.</dd></div>
          <div className="py-8 sm:px-7"><dt className="title-font text-4xl text-white">CLEAR</dt><dd className="mt-3 max-w-[27ch] text-base leading-6 text-white/50">A vertical lineup makes the next episode, state, and countdown obvious.</dd></div>
          <div className="py-8 sm:px-7 sm:last:pr-0"><dt className="title-font text-4xl text-white">HONEST</dt><dd className="mt-3 max-w-[27ch] text-base leading-6 text-white/50">The first notification is a real delivery test, not a promise hidden in settings.</dd></div>
        </dl>
      </div>
    </section>

    <section className="relative overflow-hidden bg-accent text-white">
      <div className="absolute -right-20 -top-28 font-mono text-[17rem] leading-none text-white/10" aria-hidden="true">AR</div>
      <div className="relative mx-auto flex max-w-[1440px] flex-col gap-10 px-5 py-20 sm:px-8 sm:py-28 lg:flex-row lg:items-end lg:justify-between lg:px-12"><h2 className="title-font max-w-[10ch] text-7xl leading-[.82] tracking-tight sm:text-9xl">SET THE SIGNAL.</h2><div className="max-w-sm"><p className="text-lg leading-7 text-white/80">Build a lineup, verify the message, and let episode day arrive without the frantic check.</p><Link href={isAuthenticated ? "/dashboard" : "/signup"} className="group mt-8 inline-flex min-h-13 items-center gap-3 bg-[#171615] px-5 py-3 text-base text-white transition-transform duration-150 hover:scale-[1.02] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">{isAuthenticated ? "OPEN YOUR LINEUP" : "CREATE YOUR LINEUP"} <ArrowRight className="size-5 transition-transform duration-150 group-hover:translate-x-1" /></Link></div></div>
    </section>

    <footer className="border-t border-white/15 bg-background"><div className="mx-auto flex max-w-[1440px] flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><Link href="/" aria-label="AniReminder homepage" className="title-font text-2xl text-white">ANI<span className="text-accent">/</span>REMINDER</Link><div className="flex gap-5 text-sm text-white/45">{isAuthenticated ? <Link href="/dashboard" className="transition-colors hover:text-white">Dashboard</Link> : <><Link href="/login" className="transition-colors hover:text-white">Sign in</Link><Link href="/signup" className="transition-colors hover:text-white">Create account</Link></>}<a href="#how-it-works" className="transition-colors hover:text-white">How it works</a></div><p className="font-mono text-xs text-white/30">RELEASES MOVE FAST.</p></div></footer>
  </main>;
}
