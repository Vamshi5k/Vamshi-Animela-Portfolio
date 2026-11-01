"use client";

import { gsap } from "gsap";
import { CustomEase } from "gsap/CustomEase";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitText } from "gsap/SplitText";
import { useGSAP } from "@gsap/react";
import { gsapEase, motion, type EaseToken } from "@/lib/motion-tokens";

// Register plugins once. Always import gsap from "@/lib/gsap", never from "gsap" directly.
gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText, CustomEase);

// Make the motion-token easings available to GSAP by name (e.g. ease: gsapEase.out).
for (const token of Object.keys(gsapEase) as EaseToken[]) {
  CustomEase.create(gsapEase[token], motion.ease[token].join(","));
}

export { gsap, ScrollTrigger, SplitText, useGSAP };
