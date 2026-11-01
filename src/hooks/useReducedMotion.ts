"use client";

import { useMediaQuery } from "./useMediaQuery";

/** True when the user asks for reduced motion. `false` until hydrated. */
export function useReducedMotion(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
