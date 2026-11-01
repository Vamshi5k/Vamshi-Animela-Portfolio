import type { Profile } from "./types";

export const profile: Profile = {
  name: "Vamshi Animela",
  roles: ["React Native Developer", "Frontend Engineer", "Independent Developer"],
  location: { city: "Hyderabad", country: "India" },
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
  headline: { todo: "Hero headline in Vamshi's own words" },
  bio: { todo: "About section bio" },
};
