"use client";

import { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore, type ReactNode, type KeyboardEvent } from "react";
import { BellRing, Check, Pause, Play, Radio, Moon } from "lucide-react";

type MotionMode = "running" | "paused" | "reduced";
const preferenceKey = "ani-home-motion";
let volatilePreference: MotionMode | null = null;
const MotionContext = createContext<MotionMode>("running");
function subscribePreference(callback: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  window.addEventListener("ani-motion-change", callback);
  return () => {
    query.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
    window.removeEventListener("ani-motion-change", callback);
  };
}
function motionSnapshot(): MotionMode {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced";
  if (volatilePreference) return volatilePreference;
  try { return localStorage.getItem(preferenceKey) === "paused" ? "paused" : "running"; }
  catch { return "running"; }
}

/** Static server content stays visible; this island adds motion after hydration. */
export function HomeExperience({ children }: { children: ReactNode }) {
  const mode = useSyncExternalStore(subscribePreference, motionSnapshot, () => "running" as const);
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const regions = new IntersectionObserver(entries => entries.forEach(entry => {
      (entry.target as HTMLElement).dataset.visible = String(entry.isIntersecting);
    }), { rootMargin: "60px" });
    element.querySelectorAll("[data-motion-region]").forEach(region => regions.observe(region));
    const reveals = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      (entry.target as HTMLElement).dataset.entered = "true";
      reveals.unobserve(entry.target);
    }), { threshold: 0.12 });
    element.querySelectorAll("[data-reveal]").forEach(section => reveals.observe(section));
    const visibility = () => { element.dataset.hidden = String(document.hidden); };
    visibility();
    document.addEventListener("visibilitychange", visibility);
    return () => { regions.disconnect(); reveals.disconnect(); document.removeEventListener("visibilitychange", visibility); };
  }, []);
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    let scrollFrame = 0;
    let pointerFrame = 0;
    const resetPointer = () => {
      element.style.setProperty("--tilt-x", "0deg");
      element.style.setProperty("--tilt-y", "0deg");
    };
    if (mode !== "running") { resetPointer(); element.style.setProperty("--scene-scroll", "0px"); return; }
    const scroll = () => {
      if (scrollFrame || document.hidden) return;
      scrollFrame = requestAnimationFrame(() => {
        const distance = document.documentElement.scrollHeight - innerHeight;
        element.style.setProperty("--page-progress", String(distance > 0 ? scrollY / distance : 0));
        element.style.setProperty("--scene-scroll", `${-Math.min(scrollY, 700) * 0.08}px`);
        scrollFrame = 0;
      });
    };
    const scene = element.querySelector<HTMLElement>(".cinema-hero");
    const pointer = (event: PointerEvent) => {
      if (pointerFrame || document.hidden || event.pointerType !== "mouse") return;
      const bounds = scene!.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / bounds.width - 0.5;
      const y = (event.clientY - bounds.top) / bounds.height - 0.5;
      pointerFrame = requestAnimationFrame(() => {
        element.style.setProperty("--tilt-x", `${-y * 6}deg`);
        element.style.setProperty("--tilt-y", `${x * 8}deg`);
        pointerFrame = 0;
      });
    };
    scroll();
    window.addEventListener("scroll", scroll, { passive: true });
    window.addEventListener("resize", scroll, { passive: true });
    scene?.addEventListener("pointermove", pointer, { passive: true });
    scene?.addEventListener("pointerleave", resetPointer);
    return () => {
      window.removeEventListener("scroll", scroll); window.removeEventListener("resize", scroll);
      scene?.removeEventListener("pointermove", pointer); scene?.removeEventListener("pointerleave", resetPointer);
      cancelAnimationFrame(scrollFrame); cancelAnimationFrame(pointerFrame);
    };
  }, [mode]);
  return <MotionContext.Provider value={mode}><main ref={root} className="public-home cinema-home" id="main-content" data-motion={mode}>{children}</main></MotionContext.Provider>;
}

export function MotionToggle() {
  const mode = useContext(MotionContext);
  function toggle() {
    const next = mode === "running" ? "paused" : "running";
    try { localStorage.setItem(preferenceKey, next); volatilePreference = null; }
    catch { volatilePreference = next; }
    window.dispatchEvent(new Event("ani-motion-change"));
  }
  return <button type="button" className="motion-toggle" onClick={toggle} disabled={mode === "reduced"} aria-label={mode === "reduced" ? "Animations reduced by system preference" : mode === "running" ? "Pause animations" : "Resume animations"} aria-pressed={mode !== "running"}>{mode === "running" ? <Pause size={13} /> : <Play size={13} />}<span>{mode === "reduced" ? "Reduced motion" : mode === "running" ? "Pause motion" : "Play motion"}</span></button>;
}

const previewStates = ["Scheduled", "Waiting", "Completed"] as const;
type PreviewState = typeof previewStates[number];
export function LineupPreview() {
  const [selected, setSelected] = useState<PreviewState>("Scheduled");
  const tabs = useRef<Array<HTMLButtonElement | null>>([]);
  function move(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % 3;
    else if (event.key === "ArrowLeft") next = (index + 2) % 3;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = 2;
    else return;
    event.preventDefault(); setSelected(previewStates[next]); tabs.current[next]?.focus();
  }
  return <div className="lineup-preview" data-preview={selected.toLowerCase()}>
    <div className="preview-top"><span><Radio size={14} />Your lineup, in motion.</span><span>Illustrative example</span></div>
    <div className="preview-tabs" role="tablist" aria-label="Example schedule states">{previewStates.map((state, index) => <button type="button" key={state} ref={element => { tabs.current[index] = element; }} id={`preview-tab-${state.toLowerCase()}`} role="tab" aria-selected={selected === state} aria-controls="preview-panel" tabIndex={selected === state ? 0 : -1} onKeyDown={event => move(event, index)} onClick={() => setSelected(state)}>{state}</button>)}</div>
    <div id="preview-panel" className="preview-panel" role="tabpanel" aria-labelledby={`preview-tab-${selected.toLowerCase()}`} tabIndex={0}>
      <div className="preview-state-content" key={selected}>
        <div className="preview-status-icon">{selected === "Scheduled" ? <BellRing size={30} /> : selected === "Waiting" ? <Moon size={30} /> : <Check size={30} />}</div>
        <div><p className="preview-state-label">Your Sunday show</p><h3>{selected === "Scheduled" ? "Episode 12. On your radar." : selected === "Waiting" ? "No date. No guesswork." : "Story complete. Alerts stopped."}</h3><p>{selected === "Scheduled" ? "Sunday · 6:30 pm IST · Published airing" : selected === "Waiting" ? "Your show stays in the lineup. Alerts wait for a published schedule." : "Your favorite gets a place in Completed. No imaginary next episode."}</p></div>
      </div>
      <div className="preview-week" aria-hidden="true">{["M", "T", "W", "T", "F", "S", "S"].map((day, index) => <span key={index} className={selected === "Scheduled" && index === 6 ? "preview-day-active" : ""}>{day}<i>{selected === "Scheduled" && index === 6 ? <BellRing size={16} /> : "—"}</i></span>)}</div>
      <div className="preview-receipt"><span>{selected === "Scheduled" ? "Your next episode has a real date." : selected === "Waiting" ? "A break in the schedule stays quiet." : "The season ends. So do its alerts."}</span>{selected === "Scheduled" ? <BellRing size={16} /> : <Check size={16} />}</div>
    </div>
    <p className="preview-note">Try a state above. This preview never sends a notification.</p>
  </div>;
}
