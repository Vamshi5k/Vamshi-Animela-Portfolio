// Motion tokens shared by GSAP and CSS.
// Mirrors the --duration-* and --ease-* variables in src/app/globals.css; keep both in sync.
// /dev/design-system compares the two at runtime and flags any mismatch.

/** Cubic-bezier control points. */
type Bezier = readonly [number, number, number, number];

export const motion = {
  /** Seconds (GSAP). CSS uses the same values in ms. */
  duration: {
    instant: 0.12,
    fast: 0.2,
    base: 0.4,
    slow: 0.7,
    /** Upper bound for the hero intro timeline (SPEC §1a). */
    intro: 1.4,
  },
  ease: {
    out: [0.16, 1, 0.3, 1],
    inOut: [0.65, 0, 0.35, 1],
    in: [0.7, 0, 0.84, 0],
  } satisfies Record<string, Bezier>,
  /** Seconds between staggered items. */
  stagger: 0.06,
  /** Durations are multiplied by this on touch devices (SPEC §1a: "lighter motion on touch"). */
  touchFactor: 0.6,
  /** Pixels travelled by Reveal. */
  revealDistance: 24,
} as const;

export type EaseToken = keyof typeof motion.ease;

/** GSAP ease names registered with CustomEase in src/lib/gsap.ts. */
export const gsapEase: Record<EaseToken, string> = {
  out: "token-out",
  inOut: "token-in-out",
  in: "token-in",
};

export const cssEase = (token: EaseToken) => `cubic-bezier(${motion.ease[token].join(", ")})`;
