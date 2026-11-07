"use client";

import type { ReactNode } from "react";
import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";

/**
 * Opacity of an unread word. #F2F0EA at 0.55 over #090909 blends to about #898884: 5.6:1, above the
 * 4.5:1 floor, so every word stays readable before it is read (verified in motion:check).
 */
export const UNREAD_OPACITY = 0.55;
/** Seconds per character while a fact-sheet line types. */
const PER_CHAR = 0.009;

/**
 * About motion (SPEC §1a), the read-through. The quote's words go from unread to full text one by one,
 * scrubbed to scroll in normal flow (no pinning); travel is shorter on phones. When the read-through
 * completes (or the sheet reaches mid-screen), the fact sheet types in line by line: on a fine pointer a
 * one-line entry is revealed in one clip-path step per monospaced character; on touch, or when a line
 * wraps, it wipes in smoothly. Reduced motion: nothing runs, every word is full text and every line is
 * visible. No JS: the same (the lines carry data-reveal, so the CSS failsafe applies).
 */
export function AboutMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add({ motionOk: "(prefers-reduced-motion: no-preference)", phone: "(max-width: 47.99rem)" }, (ctx) => {
        if (!ctx.conditions?.motionOk) return;
        const phone = !!ctx.conditions.phone;
        const touch = window.matchMedia("(pointer: coarse)").matches;
        const f = touch ? motion.touchFactor : 1;
        const quote = q("[data-read]")[0];
        const words = q("[data-read-word]");
        const lines = q("[data-type-line]") as HTMLElement[];
        const numeral = q("[data-numeral]")[0];
        const typeTargets = [numeral, ...lines].filter(Boolean);

        // Failsafe already showed the lines (slow hydration) or they were typed before a media change: static.
        const shown = typeTargets[0] && getComputedStyle(typeTargets[0]).visibility === "visible";
        const done = root.dataset.typed === "true" || shown;
        gsap.set(typeTargets, { visibility: "visible" });
        if (!done) {
          gsap.set(lines, { clipPath: "inset(0% 100% 0% 0%)" });
          if (numeral) gsap.set(numeral, { clipPath: "inset(100% 0% 0% 0%)" });
        }

        let typing: gsap.core.Timeline | undefined;
        const type = () => {
          if (root.dataset.typed === "true") return;
          root.dataset.typed = "true";
          const tl = gsap.timeline();
          if (numeral) tl.to(numeral, { clipPath: "inset(0% 0% 0% 0%)", duration: motion.duration.slow * f, ease: gsapEase.out }, 0);
          lines.forEach((line, i) => {
            const n = line.textContent?.length ?? 1;
            const wraps = line.offsetHeight > parseFloat(getComputedStyle(line).lineHeight) * 1.5;
            const stepped = !touch && !wraps;
            tl.to(
              line,
              {
                clipPath: "inset(0% 0% 0% 0%)",
                duration: stepped ? gsap.utils.clamp(motion.duration.instant, motion.duration.base, n * PER_CHAR) : motion.duration.base * f,
                ease: stepped ? `steps(${n})` : gsapEase.out,
              },
              i === 0 ? 0 : `+=${motion.stagger * f}`,
            );
          });
          typing = tl;
        };

        if (quote && words.length) {
          gsap.fromTo(
            words,
            { opacity: UNREAD_OPACITY },
            {
              opacity: 1,
              ease: "none",
              duration: 1,
              stagger: 1, // strictly one word after another
              scrollTrigger: {
                trigger: quote,
                start: phone ? "top 75%" : "top 80%",
                end: phone ? "top 25%" : "top 20%", // 50% of the viewport on phones, 60% elsewhere
                scrub: touch ? true : 0.5,
                onLeave: done ? undefined : type,
              },
            },
          );
        }
        const sheet = q("[data-sheet]")[0];
        if (sheet && !done) ScrollTrigger.create({ trigger: sheet, start: "top 60%", once: true, onEnter: type });

        return () => typing?.progress(1);
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
