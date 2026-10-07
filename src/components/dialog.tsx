"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export function Dialog({ open, title, onClose, children, small = false }: { open: boolean; title: string; onClose: () => void; children: ReactNode; small?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const initial = dialog.querySelector<HTMLElement>("[data-initial-focus]");
    initial?.focus();
    return () => {
      dialog.close();
      document.body.style.overflow = originalOverflow;
      trigger?.focus();
    };
  }, [open]);
  if (!open) return null;
  return <dialog ref={ref} aria-labelledby={titleId} className={`dialog dialog-native ${small ? "dialog-small" : ""}`}
    onCancel={(event) => { event.preventDefault(); closeRef.current(); }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const rect = event.currentTarget.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeRef.current();
    }}>
    <div className="dialog-header"><h2 id={titleId} className="dialog-title">{title}</h2><button type="button" className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={20} /></button></div>
    {children}
  </dialog>;
}

export function ConfirmDialog({ open, title, children, busy, onClose, onConfirm, confirmLabel }: { open: boolean; title: string; children: ReactNode; busy: boolean; onClose: () => void; onConfirm: () => void; confirmLabel: string }) {
  return <Dialog open={open} title={title} onClose={() => { if (!busy) onClose(); }} small>
    <div className="dialog-copy">{children}</div>
    <div className="dialog-actions"><button type="button" data-initial-focus className="button button-secondary" disabled={busy} onClick={onClose}>Keep it</button><button type="button" className="button button-danger" disabled={busy} onClick={onConfirm}>{busy ? "Working…" : confirmLabel}</button></div>
  </Dialog>;
}
