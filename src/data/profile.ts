import type { Profile } from "./types";

const name = "Vamshi Animela";
const roles = ["React Native Developer", "Frontend Engineer", "Independent Developer"];
const location = { city: "Hyderabad", country: "India", coordinates: "17.38° N 78.48° E" };

export const profile: Profile = {
  siteName: "VAMSHI.DEV",
  metaDescription: `${name}, ${roles[0]}, ${location.city}, ${location.country}.`,
  name,
  roles,
  location,
  availability: [
    { id: "relocation", label: "Open to relocation" },
    { id: "remote", label: "Remote" },
    { id: "freelance", label: "Freelance" },
  ],
  experience: { approxYears: 3, label: "About three years of experience" },
  languages: [
    { name: "English", proficiency: "Professional" },
    { name: "Telugu", proficiency: "Native" },
    { name: "Hindi", proficiency: "Conversational" },
  ],
  headline: "I build digital experiences that move businesses forward.",
  intro:
    "Building production-ready mobile applications and modern web experiences through thoughtful engineering and creative execution.",
  bio: "React Native engineer with 3+ years of experience shipping production iOS and Android apps to the App Store and Google Play from a single TypeScript codebase. I progressed from Web Developer Intern to Frontend Developer to React Native Developer at one company, and also deliver React.js and Next.js work for freelance clients in the UK and India.",
};
