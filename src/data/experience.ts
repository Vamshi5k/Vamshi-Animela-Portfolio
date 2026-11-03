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
        end: { todo: "End date (Nov 2023, when the full-time role started?)" },
        description: { todo: "Role description" },
      },
      {
        title: "Frontend Developer",
        employmentType: "Full-time",
        start: "2023-11",
        end: { todo: "End date (Nov 2024, when the React Native role started?)" },
        description: { todo: "Role description" },
      },
      {
        title: "React Native Developer",
        employmentType: { todo: "Employment type" },
        start: "2024-11",
        end: "present",
        description: { todo: "Role description" },
      },
    ],
  },
];
