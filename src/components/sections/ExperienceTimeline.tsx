"use client";

import clsx from "clsx";
import { useRef, type CSSProperties } from "react";
import type { Experience } from "@/data/types";
import { ui } from "@/data/ui";
import { isTodo } from "@/lib/content";
import { formatYearMonth, monthsBetween, parseYearMonth } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";

/** Share of the desktop ruler for the measured span (first start → last start); the rest is the fixed open segment to PRESENT. */
const MEASURED = 0.75;
/** Desktop column spans (of 12) for the roles in order: they widen with seniority. Falls back to equal spans. */
const SPANS_FOR_THREE = [3, 4, 5];

type Props = { company: Experience };

/**
 * Experience: Station Ruler (SPEC §1a).
 * Desktop: a full-width ruler with the start dates printed on it as stations, a fixed dashed segment to
 * PRESENT (nothing reads the clock), and one row of role columns under it, each joined to its station by an
 * elbow leader. Growth reads through composition only: wider columns, a larger title for the current role,
 * and a heavier ruler per segment.
 * Mobile: a vertical ruler with the station dates; even spacing (no implied durations).
 * Motion: desktop with a fine pointer scrubs the draw to scroll; touch and mobile draw once on enter and stay
 * drawn; reduced motion is static. Everything is visible without JavaScript (data-reveal failsafe).
 */
export function ExperienceTimeline({ company }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const { roles } = company;
  const count = roles.length;
  const current = count - 1;
  const first = roles[0].start;
  const span = Math.max(1, monthsBetween(first, roles[current].start));
  const at = (months: number) => (months / span) * MEASURED; // 0…MEASURED

  // Stations at the start dates only, the segments between them, then the open segment to PRESENT.
  const stations = roles.map((r) => at(monthsBetween(first, r.start)));
  const segments = stations.map((x, i) => ({ x, width: (i < current ? stations[i + 1] : 1) - x }));
  const ticks = Array.from({ length: span + 1 }, (_, m) => at(m));
  const { month: firstMonth, year: firstYear } = parseYearMonth(first);
  const years = ticks
    .map((x, m) => ({ x, month: ((firstMonth - 1 + m) % 12) + 1, year: firstYear + Math.floor((firstMonth - 1 + m) / 12) }))
    .filter((t, m) => m > 0 && t.month === 1);

  // Desktop columns: start column (1-based) and span for each role.
  const spans = count === 3 ? SPANS_FOR_THREE : roles.map(() => Math.floor(12 / count));
  const starts = spans.map((_, i) => 1 + spans.slice(0, i).reduce((a, b) => a + b, 0));
  /** Left edge of grid column `c` (1-based) as a length, matching `layout-grid` (gap = --gutter). */
  const columnLeft = (c: number) => `calc((100% + var(--gutter)) * ${c - 1} / 12)`;

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

          // One-time draws record that they played, so a later media change (matchMedia re-run) keeps them drawn.
          const drawnOnce = root.dataset.expDrawn === "true";
          const markDrawn = () => {
            root.dataset.expDrawn = "true";
          };
          const items = q("[data-exp-item]");

          if (desktop) {
            // One timeline in ruler units (0…1): each station, its leader and its column appear after the line reaches it.
            const tl = gsap.timeline({ defaults: { ease: "none" } });
            q("[data-exp-seg]").forEach((seg, i) => {
              const x = segments[i].x;
              tl.fromTo(seg, { scaleX: 0 }, { scaleX: 1, duration: segments[i].width }, x);
              tl.fromTo(q(`[data-exp-station="${i}"]`), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, x);
              const [down, across, into] = q(`[data-exp-leader="${i}"] > span`);
              tl.fromTo(down, { scaleY: 0 }, { scaleY: 1, duration: 0.03 }, x);
              tl.fromTo(across, { scaleX: 0 }, { scaleX: 1, duration: 0.04 }, x + 0.03);
              tl.fromTo(into, { scaleY: 0 }, { scaleY: 1, duration: 0.03 }, x + 0.07);
              tl.fromTo(items[i], { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 0.08 }, x + 0.08);
            });
            tl.fromTo(q('[data-exp-station="present"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.02 }, 1);
            q("[data-exp-year]").forEach((el) => {
              tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.01 }, Number(el.getAttribute("data-exp-year")));
            });

            if (fine) {
              // Scrubbed to scroll (SPEC). No pin.
              gsap.timeline({
                scrollTrigger: { trigger: q("[data-exp-ruler]")[0], start: "top 80%", end: "top 30%", scrub: 0.5 },
              }).add(tl);
            } else if (drawnOnce) {
              tl.progress(1).kill();
            } else {
              // Touch desktop: one draw on enter, no scrub.
              tl.pause().timeScale(tl.duration() / 1.6);
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
            .fromTo(q('[data-exp-station="present-m"]'), { autoAlpha: 0 }, { autoAlpha: 1, duration: motion.duration.fast }, "-=0.1");
        },
      );
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div ref={ref} className="relative">
      {/* Company + location once, at the ruler's left end. */}
      <p className="type-mono-xs text-muted">
        {company.company} — {company.location}
      </p>

      {/* Desktop ruler (decorative; dates are repeated in each role for screen readers). */}
      <div aria-hidden="true" data-exp-ruler data-reveal className="relative mt-10 hidden h-12 lg:block">
        {/* Station dates above the line. */}
        {roles.map((role, i) => (
          <span
            key={role.start}
            data-exp-station={i}
            className="type-mono-xs absolute top-0 text-text"
            style={{ left: `${stations[i] * 100}%` }}
          >
            {formatYearMonth(role.start)}
          </span>
        ))}
        {years.map((y) => (
          <span
            key={y.year}
            data-exp-year={y.x}
            className="type-mono-xs absolute top-0 -translate-x-1/2 text-muted"
            style={{ left: `${y.x * 100}%` }}
          >
            {y.year}
          </span>
        ))}
        {/* Month ticks below the line. */}
        {ticks.map((x, i) => (
          <span key={i} className="absolute top-8 h-1.5 w-px bg-rule" style={{ left: `${x * 100}%` }} />
        ))}
        {/* Segments: heavier per role; the last is the open dashed segment to PRESENT. */}
        {segments.map((s, i) => (
          <span
            key={i}
            data-exp-seg
            className={clsx(
              "absolute top-8 origin-left -translate-y-1/2",
              i === 0 && i !== current && "h-px bg-muted",
              i > 0 && i < current && "h-0.5 bg-text",
              i === current && "border-t-2 border-dashed border-text",
            )}
            style={{ left: `${s.x * 100}%`, width: `${s.width * 100}%` }}
          />
        ))}
        {stations.map((x, i) => (
          <span
            key={i}
            data-exp-station={i}
            className="absolute top-8 size-2 -translate-x-1/2 -translate-y-1/2 bg-text"
            style={{ left: `${x * 100}%` }}
          />
        ))}
        {/* Fixed PRESENT station; its background masks the dashed segment so the line ends before the label. */}
        <span data-exp-station="present" className="absolute top-0 right-0 flex h-full flex-col items-end justify-between">
          <span className="type-mono-xs text-text">{ui.present}</span>
          <span className="mb-[calc(1rem-6px)] size-3 bg-accent" />
        </span>
      </div>

      {/* Desktop elbow leaders: down from each station, across, and down into its column (decorative). */}
      <div aria-hidden="true" data-reveal className="relative hidden h-14 lg:block">
        {roles.map((role, i) => {
          const station = `${stations[i] * 100}%`;
          const column = columnLeft(starts[i]);
          const leftward = stations[i] * 100 > ((starts[i] - 1) / 12) * 100;
          return (
            <span key={role.start} data-exp-leader={i} className="absolute inset-0">
              <span className="absolute top-0 h-1/2 w-px origin-top bg-rule" style={{ left: station }} />
              <span
                className={clsx("absolute top-1/2 h-px bg-rule", leftward ? "origin-right" : "origin-left")}
                style={{
                  left: `min(${station}, ${column})`,
                  width: `calc(max(${station}, ${column}) - min(${station}, ${column}) + 1px)`,
                }}
              />
              <span className="absolute top-1/2 h-1/2 w-px origin-top bg-rule" style={{ left: column }} />
            </span>
          );
        })}
      </div>

      {/* Roles: one list for both layouts. Desktop: one row of columns (3, 4, 5 of 12).
          Mobile: entries on a vertical ruler, evenly spaced, station dates only. */}
      <div className="relative mt-10 lg:mt-0">
        {/* Mobile cover over the vertical ruler for the one-time draw. Inline transform (not Tailwind's
            scale-y-0, which sets the separate `scale` property and would multiply with GSAP's transform). */}
        <span
          aria-hidden="true"
          data-exp-mcover
          className="absolute top-0 bottom-0 -left-px z-10 w-1 origin-bottom bg-bg lg:hidden"
          style={{ transform: "scaleY(0)" }}
        />
        <ol data-exp-list data-reveal className="relative lg:layout-grid lg:items-start">
          {roles.map((role, i) => {
            const isCurrent = i === current;
            const description = isTodo(role.description) ? null : role.description;
            const employment = isTodo(role.employmentType) ? null : role.employmentType;
            const end = isTodo(role.end) ? null : role.end;
            const dates =
              end === "present"
                ? `${formatYearMonth(role.start)} — ${ui.present}`
                : end
                  ? `${formatYearMonth(role.start)} — ${formatYearMonth(end)}`
                  : formatYearMonth(role.start);
            return (
              <li
                key={role.start}
                data-exp-item
                style={{ "--start": starts[i], "--span": spans[i] } as CSSProperties}
                className={clsx(
                  // Mobile: a segment of the vertical ruler, heavier for later roles.
                  "relative pb-12 pl-6",
                  i === 0 && !isCurrent && "border-l border-muted",
                  i > 0 && !isCurrent && "border-l-2 border-text",
                  isCurrent && "border-l-2 border-dashed border-text pb-16",
                  // Desktop: a column under its station's leader.
                  "lg:col-span-(--span) lg:col-start-(--start) lg:border-0 lg:pt-4 lg:pb-0 lg:pl-0",
                )}
              >
                {/* Mobile station marker on the vertical ruler. */}
                <span aria-hidden="true" className="absolute top-1 -left-[5px] size-2 bg-text lg:hidden" />
                {/* Station date: shown on mobile; on desktop the ruler shows it, so it stays for screen readers only. */}
                <p className="type-mono-s text-muted lg:sr-only">{dates}</p>
                <h3 className={clsx("mt-2 text-text lg:mt-0", isCurrent ? "type-display-m max-w-[14ch]" : "type-heading")}>
                  {role.title}
                </h3>
                {employment && <p className="type-mono-xs mt-3 text-muted">{employment}</p>}
                {description ? (
                  <p className="type-body mt-4 max-w-measure-narrow text-muted">{description}</p>
                ) : (
                  isTodo(role.description) && (
                    <p className="type-mono-xs mt-4 text-muted">
                      {ui.pending} — {role.description.todo}
                    </p>
                  )
                )}
              </li>
            );
          })}
        </ol>
        {/* Mobile: end of the dashed segment, fixed PRESENT marker (decorative; the dates say PRESENT). */}
        <div aria-hidden="true" data-exp-station="present-m" className="-mt-px flex items-center gap-3 lg:hidden">
          <span className="-ml-[5px] size-3 bg-accent" />
          <span className="type-mono-xs text-text">{ui.present}</span>
        </div>
      </div>
    </div>
  );
}
