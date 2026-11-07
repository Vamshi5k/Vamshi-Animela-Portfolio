import clsx from "clsx";
import type { ReactNode } from "react";
import { formatSectionIndex } from "@/lib/format";
import { Container } from "./Container";
import { SectionRule } from "./SectionRule";

type Props = {
  id: string;
  index: number;
  label: string;
  /** Right-hand count derived from data, e.g. "04 PROJECTS". */
  meta?: string;
  className?: string;
  /** Rendered after the header row; wrap in Container unless the section is full-bleed. */
  children?: ReactNode;
};

/** Numbered section with the header-rule motif (SPEC §4.1). The label is the section's h2. */
export function Section({ id, index, label, meta, className, children }: Props) {
  const labelId = `${id}-label`;
  return (
    <section
      id={id}
      aria-labelledby={labelId}
      className={clsx("scroll-mt-(--header-h) py-(--section-pad)", className)}
    >
      <Container>
        <SectionRule />
        {/* Phones: the meta drops to its own line under the index and label; from 768 it sits right-aligned. */}
        <div className="type-mono-xs mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1.5 text-muted">
          <span className="text-text">{formatSectionIndex(index)}</span>
          <h2 id={labelId} className="type-mono-xs">
            {label}
          </h2>
          {meta && <span data-section-meta className="basis-full md:ml-auto md:basis-auto">{meta}</span>}
        </div>
      </Container>
      {children}
    </section>
  );
}
