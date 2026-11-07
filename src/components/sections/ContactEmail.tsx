"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";
import { ui } from "@/data/ui";
import { motion } from "@/lib/motion-tokens";

/** Archivo axes at rest and at the crest of the wave. */
const REST = { wdth: 75, wght: 500 };
const CREST = { wdth: 125, wght: 800 };
/** Falloff radius of the wave, px. */
const RADIUS = 160;
/** Lerp time constant, s: how quickly letters chase their target. */
const TAU = 0.09;
/** Share of the box the reserved wave may fill; the rest is a safety margin for axis interpolation. */
const FILL = 0.98;
/** Number of axis steps between rest and crest (see apply()). */
const STEPS = 8;
const WAVE_QUERY = "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

type Status = "idle" | "copied" | "failed";

/** Smooth falloff: 1 at the pointer, 0 at RADIUS and beyond. */
const falloff = (d: number) => (d >= RADIUS ? 0 : (Math.cos((Math.PI * d) / RADIUS) + 1) / 2);

/**
 * The Contact email line (SPEC §1a), proximity type. Each letter is an aria-hidden inline-block; the
 * wrapper is a button-like element named by the plain address, and the letters stay real text for
 * selection and copying. With a mouse, every letter's width and weight follow the pointer's distance
 * (cosine falloff over RADIUS), lerped in one rAF loop that stops when settled.
 *
 * Never overflow, never shift: the font size is solved so the rest line plus the widest static wave fits
 * FILL of the box, and every frame the total extra width is clamped to the reserved budget, so a fast
 * sweep that leaves a trail still fits. Widths come from two hidden measuring copies (rest and crest).
 * Touch and reduced motion: no wave; the line is static at rest and sized to fill the width.
 */
export function ContactEmail({ email }: { email: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const restRef = useRef<HTMLSpanElement>(null);
  const crestRef = useRef<HTMLSpanElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const statusTimer = useRef<number | undefined>(undefined);
  const descId = useId();
  const letters = [...email];

  // Sizing + wave. One effect owns the loop, the listeners and the observer; all cleaned up on unmount.
  useEffect(() => {
    const box = boxRef.current;
    const line = lineRef.current;
    const rest = restRef.current;
    const crest = crestRef.current;
    if (!box || !line || !rest || !crest) return;
    const spans = [...line.querySelectorAll<HTMLElement>("[data-letter]")];
    const restSpans = [...rest.querySelectorAll<HTMLElement>("span")];
    const crestSpans = [...crest.querySelectorAll<HTMLElement>("span")];
    const waveMq = window.matchMedia(WAVE_QUERY);

    let wave = waveMq.matches;
    let centres: number[] = []; // rest letter centres, px from the line's left edge
    let deltas: number[] = []; // crest − rest width per letter, px
    let budget = 0; // px of extra width the line may gain
    let originX = 0; // line left edge in page coordinates
    let originY = 0; // line vertical centre in page coordinates
    const t = spans.map(() => 0); // current wave amount per letter
    const target = spans.map(() => 0);
    let frame = 0;
    let last = 0;

    const step = spans.map(() => 0); // last written step per letter
    // Quantised output: each letter shows one of STEPS + 1 axis instances, written only when its step
    // changes. Continuous values would create a new font instance (re-shape + re-rasterise) every frame.
    const apply = (i: number) => {
      const q = Math.floor(t[i] * STEPS + 1e-6); // floor: shown width never exceeds the clamped budget
      if (q === step[i]) return;
      step[i] = q;
      const s = spans[i].style;
      if (q === 0) {
        s.fontStretch = "";
        s.fontWeight = "";
        return;
      }
      s.fontStretch = `${REST.wdth + ((CREST.wdth - REST.wdth) * q) / STEPS}%`;
      s.fontWeight = String(Math.round(REST.wght + ((CREST.wght - REST.wght) * q) / STEPS));
    };

    const fit = () => {
      const width = box.clientWidth;
      const size = parseFloat(getComputedStyle(line).fontSize);
      const restW = restSpans.map((s) => s.offsetWidth);
      const crestW = crestSpans.map((s) => s.offsetWidth);
      const restTotal = rest.offsetWidth;
      let starts = 0;
      const c = restW.map((w) => (starts += w) - w / 2);
      const d = crestW.map((w, i) => w - restW[i]);
      // Widest static wave for any pointer position along the line.
      let peak = 0;
      if (wave) {
        for (let x = 0; x <= restTotal; x += 4) {
          let extra = 0;
          for (let i = 0; i < c.length; i++) extra += d[i] * falloff(Math.abs(x - c[i]));
          peak = Math.max(peak, extra);
        }
      }
      // Everything scales with the font size: solve for the size where rest + peak fills the box.
      const next = (size * width * (wave ? FILL : 0.995)) / (restTotal + peak);
      box.style.setProperty("--email-size", `${next.toFixed(2)}px`);
      const k = next / size;
      centres = c.map((v) => v * k);
      deltas = d.map((v) => v * k);
      budget = width * FILL - restTotal * k;
      box.dataset.fitted = wave ? "wave" : "static";
    };

    const measureOrigin = () => {
      const r = line.getBoundingClientRect();
      originX = r.left + window.scrollX;
      originY = r.top + r.height / 2 + window.scrollY;
    };

    const tick = (now: number) => {
      const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60;
      last = now;
      const a = 1 - Math.exp(-dt / TAU);
      let moving = false;
      for (let i = 0; i < t.length; i++) {
        t[i] += (target[i] - t[i]) * a;
        if (Math.abs(target[i] - t[i]) < 0.002) t[i] = target[i];
        else moving = true;
      }
      // Clamp the trail: total extra width never exceeds the reserved budget.
      let extra = 0;
      for (let i = 0; i < t.length; i++) extra += deltas[i] * t[i];
      if (extra > budget * 1.001 && extra > 0) {
        const s = budget / extra;
        for (let i = 0; i < t.length; i++) t[i] *= s;
      }
      for (let i = 0; i < t.length; i++) apply(i);
      frame = moving ? requestAnimationFrame(tick) : 0;
      if (!frame) last = 0;
    };
    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onEnter = () => measureOrigin();
    const onMove = (e: PointerEvent) => {
      if (!wave || e.pointerType !== "mouse") return;
      const x = e.pageX - originX;
      const dy = e.pageY - originY;
      for (let i = 0; i < centres.length; i++) target[i] = falloff(Math.hypot(x - centres[i], dy));
      kick();
    };
    const onLeave = () => {
      target.fill(0);
      kick();
    };
    const reset = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      last = 0;
      t.fill(0);
      target.fill(0);
      spans.forEach((_, i) => apply(i));
    };
    const onMode = () => {
      wave = waveMq.matches;
      reset();
      fit();
    };

    // Refit only when the available width changes (the wave itself may nudge the box height).
    let lastWidth = -1;
    const ro = new ResizeObserver(() => {
      if (box.clientWidth === lastWidth) return;
      lastWidth = box.clientWidth;
      reset();
      fit();
    });
    ro.observe(box);
    document.fonts?.ready.then(() => fit());
    box.addEventListener("pointerenter", onEnter, { passive: true });
    box.addEventListener("pointermove", onMove, { passive: true });
    box.addEventListener("pointerleave", onLeave, { passive: true });
    waveMq.addEventListener("change", onMode);
    return () => {
      ro.disconnect();
      box.removeEventListener("pointerenter", onEnter);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
      waveMq.removeEventListener("change", onMode);
      reset();
    };
  }, [email]);

  useEffect(() => () => window.clearTimeout(statusTimer.current), []);

  const copy = useCallback(async () => {
    window.clearTimeout(statusTimer.current);
    setStatus("idle"); // a new attempt never shows a stale outcome while its write is pending
    try {
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(email);
      setStatus("copied");
    } catch {
      setStatus("failed");
    }
    statusTimer.current = window.setTimeout(() => setStatus("idle"), motion.duration.intro * 2000);
  }, [email]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      void copy();
    }
  };

  return (
    <div className="@container">
      <div
        ref={boxRef}
        className="contact-email-box relative"
        style={{ "--chars": letters.length } as CSSProperties}
      >
        <div
          ref={lineRef}
          role="button"
          tabIndex={0}
          aria-label={email}
          aria-describedby={descId}
          data-cursor="copy"
          data-email
          onClick={() => void copy()}
          onKeyDown={onKeyDown}
          className="contact-email group relative block w-fit max-w-full cursor-pointer"
        >
          {letters.map((ch, i) => (
            <span key={i} aria-hidden="true" data-letter className="inline-block">
              {ch}
            </span>
          ))}
          <span aria-hidden="true" className="contact-email-rule" />
        </div>
        <span id={descId} className="sr-only">
          {ui.contact.copyAction}
        </span>

        {/* Hidden measuring copies (rest and crest axes): sizing only, clipped so they never add overflow. */}
        <div aria-hidden="true" className="pointer-events-none invisible absolute inset-0 overflow-hidden">
          <span ref={restRef} className="contact-email contact-email-rest absolute top-0 left-0">
            {letters.map((ch, i) => (
              <span key={i} className="inline-block">
                {ch}
              </span>
            ))}
          </span>
          {/* Pre-warm the intermediate axis instances so the first sweep does not rasterise them live. */}
          {Array.from({ length: STEPS - 1 }, (_, k) => (
            <span
              key={k}
              className="contact-email absolute top-0 left-0"
              style={{ fontStretch: `${REST.wdth + ((CREST.wdth - REST.wdth) * (k + 1)) / STEPS}%`, fontWeight: Math.round(REST.wght + ((CREST.wght - REST.wght) * (k + 1)) / STEPS) }}
            >
              {email}
            </span>
          ))}
          <span ref={crestRef} className="contact-email contact-email-crest absolute top-0 left-0">
            {letters.map((ch, i) => (
              <span key={i} className="inline-block">
                {ch}
              </span>
            ))}
          </span>
        </div>
      </div>

      {/* Screen readers hear only the outcome; the visible slot shows the hint, then the outcome. */}
      <p role="status" data-copy-status={status} className="sr-only">
        {status === "copied" ? ui.contact.copied : status === "failed" ? ui.contact.copyFailed : ""}
      </p>
      <div className="type-mono-xs mt-5 flex flex-wrap items-baseline gap-x-6 gap-y-2 lg:mt-7">
        <p aria-hidden="true" data-copy-visible className={status === "idle" ? "text-muted" : "text-text"}>
          {status === "copied" ? (
            ui.contact.copied
          ) : status === "failed" ? (
            ui.contact.copyFailed
          ) : (
            <>
              <span className="contact-hint-pointer">{ui.contact.copyHintPointer}</span>
              <span className="contact-hint-touch">{ui.contact.copyHintTouch}</span>
            </>
          )}
        </p>
        <a href={`mailto:${email}`} data-mailto className="ml-auto text-text underline decoration-rule underline-offset-4 hover:decoration-text">
          {ui.contact.mailto}
        </a>
      </div>
    </div>
  );
}
