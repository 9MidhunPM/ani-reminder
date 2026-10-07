import Link from "next/link";
import { AlertCircle, CheckCircle2, Info, X, CalendarDays } from "lucide-react";
import type { ReactNode } from "react";

export function Brand({ href = "/" }: { href?: string }) {
  return <Link href={href} className="brand" aria-label="AniReminder home"><span className="brand-mark" aria-hidden="true">A/</span><span className="brand-name">ANI<span className="accent">/</span>REMINDER</span></Link>;
}

export function Notice({ children, kind = "info", onDismiss }: { children: ReactNode; kind?: "info" | "error" | "success"; onDismiss?: () => void }) {
  const Icon = kind === "error" ? AlertCircle : kind === "success" ? CheckCircle2 : Info;
  return <div className={`notice notice-${kind}`} role={kind === "error" ? "alert" : "status"}>
    <Icon size={17} /><div>{children}</div>
    {onDismiss && <button type="button" aria-label="Dismiss message" className="notice-close" onClick={onDismiss}><X size={18} /></button>}
  </div>;
}

export function EmptyState({ title, children, action }: { title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><CalendarDays size={32} strokeWidth={1.4} /><h2>{title}</h2><p>{children}</p>{action}</div>;
}

export function PageHeading({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="page-heading"><div><h1 className="title-font">{title}</h1><p>{description}</p></div>{action}</div>;
}
