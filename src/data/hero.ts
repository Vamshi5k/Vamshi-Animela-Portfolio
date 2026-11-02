import type { Hero } from "./types";

export const hero: Hero = {
  primary: { label: "LET'S WORK TOGETHER", href: "/#contact" },
  secondary: { label: "EXPLORE MY WORK", href: "/#work" },
  scrollCue: "SCROLL",
  portrait: {
    src: "/images/vamshi-portrait-v2.webp",
    width: 1086,
    height: 1448,
    alt: "Portrait of Vamshi Animela",
    // Crops for the 1086×1448 (3:4) portrait. Face centre ≈ (530, 500): every crop keeps the full
    // head with headroom. Recompute if the photo changes.
    crop: {
      mobile: { x: 0, y: 0, width: 1086, height: 1358 }, // 4:5, full-bleed banner
      tablet: { x: 0, y: 100, width: 1086, height: 1086 }, // 1:1 banner
      desktop: { x: 0, y: 0, width: 1086, height: 1448 }, // 3:4 plate: the whole image
    },
  },
};
