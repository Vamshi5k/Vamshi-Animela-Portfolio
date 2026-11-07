import type { ServiceOffer } from "./types";

// Every price term comes from the owner. Unknown terms stay { todo } and render nothing
// (content:check fails while any remains). No revisions, support periods or guarantees are offered.

/** Labels used by the Services section. */
export const serviceCopy = {
  /** Rupee sign, followed by the amount in Indian digit grouping (₹10,000). */
  currency: { INR: "₹" },
  priceOnRequest: "Price on request",
  /** Same plain wording as the Zylo label (projectCopy.frontendOnly). */
  frontendUiOnly: "Frontend UI only. No backend.",
  labels: {
    deliverables: "DELIVERABLES",
    technologies: "TECHNOLOGIES",
    price: "PRICE",
    included: "INCLUDED",
    excluded: "EXCLUDED",
    delivery: "DELIVERY",
  },
  /** Inquiry button: stores the service and scrolls to the contact section. */
  inquire: "ASK ABOUT THIS",
  /** Accessible names for the disclosure buttons' state. */
  open: "Show details",
  close: "Hide details",
} as const;

export const services: readonly ServiceOffer[] = [
  {
    id: "react-native",
    title: "React Native Mobile Development",
    description: "Mobile apps for iOS and Android built with React Native and Expo, from one TypeScript codebase.",
    deliverables: ["App screens and navigation", "REST API integration", "Local data caching"],
    technologies: ["React Native", "Expo", "TypeScript", "React Navigation", "Redux"],
    pricing: "on-request",
  },
  {
    id: "business-websites",
    title: "Business Website Development",
    description: "Static websites for businesses, with pages that adapt to phone and desktop screens.",
    deliverables: ["Responsive page layouts", "Sections for services and contact details"],
    technologies: ["Next.js", "React.js", "Tailwind CSS", "HTML5", "CSS3"],
    pricing: [
      {
        id: "static-single",
        title: "Static website, single page",
        price: { amount: 10000, currency: "INR" },
        included: ["Domain"],
        excluded: ["Deployment and hosting, charged separately"],
        delivery: { todo: "Delivery time for the single-page website" },
      },
      {
        id: "static-multi",
        title: "Static website, multipage",
        price: { amount: 15000, currency: "INR" },
        included: { todo: "What the multipage website includes" },
        excluded: ["Domain, charged separately"],
        delivery: "3 days",
      },
    ],
  },
  {
    id: "ecommerce-frontend",
    title: "E-commerce Frontend Development",
    description: "Storefront interfaces for e-commerce, such as product listings, product pages and cart screens, connected to an existing backend or API.",
    deliverables: ["REST API integration"],
    technologies: ["Next.js", "React.js", "TypeScript", "Tailwind CSS", "Redux"],
    pricing: "on-request",
  },
  {
    id: "landing-pages",
    title: "Landing Page Development",
    description: "Single landing pages for a product, a service or a campaign.",
    deliverables: ["One responsive page"],
    technologies: ["Next.js", "Tailwind CSS", "HTML5", "CSS3"],
    pricing: "on-request",
  },
  {
    id: "app-improvements",
    title: "Application Improvements",
    description: "Changes to an existing React or React Native app: fixing bugs, refining screens or adding features.",
    deliverables: ["Bug fixes", "New screens or features"],
    technologies: ["React Native", "React.js", "TypeScript"],
    pricing: "on-request",
  },
  {
    id: "performance",
    title: "Frontend Performance Optimization",
    description: "Profiling React and Next.js frontends to find slow loading and heavy rendering, then working on the causes.",
    deliverables: ["Performance profiling", "Code splitting and lazy loading"],
    technologies: ["React.js", "Next.js", "Performance Optimization and Profiling", "Code Splitting", "Lazy Loading"],
    pricing: "on-request",
  },
  {
    id: "expo-app",
    title: "Expo App Development (Frontend UI Only)",
    scopeNote: serviceCopy.frontendUiOnly,
    description: "Expo apps built as a frontend only: the app's screens and navigation, with no backend.",
    deliverables: ["App screens and navigation"],
    technologies: ["Expo", "React Native", "TypeScript", "React Navigation"],
    pricing: [
      {
        id: "expo-frontend",
        title: "Expo app, frontend UI only",
        price: "on-request",
        included: ["The app's screens and navigation, built as a frontend with no backend"],
        excluded: ["Backend"],
        delivery: { todo: "Delivery time for the Expo frontend UI app" },
      },
    ],
  },
];
