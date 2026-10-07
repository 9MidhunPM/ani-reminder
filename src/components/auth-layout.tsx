import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { Brand } from "@/components/ui";

export function AuthLayout({ mode, children }: { mode: "login" | "signup"; children: ReactNode }) {
  const signup = mode === "signup";
  return <main className="auth-layout">
    <section className="auth-art" aria-label="Welcome to AniReminder"><Image src="https://cdn.myanimelist.net/images/anime/1015/138006l.jpg" alt="" fill priority sizes="55vw" className="auth-art-image" /><div className="auth-art-shade" /><div className="auth-art-brand"><Brand /></div><div className="auth-art-copy"><p className="eyebrow">For the next episode people.</p><h2 className="title-font">Great stories.<br /><span>Worth the wait.</span></h2><p>One lineup for the shows you love.<br />A little less checking. A little more watching.</p><div className="auth-art-footer">Schedules by AniList<span>Alerts through ntfy</span></div></div></section>
    <section className="auth-content"><Link href="/" className="auth-back"><ArrowLeft size={15} />Back to AniReminder</Link><div className="auth-content-inner"><div className="auth-mobile-brand"><Brand /></div><p className="eyebrow">{signup ? "Make room for your favorites" : "Welcome back"}</p><h1 className="title-font">{signup ? <>Your next episode<br />starts here.</> : <>Pick up where<br />you left off.</>}</h1><p className="auth-description">{signup ? "Create your account, connect ntfy, and give your season a place to live." : "Sign in for the latest from your lineup."}</p>{children}<p className="auth-footnote">Release dates come from published schedules.<br />No guessed episodes. No endless weekly alerts.</p></div></section>
  </main>;
}
