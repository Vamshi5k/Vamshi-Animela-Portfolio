"use client";

import { useEffect, type RefObject } from "react";
import { gsap } from "@/lib/gsap";
import { gsapEase, motion } from "@/lib/motion-tokens";
import { useIsTouch } from "./useIsTouch";
import { useReducedMotion } from "./useReducedMotion";

type Options = {
  /** Fraction of the pointer offset the element follows (0–1). */
  strength?: number;
};

/**
 * Pulls an element slightly toward the pointer while hovered.
 * Disabled on touch devices and under reduced motion.
 * Note: design/SPEC.md §6 lists magnetic buttons as a pattern to avoid; check before using.
 */
export function useMagnetic<T extends HTMLElement>(ref: RefObject<T | null>, { strength = 0.25 }: Options = {}) {
  const isTouch = useIsTouch();
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el || isTouch || reduced) return;

    const tween = { duration: motion.duration.base, ease: gsapEase.out };
    const toX = gsap.quickTo(el, "x", tween);
    const toY = gsap.quickTo(el, "y", tween);

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      toX((e.clientX - (rect.left + rect.width / 2)) * strength);
      toY((e.clientY - (rect.top + rect.height / 2)) * strength);
    };
    const onLeave = () => {
      toX(0);
      toY(0);
    };

    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
      gsap.set(el, { x: 0, y: 0 });
    };
  }, [ref, isTouch, reduced, strength]);
}
