import { Fragment, type ReactNode } from "react";
import { About } from "@/components/sections/About";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Expertise } from "@/components/sections/Expertise";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Container } from "@/components/ui/Container";
import { PendingFrame } from "@/components/ui/PendingFrame";
import { Section } from "@/components/ui/Section";
import { sections } from "@/data/sections";
import type { SectionMeta } from "@/data/types";

/** Built section compositions by id; the rest stay labelled placeholders (design/SPEC.md §1a). */
const built: Record<string, (meta: SectionMeta) => ReactNode> = {
  experience: (meta) => <Experience meta={meta} />,
  expertise: (meta) => <Expertise meta={meta} />,
  about: (meta) => <About meta={meta} />,
  contact: (meta) => <Contact meta={meta} />,
};

// Page shell: hero, marquee, then the numbered sections in data order.
export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        <Hero />
        <Marquee />
        {sections.map((s) =>
          built[s.id] ? (
            <Fragment key={s.id}>{built[s.id](s)}</Fragment>
          ) : (
            <Section key={s.id} id={s.id} index={s.index} label={s.label}>
              <Container className="mt-10">
                <PendingFrame what={s.label} aspect="16 / 9" />
              </Container>
            </Section>
          ),
        )}
      </main>
      <Footer />
    </>
  );
}
