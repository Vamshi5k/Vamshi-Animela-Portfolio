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
        <div className="type-mono-xs mt-3 flex items-baseline gap-4 text-muted">
          <span className="text-text">{formatSectionIndex(index)}</span>
          <h2 id={labelId} className="type-mono-xs">
            {label}
          </h2>
          {meta && <span className="ml-auto">{meta}</span>}
        </div>
      </Container>
      {children}
    </section>
  );
}
