"use client";

import Image from "next/image";
import { useState } from "react";

export function AnimeCover({ src, title, className = "", sizes = "80px", priority = false }: { src: string; title: string; className?: string; sizes?: string; priority?: boolean }) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return <span className={`cover ${className}`} aria-hidden="true">
    {src && src !== failedSource ? <Image src={src} alt="" fill sizes={sizes} priority={priority} onError={() => setFailedSource(src)} />
      : <span className="cover-fallback">{title.slice(0, 2).toUpperCase()}</span>}
  </span>;
}
