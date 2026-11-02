"use client";

import Image from "next/image";
import { useRef, type CSSProperties } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CropMarks } from "@/components/ui/CropMarks";
import { hero } from "@/data/hero";
import { nav } from "@/data/nav";
import { profile } from "@/data/profile";
import { anchorId } from "@/lib/anchors";
import { isTodo } from "@/lib/content";
import { gsap, useGSAP } from "@/lib/gsap";
import { gsapEase } from "@/lib/motion-tokens";

const { portrait } = hero;
const { crop } = portrait;

// Crop rectangles from src/data/hero.ts → CSS variables read by the `portrait-crop` utility.
const cropVars = {
  "--src-w": portrait.width,
  "--src-h": portrait.height,
  "--m-x": crop.mobile.x,
  "--m-y": crop.mobile.y,
  "--m-w": crop.mobile.width,
  "--m-h": crop.mobile.height,
  "--t-x": crop.tablet.x,
  "--t-y": crop.tablet.y,
  "--t-w": crop.tablet.width,
  "--t-h": crop.tablet.height,
  "--d-x": crop.desktop.x,
  "--d-y": crop.desktop.y,
  "--d-w": crop.desktop.width,
  "--d-h": crop.desktop.height,
} as CSSProperties;

/**
 * Rendered image width as a share of the viewport: the crop shows `crop.width` of `portrait.width`
 * source pixels, so the image is wider than its frame. Desktop frame = 5 of 12 columns (~38vw).
 */
const overscan = (c: { width: number }) => portrait.width / c.width;
const sizes = `(min-width: 64rem) ${Math.ceil(38 * overscan(crop.desktop))}vw, ${Math.ceil(100 * overscan(crop.mobile))}vw`;

const nameLines = profile.name.split(" ");
const headline = isTodo(profile.headline) ? null : profile.headline;
const intro = isTodo(profile.intro) ? null : profile.intro;
const caption = `${profile.location.city}, ${profile.location.country} · ${profile.location.coordinates}`;

/**
 * Hero (SPEC §1a, §5). Desktop: asymmetric film frame, type in cols 1–7, portrait plate in cols 8–12.
 * Mobile/tablet: full-bleed portrait banner with the name overlapping its lower edge.
 * One <Image> serves every layout (single LCP candidate, no double download).
 *
 * Motion: the entrance is CSS (`hero-in-*` in globals.css), so it starts at first paint and nothing
 * waits for JavaScript. GSAP adds only scroll parallax and pointer depth, on desktop with a fine
 * pointer and motion allowed.
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const q = gsap.utils.selector(root);
      const mm = gsap.matchMedia();

      mm.add("(min-width: 64rem) and (pointer: fine) and (prefers-reduced-motion: no-preference)", () => {
        const plate = q('[data-hero="plate"]')[0];
        const back = q('[data-hero="back"]')[0];
        const name = q('[data-hero="name"]')[0];
        const scrub = { trigger: root, start: "top top", end: "bottom top", scrub: true };

        gsap.to(plate, { yPercent: -6, ease: "none", scrollTrigger: scrub });
        gsap.to(name, { y: 48, ease: "none", scrollTrigger: scrub });

        const tween = { duration: 0.9, ease: gsapEase.out };
        const plateX = gsap.quickTo(plate, "x", tween);
        const plateY = gsap.quickTo(plate, "y", tween);
        const backX = gsap.quickTo(back, "x", tween);
        const backY = gsap.quickTo(back, "y", tween);
        const depth = (nx: number, ny: number) => {
          // Plate leans toward the pointer, the back frame away from it: at most 7px / 5px.
          plateX(nx * 14);
          plateY(ny * 10);
          backX(nx * -10);
          backY(ny * -8);
        };
        const onMove = (e: PointerEvent) => depth(e.clientX / window.innerWidth - 0.5, e.clientY / window.innerHeight - 0.5);
        const onLeave = () => depth(0, 0);

        root.addEventListener("pointermove", onMove);
        root.addEventListener("pointerleave", onLeave);
        return () => {
          root.removeEventListener("pointermove", onMove);
          root.removeEventListener("pointerleave", onLeave);
        };
      });

      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <section
      ref={ref}
      id={anchorId(nav.items[0].href)}
      aria-labelledby="hero-name"
      className="relative scroll-mt-(--header-h) pt-(--header-h) lg:flex lg:min-h-svh lg:flex-col"
    >
      <Container className="flex flex-col lg:layout-grid lg:flex-1 lg:items-end lg:pt-8 lg:pb-20">
        {/* Type column. Mobile: overlaps the lower edge of the banner above it. */}
        <div className="relative z-10 order-2 -mt-40 flex flex-col md:-mt-44 lg:order-1 lg:col-span-7 lg:mt-0">
          {/* Text colour over the photo below lg (muted grey is too low-contrast on the banner). */}
          <p className="hero-in hero-in-rise-fade type-mono-s text-text [--d:0.15s] lg:text-muted">
            {profile.roles.join(" / ")}
          </p>
          <h1 id="hero-name" data-hero="name" className="type-display-hero mt-4">
            {nameLines.map((line, i) => (
              <span key={line} className="block overflow-hidden pt-[0.06em]">
                <span className="hero-in hero-in-rise block" style={{ "--d": `${i * 0.12}s` } as CSSProperties}>
                  {line}
                </span>
              </span>
            ))}
          </h1>
          {headline && (
            <p className="hero-in hero-in-fade-up type-heading mt-6 max-w-[24ch] text-balance [--d:0.55s] lg:mt-8">
              {headline}
            </p>
          )}
          {intro && (
            <p className="hero-in hero-in-fade-up type-body mt-3 max-w-measure-narrow text-muted [--d:0.61s] lg:mt-4">
              {intro}
            </p>
          )}
          <div
            data-hero="ctas"
            className="hero-in hero-in-fade-up mt-8 flex flex-col gap-3 [--d:0.67s] md:flex-row lg:mt-10"
          >
            <Button href={hero.primary.href} className="w-full md:w-auto">
              {hero.primary.label}
            </Button>
            <Button href={hero.secondary.href} variant="ghost" className="w-full md:w-auto">
              {hero.secondary.label}
            </Button>
          </div>
          {/* Status: a compact ruled strip on mobile, a plain line on desktop. */}
          <div className="hero-in hero-in-fade-up type-mono-xs mt-8 flex flex-wrap gap-x-6 gap-y-2 border-y border-rule py-3 text-muted [--d:0.73s] lg:mt-10 lg:border-0 lg:py-0">
            <span>
              {profile.location.city}, {profile.location.country}
            </span>
            <span>{profile.availability.map((a) => a.label).join(" · ")}</span>
          </div>
        </div>

        {/* Portrait. Mobile/tablet: full-bleed banner. Desktop: plate in cols 8–12 with a back frame. */}
        <div className="order-1 -mx-(--margin) lg:order-2 lg:col-span-5 lg:col-start-8 lg:mx-0">
          <div data-hero="plate" className="relative">
            <CropMarks
              figure={0}
              caption={caption}
              placement="responsive"
              marksClassName="hero-in hero-in-fade [--d:1s]"
              // Below lg the name overlaps the banner's lower edge: no marks between its lines.
              bottomMarksClassName="hidden lg:block"
              captionClassName="hero-in hero-in-fade hidden [--d:1s] lg:block"
            >
              {/* Back frame: offset outline behind the image only (layered depth, desktop). */}
              <div
                aria-hidden="true"
                data-hero="back"
                className="hero-in hero-in-fade absolute top-4 -right-4 -bottom-4 left-4 hidden border border-rule [--d:1s] lg:block"
              />
              <div data-hero="frame" className="portrait-crop hero-in hero-in-clip bg-surface [--d:0.45s]" style={cropVars}>
                <Image
                  src={portrait.src}
                  width={portrait.width}
                  height={portrait.height}
                  alt={portrait.alt}
                  sizes={sizes}
                  preload
                  className="hero-in hero-in-zoom [--d:0.45s]"
                />
                {/* Legibility scrim for the overlapping name on mobile/tablet (functional, not decoration). */}
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-bg to-transparent lg:hidden" />
              </div>
            </CropMarks>
          </div>
        </div>
      </Container>

      {/* Scroll indicator: desktop only, decorative, anchored to the first viewport rather than the
          section bottom so it is always above the fold. Static under reduced motion. */}
      <div
        aria-hidden="true"
        className="hero-in hero-in-fade absolute top-[calc(100svh-5.5rem)] left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 [--d:1.1s] lg:flex"
      >
        <span className="type-mono-xs text-muted">{hero.scrollCue}</span>
        <span className="relative block h-12 w-px overflow-hidden bg-rule">
          <span className="scroll-cue-segment absolute inset-x-0 top-0 block h-4 bg-text" />
        </span>
      </div>
    </section>
  );
}
