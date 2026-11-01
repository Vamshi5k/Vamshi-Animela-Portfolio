import type { Education } from "./types";

export const education: Education = {
  degrees: [
    {
      degree: "B.Tech",
      field: "Electronics and Communication Engineering",
      institution: "Annamacharya Institute of Technology and Sciences",
      year: 2022,
    },
  ],
  credentials: [
    { kind: "certificate", title: "Frontend Developer", issuer: "Ace Web Academy" },
    { kind: "learning", title: "React Native", providers: ["Udemy", "freeCodeCamp"] },
  ],
};
