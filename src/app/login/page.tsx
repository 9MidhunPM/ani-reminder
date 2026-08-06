import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return <main className="grid min-h-dvh lg:grid-cols-[1.2fr_.8fr]">
    <section className="relative hidden border-r border-white/15 bg-[url('https://cdn.myanimelist.net/images/anime/1015/138006l.jpg')] bg-cover bg-center lg:block"><div className="card-shade absolute inset-0" /><div className="absolute bottom-12 left-12"><p className="title-font text-8xl leading-[.82]">ANI<br /><span className="text-accent">REMINDER</span></p><p className="mt-5 max-w-sm text-base text-white/65">Your season. On time.</p></div></section>
    <section className="relative flex min-h-dvh items-center px-6 py-16 sm:px-12"><Link href="/" className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm text-white/45 transition-colors hover:text-white sm:left-12"><ArrowLeft className="size-4" />Back to AniReminder</Link><div className="mx-auto w-full max-w-sm"><h1 className="title-font mb-10 text-6xl leading-none">SIGN IN</h1><AuthForm mode="login" /></div></section>
  </main>;
}
