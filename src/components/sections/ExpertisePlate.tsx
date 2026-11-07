"use client";

import clsx from "clsx";
import { useEffect, useRef, useState, type PointerEvent } from "react";
import type { SkillGroup } from "@/data/types";
import { formatItemNumber } from "@/lib/format";
import { gsap, useGSAP } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";

type Props = { groups: readonly SkillGroup[] };

const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const REDUCED = "(prefers-reduced-motion: reduce)";

/** Cosmetic decode: characters settle left → right. Only touches aria-hidden visual copies. */
function scramble(els: Element[], text: string, duration: number) {
  const start = performance.now();
  let frame = 0;
  const tick = (now: number) => {
    const p = Math.min(1, (now - start) / (duration * 1000));
    const settled = Math.floor(p * text.length);
    let out = text.slice(0, settled);
    for (let i = settled; i < text.length; i++) {
      out += text[i] === " " ? " " : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
    }
    for (const el of els) el.textContent = p < 1 ? out : text;
    if (p < 1) frame = requestAnimationFrame(tick);
  };
  frame = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(frame);
    for (const el of els) el.textContent = text;
  };
}

/**
 * Expertise spec plate (SPEC §1a). Six ruled rows: a huge outlined group label that fills solid on entry
 * (with a short cosmetic decode), and the items inline in mono with a scan counter ("07 / 07").
 * Signature moment, the inversion scan: hover, focus or a tap floods the row with cream via a clip-path
 * wipe (an aria-hidden dark-on-cream copy), the counter ticks up, and the other rows dim.
 */
export function ExpertisePlate({ groups }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const lastPointer = useRef<string | null>(null);

  // Entry: label fill wipe + decode, once per row.
  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();
      mm.add({ motionOk: "(prefers-reduced-motion: no-preference)", reduce: REDUCED }, (ctx) => {
        if (!ctx.conditions?.motionOk) return;
        const fills = q("[data-plate-fill]");
        // CSS failsafe already showed the fills (slow hydration): leave them static.
        if (fills[0] && getComputedStyle(fills[0]).visibility === "visible") return;
        gsap.set(fills, { visibility: "visible" });
        const f = window.matchMedia("(pointer: coarse)").matches ? motion.touchFactor : 1;
        const stops: (() => void)[] = [];
        q("[data-plate-row]").forEach((row, i) => {
          const fill = fills[i];
          if ((row as HTMLElement).dataset.plateDone === "true") return; // never replay after a media change
          gsap.fromTo(
            fill,
            { clipPath: "inset(0% 100% 0% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              duration: motion.duration.slow * f,
              ease: gsapEase.out,
              scrollTrigger: {
                trigger: row,
                start: "top 85%",
                once: true,
                onEnter: () => {
                  (row as HTMLElement).dataset.plateDone = "true";
                  stops.push(scramble([...row.querySelectorAll("[data-plate-label]")], groups[i].label, 0.8 * f));
                },
              },
            },
          );
        });
        return () => stops.forEach((stop) => stop());
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  // Inversion scan: the counter ticks 00 → n while the wipe runs (one rAF loop; none under reduced motion).
  useEffect(() => {
    const root = ref.current;
    if (!root || active === null) return;
    const count = groups[active].items.length;
    const readouts = root.querySelectorAll(`[data-plate-row="${active}"] [data-plate-readout]`);
    const set = (n: number) => readouts.forEach((el) => (el.textContent = formatItemNumber(n, count)));
    if (window.matchMedia(REDUCED).matches) return set(count);
    const start = performance.now();
    const duration = motion.duration.base * 1000;
    let frame = 0;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      set(Math.round((1 - (1 - p) ** 3) * count)); // ease-out, matches the wipe
      if (p < 1) frame = requestAnimationFrame(tick);
    };
    set(0);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      set(count);
    };
  }, [active, groups]);

  const onPointerDown = (e: PointerEvent) => {
    lastPointer.current = e.pointerType;
  };

  return (
    <div ref={ref} className="plate border-b border-rule" data-scanning={active !== null || undefined}>
      {groups.map((group, i) => {
        const isActive = active === i;
        return (
          <div
            key={group.id}
            role="group"
            tabIndex={0}
            aria-label={`${group.label}: ${group.items.join(", ")}`}
            data-plate-row={i}
            data-active={isActive || undefined}
            className="plate-row relative border-t border-rule -outline-offset-2"
            onPointerDown={onPointerDown}
            onPointerEnter={(e) => e.pointerType === "mouse" && setActive(i)}
            onPointerLeave={(e) => e.pointerType === "mouse" && setActive((a) => (a === i ? null : a))}
            onFocus={() => {
              // A tap also focuses; touch toggles on click instead.
              if (lastPointer.current === "touch") return;
              setActive(i);
            }}
            onBlur={() => setActive((a) => (a === i ? null : a))}
            onClick={() => {
              if (lastPointer.current === "touch") setActive((a) => (a === i ? null : i));
              lastPointer.current = null;
            }}
          >
            <RowContent group={group} index={i} total={groups.length} />
            {/* Inverted copy (dark on cream), revealed by the clip-path wipe. The flood bleeds one gutter past
                the rules on both sides so no glyph sits on its edge; the content is padded back into register. */}
            <div aria-hidden="true" className="plate-inverse absolute inset-y-0 -inset-x-(--gutter) bg-text px-(--gutter) text-bg">
              <RowContent group={group} index={i} total={groups.length} inverse />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RowContent({ group, index, total, inverse = false }: { group: SkillGroup; index: number; total: number; inverse?: boolean }) {
  const count = group.items.length;
  return (
    <div className="grid grid-cols-1 gap-y-4 py-7 lg:layout-grid lg:items-start lg:py-9">
      <div className="lg:col-span-5">
        <p className={clsx("type-mono-xs plate-dim", inverse ? "text-bg/60" : "text-muted")}>{formatItemNumber(index + 1, total)}</p>
        {!inverse && <h3 className="sr-only">{group.label}</h3>}
        <div aria-hidden="true" className="relative mt-3">
          {inverse ? (
            <span data-plate-label className="type-plate-label block text-bg">
              {group.label}
            </span>
          ) : (
            <>
              <span data-plate-label className="type-plate-label plate-outline block">
                {group.label}
              </span>
              {/* Solid fill over the outline: wipes in on entry (data-reveal: visible without JS). */}
              <span data-plate-label data-plate-fill data-reveal className="type-plate-label absolute inset-0 block text-text">
                {group.label}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Readout heads the list it counts; identical markup in both layers so line breaks match during the wipe. */}
      <div className="plate-dim lg:col-span-7 lg:col-start-6">
        <p data-plate-readout className={clsx("type-mono-xs", inverse ? "text-bg/70" : "text-muted")}>
          {formatItemNumber(count, count)}
        </p>
        {/* Each item carries its separator on its leading edge. The list is pulled left by one separator width
            inside an overflow clip, so the separator of whichever item starts a line falls into the clipped
            margin. Lines can therefore never start or end with a slash, at any width, in either layer. */}
        <div data-plate-items className="mt-3 overflow-hidden lg:mt-5">
          <ul className={clsx("type-mono-s -ml-8 flex flex-wrap gap-y-1.5", inverse ? "text-bg" : "text-text")}>
            {group.items.map((item) => (
              <li key={item} className="flex">
                <span data-plate-sep aria-hidden="true" className={clsx("w-8 shrink-0 text-center", inverse ? "text-bg/40" : "text-muted")}>
                  /
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
