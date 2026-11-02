"use client";

import { useRef, useState } from "react";
import { tech } from "@/data/tech";
import { ui } from "@/data/ui";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

/** Scroll speed (px/s) that adds 1× to the loop speed. */
const VELOCITY_PER_STEP = 400;
/** Extra speed multiplier cap, so fast flings never blur the type. */
const MAX_BOOST = 4;

/**
 * Technology marquee (SPEC §1a): the only full-bleed band, one line of expanded type between two
 * hairlines, unnumbered. The loop is CSS (`marquee-track` in globals.css) and runs without JavaScript.
 * GSAP couples its speed and direction to scroll velocity on desktop with a fine pointer only.
 * Screen readers get a plain list; the moving track (two identical sets) is aria-hidden.
 */
export function Marquee() {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const animation = trackRef.current?.getAnimations()[0];
        if (!animation) return;

        let direction = 1;
        let boost = 0;
        let rate = 1;
        const trigger = ScrollTrigger.create({
          trigger: ref.current,
          start: "top bottom",
          end: "bottom top",
          onUpdate: (self) => {
            const v = self.getVelocity();
            if (v !== 0) direction = Math.sign(v); // scrolling up reverses the loop
            boost = Math.max(boost, Math.min(Math.abs(v) / VELOCITY_PER_STEP, MAX_BOOST));
          },
        });
        const tick = () => {
          boost *= 0.92; // decay back to the base speed
          const target = direction * (1 + boost);
          if (Math.abs(target - rate) < 0.001) return;
          rate += (target - rate) * 0.12;
          animation.playbackRate = rate;
        };
        gsap.ticker.add(tick);

        return () => {
          gsap.ticker.remove(tick);
          trigger.kill();
          animation.playbackRate = 1;
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      aria-label={ui.marqueeLabel}
      data-paused={paused || undefined}
      className="marquee relative border-y border-rule"
    >
      <ul className="sr-only">
        {tech.map((name) => (
          <li key={name}>{name}</li>
        ))}
      </ul>

      {/* Visual track: clipped and paint-contained so it can never widen the page. */}
      <div aria-hidden="true" className="overflow-hidden py-5 [contain:paint] md:py-8">
        <div ref={trackRef} className="marquee-track">
          {[0, 1].map((set) => (
            <div key={set} className="marquee-set">
              {tech.map((name) => (
                <span key={name} className="type-marquee flex shrink-0 items-baseline whitespace-nowrap">
                  <span className="marquee-name">{name}</span>
                  <span className="marquee-sep px-[0.45em] text-muted">/</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Pause toggle on the lower rule (SPEC; WCAG 2.2.2). Hidden when nothing moves. */}
      <button
        type="button"
        aria-pressed={paused}
        onClick={() => setPaused((p) => !p)}
        className="type-mono-xs absolute right-(--margin) bottom-0 translate-y-1/2 bg-bg px-2 py-1 text-muted hover:text-accent motion-reduce:hidden"
      >
        {paused ? ui.marqueePlay : ui.marqueePause}
      </button>
    </section>
  );
}
