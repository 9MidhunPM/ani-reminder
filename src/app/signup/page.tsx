import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return <main className="grid min-h-screen lg:grid-cols-[.8fr_1.2fr]">
    <section className="flex min-h-screen items-center px-6 py-16 sm:px-12"><div className="mx-auto w-full max-w-xs"><p className="mb-3 text-xs uppercase tracking-[.22em] text-accent">Start your list</p><h1 className="title-font mb-10 text-6xl leading-none">JOIN THE<br />NIGHT SHIFT</h1><AuthForm mode="signup" /></div></section>
    <section className="relative hidden border-l border-white/15 bg-[url('https://cdn.myanimelist.net/images/anime/1171/109222l.jpg')] bg-cover bg-center lg:block"><div className="card-shade absolute inset-0" /><p className="title-font absolute bottom-12 right-12 max-w-lg text-right text-7xl leading-[.9]">RELEASES MOVE FAST.<br /><span className="text-accent">DON'T MISS.</span></p></section>
  </main>;
}
