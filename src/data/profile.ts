import type { Profile } from "./types";

const name = "Vamshi Animela";
const roles = ["React Native Developer", "Frontend Engineer", "Independent Developer"];
const location = { city: "Hyderabad", country: "India" };

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
  headline: { todo: "Hero headline in Vamshi's own words" },
  bio: { todo: "About section bio" },
};
