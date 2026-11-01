"use client";

import { useRef, type ElementType } from "react";
import { gsap, SplitText, useGSAP } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";

type Props = {
  children: string;
  as?: "h1" | "h2" | "h3" | "p" | "span" | "div";
  /** Mask each line or each word; pieces rise from below their mask. */
  split?: "lines" | "words";
  /** "scroll": play once when the text enters the viewport. "mount": play immediately. */
  trigger?: "scroll" | "mount";
  delay?: number;
  className?: string;
};

/**
 * Line or word mask reveal (SPEC §1a). Re-splits on resize and font load (SplitText autoSplit).
 * Starts hidden via [data-reveal] only when scripting is on and motion is allowed; reduced motion shows text as-is.
 * Screen readers get the original text (SplitText aria: "auto").
 */
export function TextReveal({ children, as = "p", split = "lines", trigger = "scroll", delay = 0, className }: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // Only reduced motion is a live condition. Touch is read once: if it were a matchMedia condition,
      // a pointer change (hybrid devices) would re-run this and re-hide text that has already revealed.
      const mm = gsap.matchMedia();
      mm.add(
        { motionOk: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          if (!ctx.conditions?.motionOk) return;
          // The CSS failsafe already showed the text (slow hydration): leave it as is, no re-hide.
          if (getComputedStyle(el).visibility === "visible") return;
          const factor = window.matchMedia("(pointer: coarse)").matches ? motion.touchFactor : 1;

          const splitter = SplitText.create(el, {
            type: split,
            mask: split,
            autoSplit: true,
            onSplit(self) {
              gsap.set(el, { visibility: "visible" });
              return gsap.from(split === "lines" ? self.lines : self.words, {
                yPercent: 110,
                duration: motion.duration.slow * factor,
                ease: gsapEase.out,
                stagger: motion.stagger,
                delay,
                scrollTrigger: trigger === "scroll" ? { trigger: el, start: "top 85%", once: true } : undefined,
              });
            },
          });
          return () => splitter.revert();
        },
      );
      return () => mm.revert();
    },
    { scope: ref, dependencies: [split, trigger, delay] },
  );

  return (
    <Tag ref={ref} data-reveal className={className}>
      {children}
    </Tag>
  );
}
