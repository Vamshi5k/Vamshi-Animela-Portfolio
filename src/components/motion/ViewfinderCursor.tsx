"use client";

import { useEffect, useRef } from "react";
import { ui } from "@/data/ui";
import { useMediaQuery } from "@/hooks/useMediaQuery";

/** Only with a real mouse and motion allowed. Touch and reduced motion get no cursor at all. */
const ENABLED_QUERY = "(pointer: fine) and (hover: hover) and (prefers-reduced-motion: no-preference)";
/** Fraction of the remaining distance covered per frame (lerped follow). */
const FOLLOW = 0.22;
/** Form controls keep the plain native cursor: the viewfinder hides over them. */
const FIELDS = 'input, textarea, select, [contenteditable="true"], [contenteditable=""]';
/** Half the 28px viewfinder, and the gap between a framed label and the brackets. */
const RING_HALF = 14;
const FRAME_GAP = 6;

type Label = keyof typeof ui.cursor;
const isLabel = (v: string | null | undefined): v is Label => !!v && v in ui.cursor;

/**
 * Viewfinder cursor (SPEC §4.8). Trails the native cursor (which stays) as hairline corner brackets
 * with a centre crosshair. Elements opt into states with data-cursor="view|copy|drag|open|none":
 * the brackets slide outward to frame a mono label from src/data/ui.ts, or everything hides for "none".
 * Decorative only (aria-hidden); every target is a normal, keyboard-reachable element without it.
 */
export function ViewfinderCursor() {
  const enabled = useMediaQuery(ENABLED_QUERY);
  return enabled ? <Viewfinder /> : null;
}

function Viewfinder() {
  const rootRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const label = labelRef.current;
    if (!root || !label) return;

    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    let frame = 0;
    let seen = false;
    let state = "hidden";

    // The one rAF loop: runs only while the viewfinder is catching up, then stops.
    const tick = () => {
      x += (tx - x) * FOLLOW;
      y += (ty - y) * FOLLOW;
      root.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      frame = Math.abs(tx - x) > 0.1 || Math.abs(ty - y) > 0.1 ? requestAnimationFrame(tick) : 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const setState = (next: string) => {
      if (next === state) return;
      state = next;
      root.dataset.state = next;
      if (isLabel(next)) {
        // The brackets slide out to frame the label: measure it once per state change (never per frame).
        label.textContent = ui.cursor[next];
        root.style.setProperty("--vf-ox", `${Math.max(0, label.offsetWidth / 2 + FRAME_GAP - RING_HALF)}px`);
        root.style.setProperty("--vf-oy", `${Math.max(0, label.offsetHeight / 2 + FRAME_GAP - RING_HALF)}px`);
      } else {
        root.style.setProperty("--vf-ox", "0px");
        root.style.setProperty("--vf-oy", "0px");
      }
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      tx = e.clientX;
      ty = e.clientY;
      if (!seen) {
        // Hidden until the first move; then appear in place instead of sliding in from the corner.
        seen = true;
        x = tx;
        y = ty;
      }
      const target = e.target instanceof Element ? e.target : null;
      if (!target || target.closest(FIELDS)) setState("hidden");
      else {
        const value = target.closest("[data-cursor]")?.getAttribute("data-cursor");
        setState(value === "none" ? "hidden" : isLabel(value) ? value : "ring");
      }
      kick();
    };
    const onLeave = () => setState("hidden");
    const onDown = (e: PointerEvent) => {
      if (e.pointerType === "mouse") root.dataset.pressed = "true";
    };
    const onUp = () => delete root.dataset.pressed;

    const opts = { passive: true } as const;
    window.addEventListener("pointermove", onMove, opts);
    window.addEventListener("pointerdown", onDown, opts);
    window.addEventListener("pointerup", onUp, opts);
    document.documentElement.addEventListener("pointerleave", onLeave, opts);
    window.addEventListener("blur", onLeave, opts);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" data-viewfinder data-state="hidden" className="viewfinder">
      {/* Label first so the brackets (difference-blended) sit above its plate. */}
      <span ref={labelRef} className="viewfinder-label type-mono-s" />
      <span className="viewfinder-ring">
        <span data-corner="tl" className="viewfinder-corner top-0 left-0 border-t border-l" />
        <span data-corner="tr" className="viewfinder-corner top-0 right-0 border-t border-r" />
        <span data-corner="bl" className="viewfinder-corner bottom-0 left-0 border-b border-l" />
        <span data-corner="br" className="viewfinder-corner right-0 bottom-0 border-r border-b" />
        <span className="viewfinder-cross" />
      </span>
    </div>
  );
}
