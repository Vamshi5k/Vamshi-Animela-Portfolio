"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { gsap } from "@/lib/gsap";
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
          // Driven by live geometry, never by cached scroll positions: the uncovered share is how far <main>'s
          // bottom edge has risen above the viewport bottom, read once per scroll frame. Page-height changes
          // after setup (late fonts, images, dev-mode CSS) therefore cannot strand the letters below the crop.
          const main = document.getElementById("main");
          if (!main) return;
          // Every letter starts below the crop (set explicitly: a staggered fromTo only renders the first).
          gsap.set(letters, { yPercent: 100 });
          const rise = gsap.timeline({ paused: true }).to(letters, { yPercent: 0, ease: "none", duration: 1, stagger: 0.08 });
          const proxy = { p: 0 };
          const follow = gsap.quickTo(proxy, "p", { duration: 0.4, ease: gsapEase.out, onUpdate: () => void rise.progress(proxy.p) });
          let first = true;
          let frameId = 0;
          const measure = () => {
            frameId = 0;
            const p = gsap.utils.clamp(0, 1, (window.innerHeight - main.getBoundingClientRect().bottom) / footer.offsetHeight);
            if (first) {
              first = false;
              proxy.p = p;
              rise.progress(p);
            }
            follow(p);
            setOpen(p > OPEN_AT);
          };
          const onScroll = () => {
            if (!frameId) frameId = requestAnimationFrame(measure);
          };
          measure();
          window.addEventListener("scroll", onScroll, { passive: true });
          window.addEventListener("resize", onScroll, { passive: true });
          return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
          };
        }
        // Normal flow: an IntersectionObserver (live geometry, nothing cached) opens the footer, and in rise mode
        // plays the wordmark rise once when the footer is 15% into the viewport.
        const f = window.matchMedia("(pointer: coarse)").matches ? motion.touchFactor : 1;
        let risen = next !== "rise";
        if (!risen) gsap.set(letters, { yPercent: 100 });
        const io = new IntersectionObserver(
          ([entry]) => {
            setOpen(entry.isIntersecting);
            if (!risen && entry.isIntersecting) {
              risen = true;
              gsap.to(letters, { yPercent: 0, duration: motion.duration.slow * f, ease: gsapEase.out, stagger: motion.stagger * f });
            }
          },
          { rootMargin: "0px 0px -15% 0px" },
        );
        io.observe(footer);
        return () => io.disconnect();
      }, root);
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
