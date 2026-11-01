"use client";

import clsx from "clsx";
import { AnimatePresence, motion as m } from "motion/react";
import { useEffect, useLayoutEffect, useRef, type MouseEvent, type RefObject } from "react";
import { flushSync } from "react-dom";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { Link } from "@/data/types";
import { ui } from "@/data/ui";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { anchorId } from "@/lib/anchors";
import { formatItemNumber } from "@/lib/format";
import { motion } from "@/lib/motion-tokens";

export const MOBILE_MENU_ID = "mobile-menu";

type Props = {
  open: boolean;
  /** `restoreFocus`: return focus to the toggle (Escape); not after navigating to a section. */
  onClose: (restoreFocus: boolean) => void;
  toggleRef: RefObject<HTMLButtonElement | null>;
  items: readonly Link[];
  cta: Link;
  activeId: string;
};

const FOCUSABLE = "a[href], button:not([disabled])";

/**
 * Full-screen mobile menu (SPEC §1: header, mobile). Dialog with focus trap (toggle + menu),
 * Escape to close, body scroll lock, rest of the page inert, closes on navigation.
 */
export function MobileMenu({ open, onClose, toggleRef, items, cta, activeId }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Scroll lock + inert page. Layout effect so the cleanup runs synchronously inside flushSync,
  // before a menu link scrolls the page.
  useLayoutEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const main = document.getElementById("main");
    const scrollbar = window.innerWidth - html.clientWidth;
    const prev = { overflow: html.style.overflow, paddingRight: html.style.paddingRight };
    html.style.overflow = "hidden";
    if (scrollbar > 0) html.style.paddingRight = `${scrollbar}px`;
    main?.setAttribute("inert", "");
    return () => {
      html.style.overflow = prev.overflow;
      html.style.paddingRight = prev.paddingRight;
      main?.removeAttribute("inert");
    };
  }, [open]);

  // Initial focus, focus trap and Escape.
  useEffect(() => {
    if (!open) return;
    dialogRef.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose(true);
        return;
      }
      if (e.key !== "Tab") return;
      const nodes = [toggleRef.current, ...(dialogRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE) ?? [])].filter(
        (n): n is HTMLElement => n !== null,
      );
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const current = document.activeElement as HTMLElement | null;
      const inside = current !== null && nodes.includes(current);
      if (e.shiftKey && (current === first || !inside)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (current === last || !inside)) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, toggleRef]);

  const navigate = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    const target = document.getElementById(anchorId(href));
    if (!target) return; // not on this page: let the browser navigate
    e.preventDefault();
    flushSync(() => onClose(false)); // unlock scroll before moving
    window.history.pushState(null, "", `#${target.id}`);
    target.scrollIntoView(); // smooth via CSS scroll-behavior unless reduced motion
    // The menu link is gone, so continue keyboard navigation from the section, not <body>.
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  const panel = reduced ? { duration: 0 } : { duration: motion.duration.base, ease: motion.ease.out };
  const item = (i: number) =>
    reduced ? { duration: 0 } : { duration: motion.duration.slow, ease: motion.ease.out, delay: 0.08 + i * motion.stagger };

  return (
    <AnimatePresence>
      {open && (
        <m.div
          ref={dialogRef}
          id={MOBILE_MENU_ID}
          role="dialog"
          aria-modal="true"
          aria-label={ui.menuDialog}
          className="fixed inset-0 -z-10 flex flex-col overflow-y-auto bg-bg pt-(--header-h) lg:hidden"
          initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
          animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
          exit={{ clipPath: "inset(0% 0% 100% 0%)" }}
          transition={panel}
        >
          <Container className="flex flex-1 flex-col justify-between gap-12 py-8">
            <ul>
              {items.map((link, i) => {
                const active = anchorId(link.href) === activeId;
                return (
                  <m.li
                    key={link.href}
                    className="border-t border-rule"
                    initial={{ opacity: 0, y: reduced ? 0 : motion.revealDistance }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={item(i)}
                  >
                    <a
                      href={link.href}
                      onClick={(e) => navigate(e, link.href)}
                      aria-current={active ? "location" : undefined}
                      className="flex items-baseline gap-4 py-4"
                    >
                      <span className="type-mono-xs flex w-20 shrink-0 items-center gap-2 whitespace-nowrap text-muted">
                        <span aria-hidden="true" className={clsx("h-px w-3", active ? "bg-accent" : "bg-transparent")} />
                        {formatItemNumber(i + 1, items.length)}
                      </span>
                      <span className="type-display-l uppercase">{link.label}</span>
                    </a>
                  </m.li>
                );
              })}
            </ul>
            <Button href={cta.href} onClick={(e) => navigate(e, cta.href)} className="w-full">
              {cta.label}
            </Button>
          </Container>
        </m.div>
      )}
    </AnimatePresence>
  );
}
