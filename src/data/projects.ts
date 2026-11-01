import type { Project } from "./types";

export const projectCopy = {
  /** Must be shown on every project where `hasBackend === false`. */
  frontendOnly: "Frontend only. No backend.",
} as const;

export const projects: readonly Project[] = [
  {
    slug: "ev-charging-finder",
    number: "01",
    title: "EV Charging Station Finder",
    category: { todo: "Project category" },
    features: ["Station discovery", "Booking", "Payment", "Map rendering", "Availability polling"],
    tech: { todo: "Tech stack used" },
    screenshots: [],
    hasBackend: { todo: "Does this project have a backend?" },
    summary: { todo: "Project summary" },
  },
  {
    slug: "poster-campaigns",
    number: "02",
    title: "Poster Creation & Campaign Management",
    category: { todo: "Project category" },
    features: [
      "Template editor",
      "Live preview",
      "Social sharing",
      "Subscriptions",
      "Role-based access",
    ],
    tech: { todo: "Tech stack used" },
    screenshots: [],
    hasBackend: { todo: "Does this project have a backend?" },
    summary: { todo: "Project summary" },
  },
  {
    slug: "venue-booking",
    number: "03",
    title: "Venue Booking Application",
    category: { todo: "Project category" },
    features: ["WebSockets", "Optimistic updates", "AsyncStorage", "Drag-and-drop calendar"],
    tech: { todo: "Tech stack used" },
    screenshots: [],
    hasBackend: { todo: "Does this project have a backend?" },
    summary: { todo: "Project summary" },
  },
  {
    slug: "zylo",
    number: "04",
    title: "Zylo E-commerce Application",
    category: { todo: "Project category" },
    features: [],
    tech: { todo: "Tech stack used" },
    screenshots: [],
    hasBackend: false,
    summary: { todo: "Project summary" },
  },
];
