"use client";

import { useEffect, useState } from "react";

function getCountdown(target: string) {
  const distance = new Date(target).getTime() - Date.now();
  if (distance <= 0) return "AIRING NOW";
  const days = Math.floor(distance / 86_400_000);
  const hours = Math.floor((distance % 86_400_000) / 3_600_000);
  const minutes = Math.floor((distance % 3_600_000) / 60_000);
  return days > 0 ? `${days}D ${hours}H` : `${hours}H ${minutes}M`;
}

export function Countdown({ target }: { target: string }) {
  const [text, setText] = useState(() => getCountdown(target));
  useEffect(() => {
    const interval = window.setInterval(() => setText(getCountdown(target)), 30_000);
    return () => window.clearInterval(interval);
  }, [target]);
  return <span className="text-accent">{text}</span>;
}
