import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, MouseEventHandler, ReactNode } from "react";

type Variant = "primary" | "ghost";
type Size = "md" | "sm";

type CommonProps = {
  variant?: Variant;
  /** "md" (48px) for page CTAs, "sm" (36px) for the header bar. */
  size?: Size;
  /** Arrow affordance. Defaults to primary only (SPEC §4.7). */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

type LinkProps = CommonProps & { href: string; onClick?: MouseEventHandler<HTMLAnchorElement> };
type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

/** Same ring as the global :focus-visible style, applied permanently (design-system demo only). */
export const focusRingStatic = "outline-2 outline-offset-3 outline-accent outline-solid";

const base =
  "group type-mono-s inline-flex items-center justify-center select-none " +
  "transition-colors duration-(--duration-fast) ease-out active:translate-y-px";

const sizes: Record<Size, string> = {
  md: "h-12 gap-3 px-6",
  sm: "h-9 gap-2 px-4",
};

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-text",
  ghost: "border border-text text-text hover:bg-surface",
};

/** Square-cornered button (SPEC §1a hero). Renders a link when `href` is set. */
export function Button(props: LinkProps | NativeButtonProps) {
  const { variant = "primary", size = "md", arrow = variant === "primary", className, children, ...rest } = props;
  const classes = clsx(base, sizes[size], variants[variant], className);
  const content = (
    <>
      <span>{children}</span>
      {arrow && (
        <ArrowRight
          aria-hidden="true"
          className="size-4 transition-transform duration-(--duration-fast) ease-out group-hover:translate-x-1"
        />
      )}
    </>
  );

  if (typeof rest.href === "string") {
    // In-page anchors use a plain <a>: native fragment navigation, smooth via CSS scroll-behavior.
    if (rest.href.includes("#")) {
      return (
        <a href={rest.href} onClick={rest.onClick} className={classes}>
          {content}
        </a>
      );
    }
    return (
      <Link href={rest.href} onClick={rest.onClick} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" {...rest} className={classes}>
      {content}
    </button>
  );
}
