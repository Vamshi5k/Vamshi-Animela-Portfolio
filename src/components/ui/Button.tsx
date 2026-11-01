import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "ghost";

type CommonProps = {
  variant?: Variant;
  /** Arrow affordance. Defaults to primary only (SPEC §4.7). */
  arrow?: boolean;
  className?: string;
  children: ReactNode;
};

type LinkProps = CommonProps & { href: string };
type NativeButtonProps = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & { href?: undefined };

/** Same ring as the global :focus-visible style, applied permanently (design-system demo only). */
export const focusRingStatic = "outline-2 outline-offset-3 outline-accent outline-solid";

const base =
  "group type-mono-s inline-flex h-12 items-center justify-center gap-3 px-6 select-none " +
  "transition-colors duration-(--duration-fast) ease-out active:translate-y-px";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-accent-ink hover:bg-text",
  ghost: "border border-text text-text hover:bg-surface",
};

/** Square-cornered button (SPEC §1a hero). Renders a Link when `href` is set. */
export function Button(props: LinkProps | NativeButtonProps) {
  const { variant = "primary", arrow = variant === "primary", className, children, ...rest } = props;
  const classes = clsx(base, variants[variant], className);
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
    return (
      <Link href={rest.href} className={classes}>
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
