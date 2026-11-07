"use client";

import { useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";

/**
 * Clients motion (SPEC §1a), the center-line wipe. Each name opens from its center outward (clip-path) as it
 * enters the lower third of the viewport, scrubbed; then a hairline under it scales out from the center.
 * Only clip-path and transform change, so layout never moves. Touch: each wipe runs once on entry, no scrub.
 * Reduced motion: static. No JS: names are visible (data-reveal failsafe).
 */
export function ClientsMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const mm = gsap.matchMedia();
      mm.add({ motionOk: "(prefers-reduced-motion: no-preference)" }, (ctx) => {
        if (!ctx.conditions?.motionOk) return;
        const touch = window.matchMedia("(pointer: coarse)").matches;
        const names = gsap.utils.toArray<HTMLElement>("[data-client-name]", root);
        const rules = gsap.utils.toArray<HTMLElement>("[data-client-rule]", root);
        // CSS failsafe already showed the names (slow hydration): leave them static.
        if (names[0] && getComputedStyle(names[0]).visibility === "visible") return;
        gsap.set(names, { visibility: "visible" });
        names.forEach((name, i) => {
          const rule = rules[i];
          if (touch) {
            gsap.set(name, { clipPath: "inset(0% 50% 0% 50%)" });
            if (rule) gsap.set(rule, { scaleX: 0 });
            ScrollTrigger.create({
              trigger: name,
              start: "top 85%",
              once: true,
              onEnter: () => {
                gsap.to(name, { clipPath: "inset(0% 0% 0% 0%)", duration: motion.duration.slow * motion.touchFactor, ease: gsapEase.out });
                if (rule) gsap.to(rule, { scaleX: 1, duration: motion.duration.slow * motion.touchFactor, ease: gsapEase.out, delay: 0.1 });
              },
            });
            return;
          }
          gsap.fromTo(
            name,
            { clipPath: "inset(0% 50% 0% 50%)" },
            { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: name, start: "top bottom", end: "top 66%", scrub: 0.4 } },
          );
          if (rule) {
            gsap.fromTo(rule, { scaleX: 0 }, { scaleX: 1, ease: "none", scrollTrigger: { trigger: name, start: "top 66%", end: "top 45%", scrub: 0.4 } });
          }
        });
        // Positions are measured by ScrollTrigger; re-measure when the page height changes later (fonts, images).
        let t = 0;
        const ro = new ResizeObserver(() => {
          window.clearTimeout(t);
          t = window.setTimeout(() => ScrollTrigger.refresh(), 150);
        });
        ro.observe(document.body);
        return () => {
          window.clearTimeout(t);
          ro.disconnect();
        };
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
