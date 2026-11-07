"use client";

import clsx from "clsx";
import { LayoutGroup, MotionConfig, motion as m } from "motion/react";
import { useEffect, useState } from "react";
import { PendingFrame } from "@/components/ui/PendingFrame";
import { projectCopy } from "@/data/projects";
import type { Content, Project } from "@/data/types";
import { ui } from "@/data/ui";
import { isTodo } from "@/lib/content";
import { motion } from "@/lib/motion-tokens";

const known = <T,>(v: Content<T>): T | null => (isTodo(v) ? null : v);
const panelId = (slug: string) => `work-${slug}`;

/**
 * Selected Work (SPEC §1a): sticky index + scrolling stage. Desktop: a sticky list of the projects (cols 1–4)
 * beside one panel per project (cols 6–12), scrolling naturally; the index bar moves to the project crossing
 * the middle of the viewport (IntersectionObserver, live geometry) with a Framer Motion shared layoutId.
 * Phones and tablets: a sticky 01–04 strip under the header. Missing screenshots show an honest pending plate;
 * unknown fields render nothing. A project without a backend carries the frontend-only stamp in both places.
 */
export function WorkStage({ projects }: { projects: readonly Project[] }) {
  const [active, setActive] = useState(projects[0]?.slug ?? "");

  useEffect(() => {
    const panels = projects.map((p) => document.getElementById(panelId(p.slug))).filter((el): el is HTMLElement => !!el);
    const crossing = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const slug = (e.target as HTMLElement).dataset.workPanel ?? "";
          if (e.isIntersecting) crossing.add(slug);
          else crossing.delete(slug);
        }
        const current = projects.map((p) => p.slug).filter((s) => crossing.has(s)).at(-1);
        if (current) setActive(current);
      },
      { rootMargin: "-45% 0px -54% 0px" },
    );
    panels.forEach((p) => io.observe(p));
    return () => io.disconnect();
  }, [projects]);

  const frontendOnly = (p: Project) => known(p.hasBackend) === false;

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: motion.duration.base, ease: motion.ease.out }}>
      <LayoutGroup>
        <div className="layout-grid lg:items-start">
          {/* Phones / tablets: sticky number strip (tabs that jump to the panels). */}
          <nav aria-label={ui.workIndex} className="work-strip col-span-full lg:hidden">
            <ol className="flex gap-6">
              {projects.map((p) => (
                <li key={p.slug}>
                  <a
                    href={`#${panelId(p.slug)}`}
                    aria-current={active === p.slug ? "true" : undefined}
                    className={clsx("type-mono-s relative block py-3", active === p.slug ? "text-text" : "text-muted")}
                  >
                    {p.number}
                    {active === p.slug && <m.span layoutId="work-strip-bar" aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 bg-text" />}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Desktop: sticky index. */}
          <nav aria-label={ui.workIndex} className="work-index hidden lg:col-span-4 lg:block">
            <ol className="border-b border-rule">
              {projects.map((p) => {
                const on = active === p.slug;
                return (
                  <li key={p.slug} className="border-t border-rule">
                    <a href={`#${panelId(p.slug)}`} aria-current={on ? "true" : undefined} data-work-index={p.slug} className="group relative flex gap-4 py-4 pl-5">
                      {on && <m.span layoutId="work-index-bar" aria-hidden="true" className="absolute top-4 bottom-4 left-0 w-0.5 bg-text" />}
                      <span className={clsx("type-mono-s shrink-0 pt-0.5", on ? "text-text" : "text-muted")}>{p.number}</span>
                      <span className="flex flex-col gap-2">
                        <span className={clsx("type-body transition-colors duration-(--duration-fast)", on ? "text-text" : "text-muted group-hover:text-text")}>{p.title}</span>
                        {frontendOnly(p) && <span className="work-stamp type-mono-xs w-fit">{projectCopy.frontendOnly}</span>}
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="col-span-full lg:col-span-7 lg:col-start-6">
            {projects.map((p) => {
              const category = known(p.category);
              const year = known(p.year);
              const summary = known(p.summary);
              const tech = known(p.tech) ?? [];
              const caption = [category, year].filter((v) => v !== null).join(" · ");
              return (
                <article
                  key={p.slug}
                  id={panelId(p.slug)}
                  data-work-panel={p.slug}
                  aria-labelledby={`${panelId(p.slug)}-title`}
                  className="work-panel border-t border-rule first:border-t-0 lg:first:border-t"
                >
                  <p aria-hidden="true" className="work-number text-muted">
                    {p.number}
                  </p>
                  <h3 id={`${panelId(p.slug)}-title`} className="type-display-m mt-4 max-w-[18ch] text-balance text-text">
                    {p.title}
                  </h3>
                  {frontendOnly(p) && <p className="work-stamp type-mono-xs mt-4 w-fit">{projectCopy.frontendOnly}</p>}
                  {caption && <p className="type-mono-xs mt-4 text-muted">{caption}</p>}
                  {summary && <p className="type-body-l mt-8 max-w-measure text-text">{summary}</p>}
                  {(p.features.length > 0 || tech.length > 0) && (
                    <div className="mt-10 grid gap-8 md:grid-cols-2">
                      {p.features.length > 0 && (
                        <div>
                          <p className="type-mono-xs text-muted">{ui.workLabels.features}</p>
                          <ul className="type-mono-s mt-3 space-y-1 text-text">
                            {p.features.map((f) => (
                              <li key={f}>— {f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {tech.length > 0 && (
                        <div>
                          <p className="type-mono-xs text-muted">{ui.workLabels.tech}</p>
                          <ul className="type-mono-s mt-3 space-y-1 text-text">
                            {tech.map((t) => (
                              <li key={t}>— {t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  {p.screenshots.length === 0 && <PendingFrame what={ui.pendingWhat.screenshot} aspect="16 / 9" className="mt-12 max-w-2xl" />}
                </article>
              );
            })}
          </div>
        </div>
      </LayoutGroup>
    </MotionConfig>
  );
}
