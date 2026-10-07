"use client";

import { useEffect, useState } from "react";

export function countdownText(target: string | null, now: number) {
  if (!target) return "Awaiting schedule";
  const distance = new Date(target).getTime() - now;
  if (!Number.isFinite(distance)) return "Awaiting schedule";
  if (distance <= 0) return "Awaiting schedule update";
  const days = Math.floor(distance / 86_400_000);
  const hours = Math.floor((distance % 86_400_000) / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  if (distance < 60_000) return "Less than a minute";
  return days > 0 ? `${days}d ${hours}h` : hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export function Countdown({ target }: { target: string | null }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 30_000);
    return () => { window.clearTimeout(first); window.clearInterval(interval); };
  }, []);
  return <span className="countdown">{now === null ? "Upcoming" : countdownText(target, now)}</span>;
}
