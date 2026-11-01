import type { Nav } from "./types";

export const nav: Nav = {
  items: [
    // Page order (see sections.ts). The header maps sections without a nav item to the item above them.
    { label: "Home", href: "/#home" },
    { label: "Work", href: "/#work" },
    { label: "Services", href: "/#services" },
    { label: "About", href: "/#about" },
    { label: "Contact", href: "/#contact" },
  ],
  cta: { label: "LET'S TALK", href: "/#contact" },
};
