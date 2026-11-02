import clsx from "clsx";
import type { ReactNode } from "react";
import { ui } from "@/data/ui";
import { formatFigure } from "@/lib/format";

type Placement = "outside" | "inside" | "responsive";

type Props = {
  children: ReactNode;
  /** Figure number for the caption ("FIG. 00"). */
  figure?: number;
  /** Caption text from src/data. */
  caption?: string;
  /**
   * "outside": marks sit 8px beyond the edge (SPEC §4.3).
   * "inside": marks sit 8px within the edge; use for full-bleed images so marks never cause overflow.
   * "responsive": inside below lg (full-bleed mobile banners), outside from lg.
   */
  placement?: Placement;
  className?: string;
  /** Extra classes for the marks layer (e.g. a data hook for motion). */
  marksClassName?: string;
  /** Extra classes for the two bottom corner marks only (e.g. hide where text overlaps them). */
  bottomMarksClassName?: string;
  captionClassName?: string;
};

const corners = [
  "top-0 left-0 border-t border-l",
  "top-0 right-0 border-t border-r",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
];

const inset: Record<Placement, string> = {
  outside: "-inset-2",
  inside: "inset-2",
  responsive: "inset-2 lg:-inset-2",
};

/** Corner-mark frame used on every image and pending plate (SPEC §4.3). */
export function CropMarks({
  children,
  figure,
  caption,
  placement = "outside",
  className,
  marksClassName,
  bottomMarksClassName,
  captionClassName,
}: Props) {
  const hasCaption = figure !== undefined || caption;
  return (
    <figure className={clsx("relative", className)}>
      <div className="relative">
        {children}
        <div aria-hidden="true" className={clsx("pointer-events-none absolute", inset[placement], marksClassName)}>
          {corners.map((c) => (
            <span
              key={c}
              className={clsx("absolute size-3 border-muted", c, c.startsWith("bottom") && bottomMarksClassName)}
            />
          ))}
        </div>
      </div>
      {hasCaption && (
        <figcaption className={clsx("type-mono-xs mt-4 text-muted", captionClassName)}>
          {figure !== undefined && `${ui.figure} ${formatFigure(figure)}`}
          {figure !== undefined && caption && " — "}
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
