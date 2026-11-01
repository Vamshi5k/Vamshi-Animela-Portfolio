import clsx from "clsx";
import type { ReactNode } from "react";

type Props = {
  as?: "div" | "header" | "footer" | "nav";
  className?: string;
  children: ReactNode;
};

/** Page-width wrapper: max 1440 including the responsive outer margin (SPEC §1). */
export function Container({ as: Tag = "div", className, children }: Props) {
  return (
    <Tag className={clsx("mx-auto w-full max-w-page px-(--margin)", className)}>{children}</Tag>
  );
}
