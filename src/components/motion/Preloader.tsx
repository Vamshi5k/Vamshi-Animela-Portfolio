import { profile } from "@/data/profile";
import { formatSectionIndex } from "@/lib/format";

/** Runs before first paint: a repeat visit in the same session skips the intro (no flash, no JS wait). */
export const introScript = `try{var k="vamshi.intro",d=document.documentElement;if(sessionStorage.getItem(k))d.dataset.intro="seen";else sessionStorage.setItem(k,"1")}catch(e){}`;

/**
 * Preloader (SPEC §4.9): the film leader. A CSS-only intro, about 1.6s, once per session: on black, crop marks
 * slide in from the corners, the wordmark opens through a projector-gate slit, a lime rim-light hairline sweeps
 * under it and the coordinates rise in; then the frame lifts (clip-path) and the hero's own entrance plays as it
 * is revealed. No fake progress: it shows nothing it cannot know. Hidden by default and only shown by its
 * animation, so reduced motion, no JavaScript, repeat visits and animation-free captures never see it. It never
 * blocks input (pointer-events: none) and is aria-hidden; all content is in the page underneath.
 */
export function Preloader() {
  const { siteName, location } = profile;
  return (
    <div aria-hidden="true" data-preloader className="preloader">
      <span className="pl-mark pl-mark-tl" />
      <span className="pl-mark pl-mark-tr" />
      <span className="pl-mark pl-mark-bl" />
      <span className="pl-mark pl-mark-br" />
      <div className="pl-stage">
        <p className="pl-index type-mono-xs">{formatSectionIndex(0)}</p>
        <p className="pl-word">{siteName}</p>
        <span className="pl-rim" />
        <p className="pl-coords type-mono-xs">
          {location.city}, {location.country} · {location.coordinates}
        </p>
      </div>
    </div>
  );
}
