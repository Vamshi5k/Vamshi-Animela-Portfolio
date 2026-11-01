import clsx from "clsx";
import type { ReactNode } from "react";
import { ui } from "@/data/ui";
import { formatFigure } from "@/lib/format";

type Props = {
  children: ReactNode;
  /** Figure number for the caption ("FIG. 00"). */
  figure?: number;
  /** Caption text from src/data. */
  caption?: string;
  /**
   * "outside": marks sit 8px beyond the edge (SPEC §4.3).
   * "inside": marks sit 8px within the edge; use for full-bleed images so marks never cause overflow.
   */
  placement?: "outside" | "inside";
  className?: string;
};

const corners = [
  "top-0 left-0 border-t border-l",
  "top-0 right-0 border-t border-r",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
];

/** Corner-mark frame used on every image and pending plate (SPEC §4.3). */
export function CropMarks({ children, figure, caption, placement = "outside", className }: Props) {
  const hasCaption = figure !== undefined || caption;
  return (
    <figure className={clsx("relative", className)}>
      <div className="relative">
        {children}
        <div
          aria-hidden="true"
          className={clsx("pointer-events-none absolute", placement === "outside" ? "-inset-2" : "inset-2")}
        >
          {corners.map((c) => (
            <span key={c} className={clsx("absolute size-3 border-muted", c)} />
          ))}
        </div>
      </div>
      {hasCaption && (
        <figcaption className="type-mono-xs mt-4 text-muted">
          {figure !== undefined && `${ui.figure} ${formatFigure(figure)}`}
          {figure !== undefined && caption && " — "}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
