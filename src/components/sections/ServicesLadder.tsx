"use client";

import { LayoutGroup, MotionConfig, motion as m } from "motion/react";
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { serviceCopy } from "@/data/services";
import type {
  Content,
  Money,
  ServiceOffer,
  ServicePackage,
} from "@/data/types";
import { isTodo } from "@/lib/content";
import { formatItemNumber } from "@/lib/format";
import { setInquiry } from "@/lib/inquiry";
import { motion } from "@/lib/motion-tokens";
import { ServicePictogram } from "./ServicePictogram";

const known = <T,>(v: Content<T>): T | null => (isTodo(v) ? null : v);
/** Known items of a list that may itself be a TODO or contain TODO items. */
const knownList = (v: Content<readonly Content<string>[]>): string[] =>
  isTodo(v) ? [] : v.filter((x): x is string => !isTodo(x));
const groupIN = new Intl.NumberFormat("en-IN");
const formatPrice = (p: Money | "on-request") =>
  p === "on-request"
    ? serviceCopy.priceOnRequest
    : `${serviceCopy.currency[p.currency]}${groupIN.format(p.amount)}`;

const layoutTransition = {
  duration: motion.duration.base,
  ease: motion.ease.out,
};

/**
 * Services (SPEC §1a): the descending ladder. Each row's title starts one column further right. A title is a
 * disclosure button (aria-expanded / aria-controls); one service is open at a time. Opening one compresses the
 * others into hairlines with only their numbers, expands the open title, and draws its line-art pictogram
 * (SVG stroke, CSS). Row movement and the title growth are Framer Motion layout transitions (transforms).
 * Without JS every panel is visible (CSS hides closed panels only when scripting is on).
 */
export function ServicesLadder({
  services,
}: {
  services: readonly ServiceOffer[];
}) {
  const [open, setOpen] = useState<string | null>(null);
  const baseId = useId();
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" && open) {
      const id = open;
      setOpen(null);
      buttons.current[id]?.focus();
    }
  };

  const inquire = (id: string) => {
    setInquiry(id);
    const target = document.getElementById("contact");
    if (!target) return;
    target.scrollIntoView(); // smooth via CSS scroll-behavior unless reduced motion
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  return (
    <MotionConfig reducedMotion="user" transition={layoutTransition}>
      <LayoutGroup>
        <ol
          className="svc border-b border-rule"
          data-any-open={open ? "" : undefined}
          onKeyDown={onKeyDown}
        >
          {services.map((s, i) => {
            const isOpen = open === s.id;
            const state = isOpen ? "open" : open ? "compressed" : "closed";
            const btnId = `${baseId}-btn-${s.id}`;
            const panelId = `${baseId}-panel-${s.id}`;
            const description = known(s.description);
            const deliverables = known(s.deliverables) ?? [];
            const technologies = known(s.technologies) ?? [];
            const pricing = known(s.pricing);
            return (
              <m.li
                layout="position"
                key={s.id}
                data-service={s.id}
                data-state={state}
                className="svc-row border-t border-rule"
                style={{ "--step": i } as CSSProperties}
              >
                <h3 className="layout-grid">
                  <button
                    ref={(el) => {
                      buttons.current[s.id] = el;
                    }}
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : s.id)}
                    className="svc-trigger group text-left"
                  >
                    <m.span
                      layout="position"
                      className="svc-num type-mono-xs block"
                    >
                      {formatItemNumber(i + 1, services.length)}
                    </m.span>
                    <m.span layout className="svc-title">
                      {s.title}
                    </m.span>
                    {s.scopeNote && (
                      <m.span
                        layout="position"
                        data-scope-note
                        className="svc-stamp type-mono-xs"
                      >
                        {s.scopeNote}
                      </m.span>
                    )}
                  </button>
                </h3>

                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={btnId}
                  data-open={isOpen || undefined}
                  className="svc-panel"
                >
                  {/* Grid on an inner wrapper: a display utility on the panel itself would override its closed display:none. */}
                  <div className="svc-panel-grid layout-grid">
                    <div className="svc-picto-box col-span-2 md:col-span-2 lg:col-span-3">
                      <ServicePictogram id={s.id} />
                    </div>
                    <div className="col-span-full md:col-span-6 lg:col-span-5">
                      {description && (
                        <p className="type-body-l max-w-measure text-text">
                          {description}
                        </p>
                      )}
                      {deliverables.length > 0 && (
                        <div className="mt-8">
                          <p className="type-mono-xs text-muted">
                            {serviceCopy.labels.deliverables}
                          </p>
                          <ul className="type-mono-s mt-3 space-y-1 text-text">
                            {deliverables.map((d) => (
                              <li key={d}>— {d}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {technologies.length > 0 && (
                        <div className="mt-6">
                          <p className="type-mono-xs text-muted">
                            {serviceCopy.labels.technologies}
                          </p>
                          <p className="type-mono-s mt-3 text-text">
                            {technologies.join(" · ")}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="col-span-full md:col-span-8 lg:col-span-4">
                      <p className="type-mono-xs text-muted">
                        {serviceCopy.labels.price}
                      </p>
                      <div className="mt-3 border-b border-rule">
                        {pricing === "on-request" && (
                          <PriceLine
                            title={null}
                            price={serviceCopy.priceOnRequest}
                          />
                        )}
                        {Array.isArray(pricing) &&
                          pricing.map((pkg) => (
                            <PackageItem key={pkg.id} pkg={pkg} />
                          ))}
                      </div>
                      <button
                        type="button"
                        data-inquire={s.id}
                        onClick={() => inquire(s.id)}
                        className="svc-cta type-mono-s mt-6"
                      >
                        {serviceCopy.inquire}
                        <span aria-hidden="true" className="svc-cta-arrow">
                          →
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </m.li>
            );
          })}
        </ol>
      </LayoutGroup>
    </MotionConfig>
  );
}

function PriceLine({ title, price }: { title: string | null; price: string }) {
  return (
    <p className="type-mono-s flex items-baseline gap-4 border-t border-rule py-3">
      {title && <span className="text-text">{title}</span>}
      <span data-price className="ml-auto shrink-0 text-right whitespace-nowrap text-text">
        {price}
      </span>
    </p>
  );
}

/** A ruled line item: package and price, with its included / excluded / delivery terms directly beneath. */
function PackageItem({ pkg }: { pkg: ServicePackage }) {
  const price = known(pkg.price);
  const included = knownList(pkg.included);
  const excluded = knownList(pkg.excluded);
  const delivery = known(pkg.delivery);
  const terms: [string, string][] = [
    ...included.map((t): [string, string] => [serviceCopy.labels.included, t]),
    ...excluded.map((t): [string, string] => [serviceCopy.labels.excluded, t]),
    ...(delivery
      ? [[serviceCopy.labels.delivery, delivery] as [string, string]]
      : []),
  ];
  return (
    <div data-package={pkg.id}>
      {price !== null && (
        <PriceLine title={pkg.title} price={formatPrice(price)} />
      )}
      {terms.length > 0 && (
        <dl className="type-mono-xs -mt-1 grid grid-cols-[6.5rem_1fr] gap-x-3 gap-y-1 pb-3">
          {terms.map(([label, value]) => (
            <div key={`${label}-${value}`} className="contents">
              <dt className="text-muted">{label}</dt>
              <dd className="text-text">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
