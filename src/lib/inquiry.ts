"use client";

import { useSyncExternalStore } from "react";

// Shared inquiry state: the service a visitor asked about from the Services section. The contact form
// (a later prompt) reads it with useInquiry() to preselect the service. Kept for the session.

const KEY = "vamshi.inquiry";
const listeners = new Set<() => void>();
let current: string | null = null;

function read(): string | null {
  if (current !== null) return current;
  try {
    current = window.sessionStorage.getItem(KEY);
  } catch {
    current = null;
  }
  return current;
}

export function setInquiry(serviceId: string): void {
  current = serviceId;
  try {
    window.sessionStorage.setItem(KEY, serviceId);
  } catch {
    // Storage blocked: the in-memory value still works for this page.
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** The service id chosen in Services, or null. Null on the server and before hydration. */
export function useInquiry(): string | null {
  return useSyncExternalStore(subscribe, read, () => null);
}
