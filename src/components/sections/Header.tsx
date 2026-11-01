"use client";

import clsx from "clsx";
import { LayoutGroup, MotionConfig, motion as m } from "motion/react";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type MouseEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { nav } from "@/data/nav";
import { profile } from "@/data/profile";
import { sections } from "@/data/sections";
import { ui } from "@/data/ui";
import { useActiveSection } from "@/hooks/useActiveSection";
import { useHeaderScroll } from "@/hooks/useHeaderScroll";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { anchorId } from "@/lib/anchors";
import { formatSectionIndex } from "@/lib/format";
import { motion } from "@/lib/motion-tokens";
import { MOBILE_MENU_ID, MobileMenu } from "./MobileMenu";

/** Page order: the hero (first nav item) followed by the numbered sections. */
const homeId = anchorId(nav.items[0].href);
const sectionIds = [homeId, ...sections.map((s) => s.id)];
const navIds = nav.items.map((i) => anchorId(i.href));

/**
 * Fixed site header (SPEC §1): wordmark, current section index (desktop), nav with a moving
 * active marker, LET'S TALK. Condenses after scrolling, hides on scroll down, returns on scroll up.
 */
export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [ready, setReady] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const isDesktop = useMediaQuery("(width >= 64rem)");
  const { scrolled, condensed, hidden, hold } = useHeaderScroll();
  // `section`: what is in view (centre index). `active`: the nav item that represents it (marker).
  const { section, nav: active } = useActiveSection(sectionIds, navIds);

  // The mobile menu only exists below lg; resizing up closes it implicitly.
  const open = menuOpen && !isDesktop;
  // Never hide while the menu is open or the keyboard is inside the bar.
  const isHidden = hidden && !open && !focusWithin;
  const current = sections.find((s) => s.id === section);

  useEffect(() => {
    // Marks the header as hydrated (used by scripts/nav-check.mjs).
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const closeMenu = useCallback((restoreFocus: boolean) => {
    setMenuOpen(false);
    if (restoreFocus) toggleRef.current?.focus();
  }, []);

  const onBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false);
  };

  // Any in-page link in the bar or menu: keep the bar visible through the resulting scroll.
  const onClickCapture = (e: MouseEvent<HTMLElement>) => {
    if ((e.target as Element).closest('a[href*="#"]')) hold();
  };

  return (
    <MotionConfig reducedMotion="user">
      <header
        data-ready={ready || undefined}
        data-hidden={isHidden}
        onFocus={() => setFocusWithin(true)}
        onBlur={onBlur}
        onClickCapture={onClickCapture}
        // `transform: none` while shown: a transform would trap the fixed mobile menu inside the bar.
        style={{ transform: isHidden ? "translateY(-100%)" : undefined }}
        className={clsx(
          "fixed inset-x-0 top-0 z-40 border-b transition-[transform,background-color,border-color] duration-(--duration-base) ease-out",
          scrolled || open ? "border-rule bg-bg" : "border-transparent bg-transparent",
        )}
      >
        <Container
          className={clsx(
            "relative flex items-center gap-6 transition-[height] duration-(--duration-base) ease-out",
            condensed && !open ? "h-12" : "h-(--header-h)",
          )}
        >
          <a href={nav.items[0].href} className="type-mono-s shrink-0 text-text">
            {profile.siteName}
          </a>

          {/* Current section index (SPEC §4.6); the section headings carry the same information. */}
          <p
            aria-hidden="true"
            data-section-index={section}
            className="type-mono-xs absolute left-1/2 hidden -translate-x-1/2 text-muted xl:block"
          >
            {current && (
              <>
                <span className="text-accent">{formatSectionIndex(current.index)}</span> / {current.label}
              </>
            )}
          </p>

          <nav aria-label={ui.primaryNav} className="ml-auto hidden lg:block">
            <LayoutGroup>
              <ul className="flex items-center gap-6">
                {nav.items.map((item) => {
                  const isActive = anchorId(item.href) === active;
                  return (
                    <li key={item.href} className="relative">
                      <a
                        href={item.href}
                        aria-current={isActive ? "location" : undefined}
                        className="type-mono-s block py-2 text-text"
                      >
                        {item.label}
                      </a>
                      {isActive && (
                        <m.span
                          layoutId="nav-marker"
                          data-nav-marker
                          aria-hidden="true"
                          // Text colour, not accent: SPEC §4.5 budget (CTA + section index already use accent).
                          className="absolute inset-x-0 bottom-0 h-0.5 bg-text"
                          transition={{ duration: motion.duration.base, ease: motion.ease.out }}
                        />
                      )}
                    </li>
                  );
                })}
              </ul>
            </LayoutGroup>
          </nav>

          {/* Wrapper owns visibility: Button's own inline-flex would override a `hidden` class on it. */}
          <div className="hidden lg:block">
            <Button href={nav.cta.href} size="sm">
              {nav.cta.label}
            </Button>
          </div>

          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls={MOBILE_MENU_ID}
            onClick={() => (open ? closeMenu(false) : setMenuOpen(true))}
            className="type-mono-s -mr-3 ml-auto flex h-11 items-center px-3 text-text lg:hidden"
          >
            {open ? ui.menuClose : ui.menuOpen}
          </button>
        </Container>

        <MobileMenu
          open={open}
          onClose={closeMenu}
          toggleRef={toggleRef}
          items={nav.items}
          cta={nav.cta}
          activeId={active}
        />
      </header>
    </MotionConfig>
  );
}
