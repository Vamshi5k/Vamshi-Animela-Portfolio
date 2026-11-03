import type { Experience } from "./types";

export const experience: readonly Experience[] = [
  {
    company: "SpackDigi Solutions",
    location: "Hyderabad",
    roles: [
      {
        title: "Web Developer Intern",
        employmentType: "Internship",
        start: "2023-08",
        end: "2023-11",
        description:
          "I started at SpackDigi as a Web Developer Intern, contributing to web UI development. Within three months I was converted to a full-time role.",
      },
      {
        title: "Frontend Developer",
        employmentType: "Full-time",
        start: "2023-11",
        end: "2024-11",
        description:
          "I delivered production web applications with React.js and Next.js, with responsive layouts and SEO optimization across devices. I built reusable UI components with React Hooks, Tailwind CSS, Material UI and Styled Components, and improved page load performance with code splitting and lazy loading.",
      },
      {
        title: "React Native Developer (iOS & Android)",
        employmentType: "Full-time",
        start: "2024-11",
        end: "present",
        description:
          "I build cross-platform iOS and Android apps in React Native and TypeScript from a shared codebase, taking features from UI and API integration through to production releases on the App Store and Google Play. My work spans Redux and Context API state, REST and WebSocket integration, Google Maps, geolocation and payment flows. I also debug platform-specific issues in Xcode and Android Studio and contribute to code reviews in Agile sprints.",
      },
    ],
  },
];
