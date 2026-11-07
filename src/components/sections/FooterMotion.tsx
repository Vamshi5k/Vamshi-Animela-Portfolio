"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";

const CURTAIN_QUERY = "(min-width: 64rem) and (prefers-reduced-motion: no-preference)";
const REDUCED_QUERY = "(prefers-reduced-motion: reduce)";
/** Share of the uncover distance after which the footer counts as open (header index stops being lime). */
const OPEN_AT = 0.15;

type Mode = "curtain" | "rise" | "static";

/**
 * Footer motion (SPEC §1a), the curtain. Desktop with motion allowed, and only when the footer fits the
 * viewport: <html data-curtain> makes the footer sticky at the bottom behind <main>, so Contact lifts
 * away to uncover it, and the cropped wordmark's letters rise one by one, scrubbed to the uncover
 * distance (transform only, no pinning). Otherwise the footer stays in normal flow: one staggered rise
 * on entry (phones, tablets, short viewports), or nothing under reduced motion.
 * While the footer is open, <html data-footer-open> lets the back-to-top link be the only lime element.
 */
export function FooterMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    const footer = root?.closest("footer");
    if (!root || !footer) return;
    const html = document.documentElement;
    const wordmark = root.querySelector<HTMLElement>("[data-wordmark]");
    const letters = [...root.querySelectorAll<HTMLElement>("[data-wm-letter]")];
    const curtainMq = window.matchMedia(CURTAIN_QUERY);
    const reducedMq = window.matchMedia(REDUCED_QUERY);
    let ctx: gsap.Context | undefined;
    let mode: Mode | undefined;

    const setOpen = (open: boolean) => {
      if (open) html.dataset.footerOpen = "";
      else delete html.dataset.footerOpen;
    };

    const build = () => {
      const fits = footer.offsetHeight <= window.innerHeight;
      const next: Mode = curtainMq.matches && fits ? "curtain" : reducedMq.matches ? "static" : "rise";
      if (next === mode) return;
      mode = next;
      ctx?.revert();
      setOpen(false);
      if (next === "curtain") html.dataset.curtain = "";
      else delete html.dataset.curtain;
      footer.dataset.mode = next;

      ctx = gsap.context(() => {
        if (wordmark) gsap.set(wordmark, { visibility: "visible" });
        if (next === "curtain") {
          const max = () => ScrollTrigger.maxScroll(window);
          // Every letter starts below the crop. Set explicitly: a staggered fromTo only renders the first
          // letter's start state at progress 0, which left the others already risen behind <main>.
          gsap.set(letters, { yPercent: 100 });
          gsap.to(
            letters,
            {
              yPercent: 0,
              ease: "none",
              duration: 1,
              stagger: 0.08,
              scrollTrigger: {
                start: () => max() - footer.offsetHeight,
                end: () => max(),
                scrub: 0.4,
                invalidateOnRefresh: true,
                onUpdate: (st) => setOpen(st.progress > OPEN_AT),
              },
            },
          );
        } else {
          if (next === "rise") {
            const f = window.matchMedia("(pointer: coarse)").matches ? motion.touchFactor : 1;
            gsap.set(letters, { yPercent: 100 });
            ScrollTrigger.create({
              trigger: footer,
              start: "top 85%",
              once: true,
              onEnter: () => {
                gsap.to(letters, { yPercent: 0, duration: motion.duration.slow * f, ease: gsapEase.out, stagger: motion.stagger * f });
              },
            });
          }
          ScrollTrigger.create({ trigger: footer, start: "top 80%", end: "bottom top", onToggle: (st) => setOpen(st.isActive) });
        }
      }, root);
      ScrollTrigger.refresh();
    };

    build();
    // Re-decide on any size change: the curtain needs the footer to fit the viewport.
    let frame = 0;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(build);
    };
    const ro = new ResizeObserver(schedule);
    ro.observe(footer);
    window.addEventListener("resize", schedule, { passive: true });
    curtainMq.addEventListener("change", schedule);
    reducedMq.addEventListener("change", schedule);
    document.fonts?.ready.then(schedule);

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
      window.removeEventListener("resize", schedule);
      curtainMq.removeEventListener("change", schedule);
      reducedMq.removeEventListener("change", schedule);
      ctx?.revert();
      delete html.dataset.curtain;
      setOpen(false);
    };
  }, []);

  return <div ref={ref}>{children}</div>;
}
