"use client";

import { useMediaQuery } from "./useMediaQuery";

/** True on devices whose primary pointer is coarse (touch). `false` until hydrated. */
export function useIsTouch(): boolean {
  return useMediaQuery("(pointer: coarse)");
}
