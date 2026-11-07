"use client";

import { ArrowUp } from "lucide-react";
import { useSyncExternalStore, type MouseEvent } from "react";
import { anchorId } from "@/lib/anchors";

const noopSubscribe = () => () => {};
const clientYear = () => new Date().getFullYear();
/**
 * Copyright mark and year. The HTML carries the mark and the build-time year (`fallback`, cached on the
 * server), so the line is complete without JavaScript; after hydration the client reads the current year
 * (cacheComponents: the client snapshot is never read during render on the server or in the prerender).
 */
export function FooterYear({ mark, fallback }: { mark: string; fallback: number }) {
  const year = useSyncExternalStore(noopSubscribe, clientYear, () => fallback);
  return (
    <span data-footer-year={year}>
      {mark} {year}
    </span>
  );
}

/**
 * Back to top: scrolls to the hero (smooth via CSS scroll-behavior, instant under reduced motion) and moves
 * focus there so keyboard navigation restarts at the top. Without JS it is a plain in-page link.
 * The footer's single lime element.
 */
export function BackToTop({ href, label }: { href: string; label: string }) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    const target = document.getElementById(anchorId(href));
    if (!target) return;
    e.preventDefault();
    window.history.pushState(null, "", `#${target.id}`);
    target.scrollIntoView();
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };
  return (
    <a href={href} onClick={onClick} data-back-to-top className="group inline-flex items-center gap-2 text-accent">
      {label}
      <ArrowUp aria-hidden="true" strokeWidth={1.5} className="size-3.5 transition-transform duration-(--duration-base) ease-(--ease-out) group-hover:-translate-y-0.5" />
    </a>
  );
}
