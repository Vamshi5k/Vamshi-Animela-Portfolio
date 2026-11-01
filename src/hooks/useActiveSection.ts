"use client";

import { useEffect, useMemo, useState } from "react";

type ActiveSection = {
  /** The section actually in view (drives the header's section index). */
  section: string;
  /**
   * The nav target for that section: the section itself if it has a nav item, otherwise the last
   * nav item above it in page order (e.g. Experience and Expertise → Work, Clients → Services).
   */
  nav: string;
};

/**
 * Tracks the section crossing an activation line 40% down the viewport (IntersectionObserver).
 * Edge cases: within 8px of the top → first id; scrolled to the bottom → last id, so a short final
 * section still becomes active. `ids` must be in page order; `navIds` is the subset that has a nav
 * item. Starts at the first id on the server and before hydration.
 */
export function useActiveSection(ids: readonly string[], navIds: readonly string[]): ActiveSection {
  const [section, setSection] = useState(ids[0] ?? "");
  const key = ids.join(",");
  const navKey = navIds.join(",");

  useEffect(() => {
    const order = key.split(",");
    const crossing = new Set<string>();
    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      if (window.scrollY <= 8) return setSection(order[0]);
      if (window.scrollY + window.innerHeight >= doc.scrollHeight - 2) return setSection(order[order.length - 1]);
      const current = order.filter((id) => crossing.has(id)).at(-1);
      if (current) setSection(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) crossing.add(e.target.id);
          else crossing.delete(e.target.id);
        }
        schedule();
      },
      { rootMargin: "-40% 0px -59% 0px" },
    );
    for (const id of order) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    window.addEventListener("scroll", schedule, { passive: true });
    schedule();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      cancelAnimationFrame(frame);
    };
  }, [key]);

  const nav = useMemo(() => {
    const order = key.split(",");
    const withNav = new Set(navKey.split(","));
    for (let i = order.indexOf(section); i >= 0; i--) {
      if (withNav.has(order[i])) return order[i];
    }
    return "";
  }, [key, navKey, section]);

  return { section, nav };
}
