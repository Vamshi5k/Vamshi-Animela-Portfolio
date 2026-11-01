import clsx from "clsx";

// Static fractal noise as an inline SVG tile. No canvas, no animation.
const noise =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E" +
  "%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E" +
  "%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E" +
  "%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

type Props = {
  opacity?: number;
  /** Cover the viewport instead of the nearest positioned ancestor. */
  fixed?: boolean;
  className?: string;
};

/**
 * Subtle film grain overlay. Decorative and non-interactive.
 * SPEC §6 rules out a global grain overlay; use only where a section calls for it.
 */
export function Grain({ opacity = 0.06, fixed = false, className }: Props) {
  return (
    <div
      aria-hidden="true"
      className={clsx("pointer-events-none inset-0", fixed ? "fixed z-40" : "absolute", className)}
      style={{ backgroundImage: noise, backgroundSize: "160px 160px", opacity }}
    />
  );
}
