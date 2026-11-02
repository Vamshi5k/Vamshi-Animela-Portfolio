import type { Hero } from "./types";

export const hero: Hero = {
  primary: { label: "LET'S WORK TOGETHER", href: "/#contact" },
  secondary: { label: "EXPLORE MY WORK", href: "/#work" },
  scrollCue: "SCROLL",
  portrait: {
    src: "/images/vamshi-portrait.webp",
    width: 900,
    height: 1600,
    // Proposed wording, pending Vamshi's approval (SPEC §5).
    alt: "Vamshi Animela in a denim shirt and dark sunglasses, looking to the side in warm window light.",
    // x ≤ 760 keeps the two-person photo (x ≥ 770) out of every crop.
    crop: {
      mobile: { x: 0, y: 590, width: 760, height: 950 }, // 4:5, full-bleed banner (SPEC §5 mobile crop)
      tablet: { x: 0, y: 600, width: 760, height: 760 }, // 1:1 banner
      desktop: { x: 0, y: 590, width: 760, height: 1013 }, // 3:4 plate
    },
  },
};
