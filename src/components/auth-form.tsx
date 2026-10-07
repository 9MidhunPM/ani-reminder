"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, EyeOff, Shuffle } from "lucide-react";
import { Notice } from "@/components/ui";
import { apiRequest, errorMessage } from "@/lib/client-api";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [topic, setTopic] = useState("");
  const [created, setCreated] = useState(false);
  const signup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError("");
    const data = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (signup && !created) { await apiRequest("/api/signup", { method: "POST", body: JSON.stringify(data) }); setCreated(true); }
      const result = await signIn("credentials", { email: data.email, password: data.password, redirect: false });
      if (!result || result.error) { setError(signup ? "Your account is ready. Sign in with the email and password you just chose." : "That email and password did not match. Check both and try again."); return; }
      router.push("/dashboard"); router.refresh();
    } catch (error) { setError(errorMessage(error)); }
    finally { setLoading(false); }
  }

  function generateTopic() {
    const bytes = window.crypto.getRandomValues(new Uint8Array(16));
    setTopic(`ani_${Array.from(bytes, (value) => value.toString(16).padStart(2, "0")).join("")}`);
  }

  return <form onSubmit={submit} className="auth-form">
    <div className="auth-field"><label className="field-label" htmlFor="email">Email address</label><input className="field" id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" maxLength={254} required /></div>
    <div className="auth-field"><label className="field-label" htmlFor="password">Password</label><div className="password-field"><input className="field" id="password" name="password" type={showPassword ? "text" : "password"} minLength={signup ? 12 : 8} maxLength={72} autoComplete={signup ? "new-password" : "current-password"} aria-describedby={signup ? "password-hint" : undefined} required /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{signup && <p id="password-hint" className="field-hint">Use 12–72 characters. A few memorable words work well.</p>}</div>
    {signup && <div className="auth-field"><div className="auth-topic-label"><label className="field-label" htmlFor="ntfyTopic">Your ntfy topic</label><button type="button" onClick={generateTopic} className="generate-topic"><Shuffle size={13} />Generate one</button></div><input className="field" id="ntfyTopic" name="ntfyTopic" type="text" value={topic} onChange={(event) => setTopic(event.target.value)} minLength={12} maxLength={64} pattern={"[a-zA-Z0-9_\\-]+"} placeholder="a-unique-topic-only-you-know" autoComplete="off" required aria-describedby="ntfy-hint" /><p id="ntfy-hint" className="field-hint">Use 12–64 letters, numbers, underscores, or hyphens. Subscribe to this exact topic in the <a href="https://ntfy.sh/docs/subscribe/phone/" target="_blank" rel="noreferrer">ntfy app</a>, then send a test from Settings.</p></div>}
    {error && <Notice kind="error">{error}{signup && created && <> <Link href="/login">Go to sign in</Link></>}</Notice>}
    <button disabled={loading} type="submit" className="button button-primary auth-submit">{loading ? signup ? "Setting up your lineup…" : "Signing you in…" : signup ? "Create your account" : "Back to your lineup"}{!loading && <ArrowRight size={17} />}</button>
    <p className="auth-switch">{signup ? "Already have a lineup?" : "New to AniReminder?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"}</Link></p>
  </form>;
}
