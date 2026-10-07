"use client";

import Image from "next/image";
import { useState } from "react";

export function AnimeCover({ src, title, className = "", sizes = "80px", priority = false }: { src: string; title: string; className?: string; sizes?: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className={`cover ${className}`} aria-hidden="true">
    {src && !failed ? <Image src={src} alt="" fill sizes={sizes} priority={priority} onError={() => setFailed(true)} />
      : <span className="cover-fallback">{title.slice(0, 2).toUpperCase()}</span>}
  </span>;
}
