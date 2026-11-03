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
    tech: ["React Native", "Expo", "Google Maps SDK", "Geolocation", "Payment Gateway"],
    screenshots: [],
    hasBackend: { todo: "Does this project have a backend?" },
    summary:
      "A cross-platform app for discovering, booking and paying for EV charging stations, with real-time availability updates. Google Maps SDK and device geolocation power station discovery and navigation, with an in-app payment workflow. Map rendering and background API polling were optimized to improve responsiveness and reduce battery usage.",
    year: 2024,
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
    tech: ["React Native", "Node.js", "Cloud Storage", "Payment Gateway"],
    screenshots: [],
    hasBackend: { todo: "Does this project have a backend?" },
    summary:
      "A mobile app for creating and sharing posters and campaign creatives, with one-tap sharing to WhatsApp, Instagram, Facebook and X. It has a template-driven editor with live preview, layering, and text and image customization, plus role-based leader and member dashboards, multilingual personalized profiles, subscription plans and payment gateway integration for tiered content access.",
    year: 2025,
  },
  {
    slug: "venue-booking",
    number: "03",
    title: "Venue Booking Application",
    category: { todo: "Project category" },
    features: ["WebSockets", "Optimistic updates", "AsyncStorage", "Drag-and-drop calendar"],
    tech: ["React Native", "WebSocket", "AsyncStorage"],
    screenshots: [],
    hasBackend: { todo: "Does this project have a backend?" },
    summary:
      "Venue discovery and booking with WebSocket-based real-time availability sync and filtering by location, price, capacity and amenities. It uses optimistic UI updates, AsyncStorage caching and a native calendar with drag-and-drop date selection.",
    year: { todo: "Year built" },
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
    year: { todo: "Year built" },
  },
];
