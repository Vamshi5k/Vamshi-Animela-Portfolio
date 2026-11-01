"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";

type Props = {
  children: ReactNode;
  as?: "div" | "li" | "span" | "p";
  delay?: number;
  className?: string;
};

/**
 * Fade + translate in once on scroll. Halved distance and shorter duration on touch; none under reduced motion.
 * SPEC §6: not a section's signature motion; use for supporting elements only.
 */
export function Reveal({ children, as = "div", delay = 0, className }: Props) {
  const ref = useRef<HTMLElement>(null);
  const Tag = as as ElementType;

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      // Only reduced motion is a live condition; touch is read once (see TextReveal).
      const mm = gsap.matchMedia();
      mm.add(
        { motionOk: "(prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" },
        (ctx) => {
          if (!ctx.conditions?.motionOk) return;
          // The CSS failsafe already showed the content (slow hydration): leave it as is, no re-hide.
          if (getComputedStyle(el).visibility === "visible") return;
          const factor = window.matchMedia("(pointer: coarse)").matches ? motion.touchFactor : 1;
          gsap.fromTo(
            el,
            { autoAlpha: 0, y: motion.revealDistance * factor },
            {
              autoAlpha: 1,
              y: 0,
              duration: motion.duration.slow * factor,
              ease: gsapEase.out,
              delay,
              scrollTrigger: { trigger: el, start: "top 85%", once: true },
            },
          );
        },
      );
      return () => mm.revert();
    },
    { scope: ref, dependencies: [delay] },
  );

  return (
    <Tag ref={ref} data-reveal className={className}>
      {children}
    </Tag>
  );
}
