import type { SectionMeta } from "./types";

// Numbered sections (SPEC §1a). The hero, marquee and footer are unnumbered.
export const sections: readonly SectionMeta[] = [
  { id: "work", index: 1, label: "SELECTED WORK" },
  { id: "experience", index: 2, label: "EXPERIENCE" },
  { id: "expertise", index: 3, label: "EXPERTISE" },
  { id: "services", index: 4, label: "SERVICES" },
  { id: "clients", index: 5, label: "CLIENTS" },
  { id: "about", index: 6, label: "ABOUT" },
  { id: "contact", index: 7, label: "CONTACT" },
];
