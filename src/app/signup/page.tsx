import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return <main className="grid min-h-dvh lg:grid-cols-[.8fr_1.2fr]">
    <section className="relative flex min-h-dvh items-center px-6 py-16 sm:px-12"><Link href="/" className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white sm:left-12"><ArrowLeft className="size-4" />Back to AniReminder</Link><div className="mx-auto w-full max-w-sm"><h1 className="title-font mb-10 text-6xl leading-none">START YOUR<br />LINEUP</h1><AuthForm mode="signup" /></div></section>
    <section className="relative hidden border-l border-white/15 bg-[url('https://cdn.myanimelist.net/images/anime/1171/109222l.jpg')] bg-cover bg-center lg:block"><div className="card-shade absolute inset-0" /><p className="title-font absolute bottom-12 right-12 max-w-lg text-right text-7xl leading-[.9]">RELEASES MOVE FAST.<br /><span className="text-accent">DON&apos;T MISS.</span></p></section>
  </main>;
}
