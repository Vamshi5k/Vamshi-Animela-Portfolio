import type { Client } from "./types";

// Freelance clients (2024–present). URLs checked with a real HTTP request: 200 and the client's own site.
export const clients: readonly Client[] = [
  {
    id: "yasad",
    name: "Yasad Ltd",
    location: "UK",
    screenshot: null,
    category: "Static marketing site",
    contribution:
      "Static marketing site presenting services, testimonials and contact details; delivered end to end and deployed on Vercel",
    tech: { todo: "Tech stack used" },
    liveUrl: "https://yasad-project.vercel.app",
    urlVerified: true,
  },
  {
    id: "sr-travels",
    name: "SR Travels",
    location: "Varanasi",
    screenshot: null,
    category: "Travel, taxi and pilgrimage tour site",
    contribution: "Built the site with SEO meta tags and social previews; delivered end to end and deployed on Vercel",
    tech: { todo: "Tech stack used" },
    liveUrl: "https://sr-travels-website.vercel.app",
    urlVerified: true,
  },
  {
    id: "sree-annapurna",
    name: "Sree Annapurna Cloud Kitchen",
    screenshot: null,
    category: "Cloud kitchen website",
    contribution: "Mobile-friendly cloud kitchen website; delivered end to end and deployed on Vercel",
    tech: { todo: "Tech stack used" },
    liveUrl: "https://annapurna-cloud-kitchen.vercel.app",
    urlVerified: true,
  },
  {
    id: "manasvi-sketches",
    name: "Manasvi Sketches",
    screenshot: null,
    category: "Artist portfolio",
    contribution: "Online portfolio for an artist's sketch work; delivered end to end and deployed on Vercel",
    tech: { todo: "Tech stack used" },
    liveUrl: "https://manasvi-sketches.vercel.app",
    urlVerified: true,
  },
];
