import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return <main className="grid min-h-screen lg:grid-cols-[1.2fr_.8fr]">
    <section className="relative hidden border-r border-white/15 bg-[url('https://cdn.myanimelist.net/images/anime/1015/138006l.jpg')] bg-cover bg-center lg:block"><div className="card-shade absolute inset-0" /><div className="absolute bottom-12 left-12"><p className="title-font text-8xl leading-[.82]">ANI<br /><span className="text-accent">REMINDER</span></p><p className="mt-5 max-w-sm text-base text-white/65">Your season. On time.</p></div></section>
    <section className="flex min-h-screen items-center px-6 py-16 sm:px-12"><div className="mx-auto w-full max-w-xs"><p className="mb-3 text-xs uppercase tracking-[.22em] text-accent">Welcome back</p><h1 className="title-font mb-10 text-6xl leading-none">SIGN IN</h1><AuthForm mode="login" /></div></section>
  </main>;
}
