import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Grain } from "@/components/motion/Grain";
import { Reveal } from "@/components/motion/Reveal";
import { TextReveal } from "@/components/motion/TextReveal";
import { Button, focusRingStatic } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { CropMarks } from "@/components/ui/CropMarks";
import { PendingFrame } from "@/components/ui/PendingFrame";
import { Section } from "@/components/ui/Section";
import { contact } from "@/data/contact";
import { devDesignSystem as copy } from "@/data/devDesignSystem";
import { education } from "@/data/education";
import { hero } from "@/data/hero";
import { experience } from "@/data/experience";
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import { sections } from "@/data/sections";
import { services } from "@/data/services";
import { tech } from "@/data/tech";
import { ui } from "@/data/ui";
import { isTodo } from "@/lib/content";
import { contrastRatio, wcagLevel } from "@/lib/contrast";
import { archivo, instrumentSans, plexMono } from "@/lib/fonts";
import { FontCheck } from "./_components/FontCheck";
import { MotionTokenCheck } from "./_components/MotionTokenCheck";

// Internal reference page. Must not ship: removed or blocked before launch (CLAUDE.md TODO, Prompt 20).
export const metadata: Metadata = {
  title: copy.title,
  robots: { index: false, follow: false },
};

const BG = "#090909";
// `text: false` = a fill, never a text color, so no text-contrast rating is shown.
const colors = [
  { token: "bg", hex: "#090909", text: false },
  { token: "surface", hex: "#171717", text: false },
  { token: "text", hex: "#F2F0EA", text: true },
  { token: "accent", hex: "#A5FF6B", text: true },
  { token: "muted", hex: "#858585", text: true },
];

const degree = education.degrees[0];
const currentRole = experience[0].roles.at(-1);
const samples = {
  displayXl: profile.name,
  displayL: services[0].title,
  displayM: projects[0].title,
  heading: currentRole?.title ?? "",
  bodyL: `${profile.roles.join(" / ")}. ${profile.location.city}, ${profile.location.country}.`,
  body: `${degree.degree}, ${degree.field}, ${degree.institution}, ${degree.year}.`,
  monoS: tech.join(" / "),
  monoXs: contact.email,
};

const typeScale = [
  { token: "type-display-xl", sample: samples.displayXl },
  { token: "type-display-l", sample: samples.displayL },
  { token: "type-display-m", sample: samples.displayM },
  { token: "type-heading", sample: samples.heading },
  { token: "type-body-l", sample: samples.bodyL },
  { token: "type-body", sample: samples.body },
  { token: "type-mono-s", sample: samples.monoS },
  { token: "type-mono-xs", sample: samples.monoXs },
];

const widths = [62, 75, 87, 100, 125];
const spacingSteps = [1, 2, 3, 4, 6, 8, 12, 16, 24, 32, 40];

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-t border-rule pt-6 pb-16">
      <h2 className="type-mono-xs mb-8 text-muted">{title}</h2>
      {children}
    </div>
  );
}

export default function DesignSystemPage() {
  const bio = profile.bio;
  return (
    <main id="main" className="flex-1 pt-16">
      <Container>
        <header className="pb-16">
          <h1 className="type-display-l">{copy.title}</h1>
          <p className="type-body mt-4 max-w-measure text-muted">{copy.intro}</p>
        </header>

        <Block title={copy.colors}>
          <ul className="grid grid-cols-2 gap-6 md:grid-cols-5">
            {colors.map(({ token, hex, text }) => {
              const ratio = contrastRatio(hex, BG);
              return (
                <li key={token}>
                  <div className="aspect-square border border-rule" style={{ background: hex }} />
                  <p className="type-mono-s mt-3">{token}</p>
                  <p className="type-mono-xs text-muted">{hex}</p>
                  {text && (
                    <p className="type-mono-xs text-muted">
                      {ratio.toFixed(2)}:1 {copy.contrastOn} · {wcagLevel(ratio)}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Block>

        <Block title={copy.fonts}>
          <FontCheck label="--font-display" fontFamily={archivo.style.fontFamily} className="type-display-m" sample={profile.name} />
          <FontCheck label="--font-sans" fontFamily={instrumentSans.style.fontFamily} className="type-body-l" sample={samples.bodyL} />
          <FontCheck label="--font-mono" fontFamily={plexMono.style.fontFamily} className="type-mono-s" sample={contact.email} />
        </Block>

        <Block title={copy.type}>
          <div className="flex flex-col gap-10">
            {typeScale.map(({ token, sample }) => (
              <div key={token}>
                <p className="type-mono-xs mb-2 text-muted">{token}</p>
                <p className={`${token} wrap-break-word`}>{sample}</p>
              </div>
            ))}
          </div>
        </Block>

        <Block title={copy.width}>
          <div className="flex flex-col gap-4">
            {widths.map((w) => (
              <div key={w} className="flex items-baseline gap-6">
                <span className="type-mono-xs w-12 shrink-0 text-muted">{w}</span>
                <span className="type-display-m truncate uppercase" style={{ fontStretch: `${w}%` }}>
                  {profile.name}
                </span>
              </div>
            ))}
          </div>
        </Block>

        <Block title={copy.spacing}>
          <div className="flex flex-col gap-3">
            {spacingSteps.map((n) => (
              <div key={n} className="flex items-center gap-4">
                <span className="type-mono-xs w-28 shrink-0 text-muted">{n * 4}px</span>
                <span className="h-3 bg-surface" style={{ width: `calc(var(--spacing) * ${n})` }} />
              </div>
            ))}
            <div className="flex items-center gap-4">
              <span className="type-mono-xs w-28 shrink-0 text-muted">--section-pad</span>
              <span className="h-3 bg-surface" style={{ width: "var(--section-pad)" }} />
            </div>
          </div>
        </Block>

        <Block title={copy.grid}>
          <p className="type-mono-xs mb-4 text-muted">{copy.gridNote}</p>
          <div className="layout-grid">
            {Array.from({ length: 12 }, (_, i) => (
              <div
                key={i}
                className={`type-mono-xs h-16 bg-surface p-1 text-muted ${i >= 8 ? "hidden lg:block" : i >= 4 ? "hidden md:block" : ""}`}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </Block>

        <Block title={copy.buttons}>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            <Button href="#main">{hero.primary.label}</Button>
            <Button href="#main" variant="ghost">
              {hero.secondary.label}
            </Button>
          </div>
          <p className="type-mono-xs mt-10 mb-4 text-muted">{copy.focusDemo}</p>
          <div className="flex flex-col gap-4 md:flex-row md:flex-wrap">
            <Button className={focusRingStatic}>{hero.primary.label}</Button>
            <Button variant="ghost" className={focusRingStatic}>
              {hero.secondary.label}
            </Button>
          </div>
        </Block>

        <Block title={copy.crop}>
          <div className="grid gap-12 md:grid-cols-3">
            <CropMarks figure={0} caption={`${profile.location.city}, ${profile.location.country}`}>
              <div className="aspect-3/4 bg-surface" />
            </CropMarks>
            <PendingFrame what={ui.pendingWhat.screenshot} aspect="3 / 4" />
            <PendingFrame what={isTodo(bio) ? bio.todo : ""} aspect="3 / 4" placement="inside" />
          </div>
        </Block>
      </Container>

      <Section id="demo-section" index={sections[0].index} label={sections[0].label} meta={`${String(projects.length).padStart(2, "0")} ${copy.projectsUnit}`} className="py-16!">
        <Container>
          <p className="type-display-m mt-10">{projects[0].title}</p>
        </Container>
      </Section>

      <Container>
        <Block title={copy.motion}>
          <div className="flex flex-col gap-12">
            <div>
              <p className="type-mono-xs mb-3 text-muted">{copy.revealLines}</p>
              <TextReveal as="p" className="type-display-m max-w-4xl">
                {samples.body}
              </TextReveal>
            </div>
            <div>
              <p className="type-mono-xs mb-3 text-muted">{copy.revealWords}</p>
              <TextReveal as="p" split="words" className="type-heading">
                {samples.bodyL}
              </TextReveal>
            </div>
            <div>
              <p className="type-mono-xs mb-3 text-muted">{copy.reveal}</p>
              <Reveal className="type-mono-s border border-rule p-6">{samples.monoS}</Reveal>
            </div>
            <div>
              <p className="type-mono-xs mb-3 text-muted">{copy.grain}</p>
              <div className="relative h-40 border border-rule bg-surface">
                <Grain opacity={0.12} />
              </div>
            </div>
          </div>
        </Block>

        <Block title={copy.cursor}>
          <div className="grid gap-4 md:grid-cols-3">
            {(Object.keys(ui.cursor) as (keyof typeof ui.cursor)[]).map((key) => (
              <div key={key} data-cursor={key} className="type-mono-s border border-rule px-6 py-10 text-muted">
                {copy.cursorTarget} · {key}
              </div>
            ))}
            <div data-cursor="none" className="type-mono-s border border-rule px-6 py-10 text-muted">
              {copy.cursorNone}
            </div>
            <label className="type-mono-s flex flex-col gap-3 border border-rule px-6 py-6 text-muted">
              {copy.cursorField}
              <input data-cursor-field type="text" className="type-body border-b border-rule bg-transparent py-2 text-text" />
            </label>
          </div>
        </Block>

        <Block title={copy.tokens}>
          <MotionTokenCheck />
        </Block>
      </Container>
    </main>
  );
}
