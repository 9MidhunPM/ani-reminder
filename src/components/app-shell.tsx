"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { CalendarDays, Library, Archive, Bell, Settings, Search, LogOut, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui";

export type DashboardView = "week" | "lineup" | "completed" | "activity" | "settings";
const navigation = [
  { view: "week", label: "This week", Icon: CalendarDays },
  { view: "lineup", label: "My lineup", Icon: Library },
  { view: "completed", label: "Completed", Icon: Archive },
  { view: "activity", label: "Activity", Icon: Bell },
  { view: "settings", label: "Settings", Icon: Settings },
] as const;

export function AppShell({ children, view, email, count, onSearch }: { children: ReactNode; view: DashboardView; email: string; count: number; onSearch: () => void }) {
  return <div className="app-shell">
    <a href="#main-content" className="skip-link">Skip to content</a>
    <aside className="app-sidebar"><Brand href="/dashboard" /><p className="sidebar-label">Your watching space</p>
      <nav aria-label="Main navigation" className="sidebar-nav">{navigation.map(({ view: item, label, Icon }) => <Link key={item} href={`/dashboard?view=${item}`} aria-current={view === item ? "page" : undefined} className={view === item ? "nav-active" : ""}><Icon size={18} strokeWidth={1.6} /><span>{label}</span>{item === "lineup" && <span className="nav-count">{count}</span>}</Link>)}</nav>
      <button type="button" className="sidebar-search" onClick={onSearch}><Search size={17} />Discover anime<ArrowUpRight size={15} /></button>
      <div className="sidebar-note"><span className="status-badge status-scheduled">Made for the wait</span><p>The next episode is worth looking forward to.</p></div>
      <div className="sidebar-account"><div className="account-avatar" aria-hidden="true">{email.charAt(0).toUpperCase()}</div><div className="account-summary"><span>Your account</span><p title={email}>{email}</p></div><button type="button" className="signout-button" aria-label="Sign out" onClick={() => signOut({ callbackUrl: "/login" })}><LogOut size={17} /></button></div>
    </aside>
    <header className="mobile-header"><Brand href="/dashboard" /><button type="button" className="icon-button" onClick={onSearch} aria-label="Find anime"><Search size={19} /></button></header>
    <div className="app-content"><header className="app-topbar"><span>YOUR RELEASE CALENDAR</span><span className="topbar-timezone">Asia / Kolkata <span>IST · UTC+5:30</span></span></header><main id="main-content" className="app-main" tabIndex={-1}>{children}</main><footer className="app-footer"><span>AniList schedules. Your own pace.</span><Link href="/">About AniReminder <ArrowUpRight size={12} /></Link></footer></div>
    <nav aria-label="Mobile navigation" className="mobile-nav">{navigation.map(({ view: item, label, Icon }) => <Link key={item} href={`/dashboard?view=${item}`} aria-current={view === item ? "page" : undefined} className={view === item ? "nav-active" : ""}><Icon size={19} strokeWidth={1.7} /><span>{label}</span></Link>)}</nav>
  </div>;
}
