"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    if (mode === "signup") {
      const response = await fetch("/api/signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? "Could not create account");
        setLoading(false);
        return;
      }
    }
    const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
    if (result?.error) {
      setError("Email or password is incorrect");
      setLoading(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="w-full max-w-sm border-t border-white/20 pt-7">
      <div className="space-y-5">
        <label className="block text-base text-white/65 sm:text-sm" htmlFor="email">Email
          <input className="mt-2 h-11 w-full rounded-[2px] border border-white/25 bg-transparent px-3 text-base text-white outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" id="email" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="block text-base text-white/65 sm:text-sm" htmlFor="password">Password
          <input className="mt-2 h-11 w-full rounded-[2px] border border-white/25 bg-transparent px-3 text-base text-white outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" id="password" name="password" type="password" minLength={mode === "login" ? 8 : 12} maxLength={72} autoComplete={mode === "login" ? "current-password" : "new-password"} required />
        </label>
        {mode === "signup" && <label className="block text-base text-white/65 sm:text-sm" htmlFor="ntfyTopic">ntfy topic
          <input className="mt-2 h-11 w-full rounded-[2px] border border-white/25 bg-transparent px-3 text-base text-white outline-none focus:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent" id="ntfyTopic" name="ntfyTopic" type="text" minLength={12} maxLength={64} pattern={"[a-zA-Z0-9_\\-]+"} placeholder="my-private-topic" autoComplete="off" required />
          <span className="mt-2 block text-sm leading-6 text-white/40">Use a hard-to-guess private topic, then subscribe to it in ntfy.</span>
        </label>}
      </div>
      {error && <p role="alert" className="mt-4 text-sm text-accent">{error}</p>}
      <button disabled={loading} type="submit" className="mt-7 h-11 w-full rounded-[2px] border border-accent bg-accent px-4 text-sm font-medium text-white transition-colors hover:bg-[#c92e2e] disabled:opacity-50">{loading ? "WORKING..." : mode === "login" ? "ENTER" : "CREATE ACCOUNT"}</button>
      <p className="mt-5 text-sm text-white/50">{mode === "login" ? "New here?" : "Already tracking?"} <Link className="text-white underline decoration-white/30 underline-offset-4 hover:decoration-accent" href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create an account" : "Sign in"}</Link></p>
    </form>
  );
}
