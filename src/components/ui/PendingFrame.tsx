import { ui } from "@/data/ui";
import { CropMarks } from "./CropMarks";

type Props = {
  /** What is missing, from src/data (a TODO note or a ui.pendingWhat label). */
  what: string;
  /** CSS aspect-ratio, e.g. "4 / 3". */
  aspect?: string;
  placement?: "outside" | "inside";
  className?: string;
};

/**
 * Honest placeholder for missing content: hatched plate labelled "PENDING — <WHAT>" (SPEC §4.4).
 * Development-time only by policy: `npm run content:check` fails while any TODO remains, so a launched
 * build never contains one. It still renders in production builds so shots:prod shows the real gaps.
 */
export function PendingFrame({ what, aspect = "4 / 3", placement, className }: Props) {
  return (
    <CropMarks placement={placement} className={className}>
      <div data-pending className="hatch flex items-end border border-rule p-4" style={{ aspectRatio: aspect }}>
        <span className="type-mono-xs text-muted">
          {ui.pending} — {what}
        </span>
      </div>
    </CropMarks>
  );
}
