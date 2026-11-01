import type { SkillGroup } from "./types";

export const skills: readonly SkillGroup[] = [
  { id: "mobile", label: "Mobile", items: ["React Native", "Android", "iOS"] },
  {
    id: "frontend",
    label: "Frontend",
    items: ["React.js", "Next.js", "TypeScript", "JavaScript"],
  },
  { id: "state", label: "State", items: ["Redux", "Context API"] },
  {
    id: "integration",
    label: "Integration",
    items: ["REST APIs", "Axios", "Fetch", "WebSockets"],
  },
  {
    id: "platform",
    label: "Platform",
    items: ["Xcode", "Android Studio", "App Store Connect", "Google Play Console"],
  },
  {
    id: "additional",
    label: "Additional",
    items: ["Google Maps", "Geolocation", "Payment Integrations", "Animations and Gestures"],
  },
];
