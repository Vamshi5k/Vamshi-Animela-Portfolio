"use client";

import clsx from "clsx";
import { useRef, type CSSProperties } from "react";
import type { Experience } from "@/data/types";
import { ui } from "@/data/ui";
import { isTodo } from "@/lib/content";
import { formatYearMonth, monthsBetween } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";

/** Share of the desktop ruler for the measured span (first start → last start); the rest is the fixed open segment to PRESENT. */
const MEASURED = 0.6;
/** Mobile: minimum spacing between role markers (SPEC: proportional, min 64px). */
const MIN_GAP_PX = 64;

type Props = { company: Experience };

/**
 * Experience time ruler (SPEC §1a). Only start dates are plotted; after the last start the ruler
 * continues as a fixed dashed segment to PRESENT (nothing reads the clock).
 * Growth reads through composition: title scale and colour step up per role, the ruler gets heavier,
 * and on desktop the role labels climb like a staircase toward the current role.
 * Motion: desktop with a fine pointer scrubs the draw to scroll (scaleX); touch and mobile draw once
 * on enter; reduced motion is static. Content is in one <ol> for both layouts; ruler art is aria-hidden.
 */
export function ExperienceTimeline({ company }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { roles } = company;
  const first = roles[0].start;
  const span = Math.max(1, monthsBetween(first, roles[roles.length - 1].start));
  const at = (ym: string) => (monthsBetween(first, ym) / span) * MEASURED; // 0…MEASURED

  // Desktop geometry: marker positions and segments between them, then the open segment to PRESENT.
  const markers = roles.map((r) => at(r.start));
  const segments = markers.map((x, i) => ({ x, width: (i < markers.length - 1 ? markers[i + 1] : 1) - x }));
  const ticks = Array.from({ length: span + 1 }, (_, m) => ({ x: (m / span) * MEASURED, start: roles.some((r) => at(r.start) === (m / span) * MEASURED) }));

  // Mobile spacing: proportional to months between starts, at least MIN_GAP_PX.
  const gaps = roles.map((r, i) => (i < roles.length - 1 ? monthsBetween(r.start, roles[i + 1].start) : 0));
  const minMonths = Math.min(...gaps.filter((g) => g > 0), Number.POSITIVE_INFINITY);
  const pxPerMonth = Number.isFinite(minMonths) ? MIN_GAP_PX / minMonths : MIN_GAP_PX;

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add(
        { motionOk: "(prefers-reduced-motion: no-preference)", desktop: "(min-width: 64rem)", fine: "(pointer: fine)" },
        (ctx) => {
          const { motionOk, desktop, fine } = ctx.conditions ?? {};
          if (!motionOk) return;
          // CSS failsafe already showed the timeline (slow hydration): leave it static.
          if (getComputedStyle(q("[data-exp-list]")[0]).visibility === "visible") return;
          gsap.set(q("[data-reveal]"), { visibility: "visible" });

          // One-time draws record that they played. A later media change re-runs this callback
          // (matchMedia reverts first); the timeline must then stay drawn, not reset to hidden.
          const drawnOnce = root.dataset.expDrawn === "true";
          const markDrawn = () => {
            root.dataset.expDrawn = "true";
          };

          const items = q("[data-exp-item]");
          if (desktop) {
            // Ruler draws left → right; each marker and its role appear as the line reaches them.
            const tl = gsap.timeline({ defaults: { ease: "none" } });
            q("[data-exp-seg]").forEach((seg, i) => {
              tl.fromTo(seg, { scaleX: 0 }, { scaleX: 1, duration: segments[i].width }, segments[i].x);
              tl.fromTo(q("[data-exp-marker]")[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, segments[i].x);
              tl.fromTo(items[i], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.08 }, segments[i].x);
            });
            tl.fromTo(q("[data-exp-present]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 1);

            if (fine) {
              // Scrubbed to scroll (SPEC). No pin.
              gsap.timeline({
                scrollTrigger: { trigger: q("[data-exp-ruler]")[0], start: "top 80%", end: "top 30%", scrub: 0.5 },
              }).add(tl);
            } else if (drawnOnce) {
              tl.progress(1).kill();
            } else {
              // Touch desktop: one draw on enter, no scrub.
              tl.pause().timeScale(1.02 / 1.4);
              gsap.timeline({
                scrollTrigger: {
                  trigger: root,
                  start: "top 80%",
                  once: true,
                  onEnter: () => {
                    markDrawn();
                    tl.play();
                  },
                },
              });
            }
            return;
          }

          if (drawnOnce) return; // already drawn: rest state is fully visible

          // Mobile/tablet: one draw on enter (SPEC), no scrub.
          gsap
            .timeline({
              scrollTrigger: { trigger: root, start: "top 80%", once: true, onEnter: markDrawn },
              defaults: { ease: gsapEase.out },
            })
            .fromTo(q("[data-exp-mcover]"), { scaleY: 1 }, { scaleY: 0, duration: motion.duration.slow * 2 * motion.touchFactor, ease: gsapEase.inOut })
            .fromTo(items, { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: motion.duration.base, stagger: motion.stagger * 3 }, "<0.1")
            .fromTo(q("[data-exp-present]"), { autoAlpha: 0 }, { autoAlpha: 1, duration: motion.duration.fast }, "-=0.1");
        },
      );
      return () => mm.revert();
    },
    { scope: ref },
  );

  const current = roles.length - 1;

  return (
    <div ref={ref} className="relative">
      {/* Company + location once, at the ruler's left end. */}
      <p className="type-mono-xs text-muted">
        {company.company} — {company.location}
      </p>

      {/* Desktop ruler (decorative). Markers at start dates only, fixed open segment to PRESENT. */}
      <div aria-hidden="true" data-exp-ruler data-reveal className="relative mt-8 hidden h-10 lg:block">
        {ticks.map((t, i) => (
          <span
            key={i}
            className={clsx("absolute top-5 w-px bg-rule", t.start ? "h-3" : "h-1.5")}
            style={{ left: `${t.x * 100}%` }}
          />
        ))}
        {segments.map((s, i) => (
          <span
            key={i}
            data-exp-seg
            className={clsx(
              "absolute top-5 origin-left -translate-y-1/2",
              i === 0 && "h-px bg-muted",
              i > 0 && i < current && "h-0.5 bg-text",
              i === current && "border-t-2 border-dashed border-text",
            )}
            style={{ left: `${s.x * 100}%`, width: `${s.width * 100}%` }}
          />
        ))}
        {markers.map((x, i) => (
          <span
            key={i}
            data-exp-marker
            className="absolute top-5 size-2 -translate-x-1/2 -translate-y-1/2 bg-text"
            style={{ left: `${x * 100}%` }}
          />
        ))}
        {/* Background masks the dashed segment so it ends before the label instead of running through it. */}
        <span data-exp-present className="absolute top-5 right-0 flex -translate-y-1/2 items-center gap-3 bg-bg pl-3">
          <span className="type-mono-xs text-text">{ui.present}</span>
          <span className="size-3 bg-accent" />
        </span>
      </div>

      {/* Roles: one list for both layouts. Desktop: hung below their markers as a rising staircase.
          Mobile: a vertical ruler on the left with proportional spacing. */}
      <div className="relative mt-10 lg:mt-0">
        {/* Mobile cover over the vertical ruler, used for the one-time draw (decorative). */}
        {/* Rest state is uncovered. Inline transform (not Tailwind's scale-y-0, which sets the separate
            `scale` property and would multiply with GSAP's transform). */}
        <span
          aria-hidden="true"
          data-exp-mcover
          className="absolute top-0 bottom-0 -left-px z-10 w-1 origin-bottom bg-bg lg:hidden"
          style={{ transform: "scaleY(0)" }}
        />
        <ol data-exp-list data-reveal className="relative lg:h-[24rem]">
          {roles.map((role, i) => {
            const isCurrent = i === current;
            const description = isTodo(role.description) ? null : role.description;
            const employment = isTodo(role.employmentType) ? null : role.employmentType;
            const dates = isCurrent && role.end === "present" ? `${formatYearMonth(role.start)} — ${ui.present}` : formatYearMonth(role.start);
            const style = {
              "--x": `${markers[i] * 100}%`,
              "--w": `${(1 - markers[i]) * 100}%`,
              "--row": `${1.5 + (current - i) * 6.5}rem`,
              "--gap": `${Math.max(MIN_GAP_PX, gaps[i] * pxPerMonth)}px`,
            } as CSSProperties;
            return (
              <li
                key={role.start}
                data-exp-item
                style={style}
                className={clsx(
                  // Mobile: a segment of the vertical ruler, heavier for later roles.
                  "relative min-h-(--gap) pb-10 pl-6",
                  i === 0 && "border-l border-muted",
                  i > 0 && !isCurrent && "border-l-2 border-text",
                  isCurrent && "border-l-2 border-dashed border-text pb-16",
                  // Desktop: hung below its marker; the leader is the left border from the ruler down.
                  "lg:absolute lg:top-0 lg:left-(--x) lg:min-h-0 lg:w-(--w) lg:border-l lg:border-solid lg:border-rule lg:pt-(--row) lg:pb-0 lg:pl-5",
                )}
              >
                {/* Mobile marker on the vertical ruler. */}
                <span aria-hidden="true" className="absolute top-1 -left-[5px] size-2 bg-text lg:hidden" />
                <p className="type-mono-s text-muted">{dates}</p>
                <h3
                  className={clsx(
                    "mt-2",
                    isCurrent ? "type-display-m max-w-[14ch]" : "type-heading",
                    i === 0 ? "text-muted" : "text-text",
                  )}
                >
                  {role.title}
                </h3>
                {employment && <p className="type-mono-xs mt-3 text-muted">{employment}</p>}
                {description ? (
                  <p className="type-body mt-3 max-w-measure-narrow text-muted">{description}</p>
                ) : (
                  isTodo(role.description) && (
                    <p className="type-mono-xs mt-3 text-muted">
                      {ui.pending} — {role.description.todo}
                    </p>
                  )
                )}
              </li>
            );
          })}
        </ol>
        {/* Mobile: end of the dashed segment, fixed PRESENT marker (decorative; the dates say PRESENT). */}
        <div aria-hidden="true" data-exp-present className="-mt-px flex items-center gap-3 lg:hidden">
          <span className="-ml-[5px] size-3 bg-accent" />
          <span className="type-mono-xs text-text">{ui.present}</span>
        </div>
      </div>
    </div>
  );
}
