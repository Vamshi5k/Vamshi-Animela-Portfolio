import { Fragment } from "react";
import { Container } from "@/components/ui/Container";
import { PendingFrame } from "@/components/ui/PendingFrame";
import { Section } from "@/components/ui/Section";
import { education } from "@/data/education";
import { profile } from "@/data/profile";
import type { SectionMeta } from "@/data/types";
import { ui } from "@/data/ui";
import { isTodo } from "@/lib/content";
import { splitLead } from "@/lib/text";
import { AboutMotion } from "./AboutMotion";

type Fact = { id: string; label: string; lines: { text: string; muted?: boolean }[] };

/**
 * §06 About (SPEC §1a): the manuscript. A huge pull quote (the bio's first sentence) across the full width,
 * then a mono fact sheet on ruled lines led by a giant outlined years numeral, with the rest of the bio in a
 * narrow column beside it. The bio is one field, split at runtime: quote + column reproduce it exactly.
 * DOM order is the phone reading order (quote, bio, numeral, facts); wider layouts place it on the grid.
 */
export function About({ meta }: { meta: SectionMeta }) {
  const bio = isTodo(profile.bio) ? null : profile.bio;
  const [lead, rest] = bio ? splitLead(bio) : [null, null];
  const words = lead ? lead.split(/\s+/) : [];

  const facts: Fact[] = [
    { id: "location", label: ui.about.location, lines: [{ text: `${profile.location.city}, ${profile.location.country}` }] },
    {
      id: "languages",
      label: ui.about.languages,
      lines: profile.languages.map((l) => ({ text: `${l.name} — ${l.proficiency}` })),
    },
    {
      id: "education",
      label: ui.about.education,
      lines: education.degrees.flatMap((d) => [{ text: `${d.degree}, ${d.field}` }, { text: `${d.institution}, ${d.year}` }]),
    },
    {
      id: "credentials",
      label: ui.about.credentials,
      // Learning is muted and labelled as learning: never styled or named like the certificate.
      lines: education.credentials.map((c) =>
        c.kind === "certificate"
          ? { text: `${ui.about.certificate} — ${c.title}, ${c.issuer}` }
          : { text: `${ui.about.learning} — ${c.title}, ${c.providers.join(", ")}`, muted: true },
      ),
    },
  ].filter((f) => f.lines.length > 0);

  return (
    <Section id={meta.id} index={meta.index} label={meta.label} meta={profile.location.coordinates}>
      <Container className="mt-12 lg:mt-16">
        <AboutMotion>
          {lead ? (
            <p data-read className="type-quote">
              {words.map((w, i) => (
                <Fragment key={i}>
                  {i > 0 && " "}
                  <span data-read-word>{w}</span>
                </Fragment>
              ))}
              <span aria-hidden="true" data-caret className="about-caret" />
            </p>
          ) : (
            <PendingFrame what={ui.pendingWhat.bio} aspect="16 / 5" />
          )}

          <div className="layout-grid mt-14 gap-y-12 md:mt-20 lg:mt-28">
            {rest && (
              <p data-bio className="type-body-l col-span-full max-w-measure md:col-span-6 lg:col-span-3 lg:col-start-10 lg:row-start-1 lg:pt-4 lg:pl-8">
                {rest}
              </p>
            )}

            <dl data-sheet className="col-span-full border-b border-rule lg:col-span-9 lg:grid lg:grid-cols-subgrid lg:grid-rows-[auto_auto_auto_1fr] lg:row-start-1">
              <div className="border-t border-rule pt-4 pb-6 lg:col-span-3 lg:row-span-4 lg:pb-8">
                <dt className="type-mono-xs text-muted">{ui.about.experience}</dt>
                <dd className="mt-3 flex items-end gap-5 lg:block">
                  <span aria-hidden="true" data-numeral data-reveal className="type-numeral about-outline block w-fit">
                    {profile.experience.approxYears}
                  </span>
                  <span data-type-line data-reveal className="type-mono-s block w-fit max-w-full pb-3 lg:mt-5 lg:pb-0">
                    {profile.experience.label}
                  </span>
                </dd>
              </div>
              {facts.map((fact) => (
                <div
                  key={fact.id}
                  data-fact={fact.id}
                  className="grid grid-cols-1 gap-y-2 border-t border-rule py-4 md:grid-cols-[8rem_1fr] md:gap-x-4 lg:col-span-6 lg:col-start-4 lg:grid-cols-[7rem_1fr]"
                >
                  <dt className="type-mono-xs pt-px text-muted">{fact.label}</dt>
                  <dd className="type-mono-s">
                    {fact.lines.map((line) => (
                      <span
                        key={line.text}
                        data-type-line
                        data-reveal
                        className={line.muted ? "block w-fit max-w-full text-muted" : "block w-fit max-w-full text-text"}
                      >
                        {line.text}
                      </span>
                    ))}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </AboutMotion>
      </Container>
    </Section>
  );
}
