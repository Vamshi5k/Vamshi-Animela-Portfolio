import clsx from "clsx";

/** Full-width hairline with a registration mark at each end (SPEC §4.1). Decorative. */
export function SectionRule({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={clsx("type-mono-xs flex items-center gap-2 text-muted", className)}>
      <span>+</span>
      <span className="h-px flex-1 bg-rule" />
      <span>+</span>
    </div>
  );
}
