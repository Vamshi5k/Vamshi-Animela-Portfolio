"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type HeaderScroll = {
  /** Past the very top: show the border and solid background. */
  scrolled: boolean;
  /** Far enough down to use the condensed bar height. */
  condensed: boolean;
  /** Last decisive scroll was downward (and we are past the hide threshold). */
  hidden: boolean;
  /**
   * Keep the bar visible through the scroll that follows an in-page navigation (nav link, menu item),
   * so the control just used does not disappear. Released once scrolling settles.
   */
  hold: () => void;
};

const SCROLLED_AT = 8;
const CONDENSED_AT = 48;
const HIDE_AFTER = 160;
/** Pixels of travel in one direction before the bar changes state, so small jitters do nothing. */
const DIRECTION_THRESHOLD = 12;
/** Fallback for browsers without `scrollend`: scrolling counts as settled after this quiet period. */
const SETTLE_MS = 150;

type State = Omit<HeaderScroll, "hold">;
const initial: State = { scrolled: false, condensed: false, hidden: false };

/** Scroll-derived header state. Client-only; starts at the top-of-page state for SSR. */
export function useHeaderScroll(): HeaderScroll {
  const [state, setState] = useState(initial);
  const held = useRef(false);

  const hold = useCallback(() => {
    held.current = true;
    setState((prev) => (prev.hidden ? { ...prev, hidden: false } : prev));
  }, []);

  useEffect(() => {
    let anchorY = window.scrollY;
    let hidden = false;
    let frame = 0;
    let settleTimer = 0;

    // Only ends an active hold. It must not touch anchorY otherwise: `scrollend` can fire before the
    // rAF update of a discrete scroll step (wheel notch, PageDown) and would erase the direction.
    const release = () => {
      if (!held.current) return;
      held.current = false;
      anchorY = window.scrollY;
    };

    const update = () => {
      frame = 0;
      const y = Math.max(0, window.scrollY);
      const delta = y - anchorY;
      if (held.current || y < HIDE_AFTER) {
        hidden = false;
        anchorY = y;
      } else if (delta > DIRECTION_THRESHOLD) {
        hidden = true;
        anchorY = y;
      } else if (delta < -DIRECTION_THRESHOLD) {
        hidden = false;
        anchorY = y;
      }
      const next = { scrolled: y > SCROLLED_AT, condensed: y > CONDENSED_AT, hidden };
      setState((prev) =>
        prev.scrolled === next.scrolled && prev.condensed === next.condensed && prev.hidden === next.hidden ? prev : next,
      );
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
      if (held.current) {
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(release, SETTLE_MS);
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", release);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", release);
      cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
    };
  }, []);

  return { ...state, hold };
}
