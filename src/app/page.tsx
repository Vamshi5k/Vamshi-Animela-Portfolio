import { Fragment, type ReactNode } from "react";
import { About } from "@/components/sections/About";
import { ClientGallery } from "@/components/sections/ClientGallery";
import { Contact } from "@/components/sections/Contact";
import { Experience } from "@/components/sections/Experience";
import { Expertise } from "@/components/sections/Expertise";
import { Footer } from "@/components/sections/Footer";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { SelectedWork } from "@/components/sections/SelectedWork";
import { Services } from "@/components/sections/Services";
import { Marquee } from "@/components/sections/Marquee";
import { Container } from "@/components/ui/Container";
import { PendingFrame } from "@/components/ui/PendingFrame";
import { Section } from "@/components/ui/Section";
import { sections } from "@/data/sections";
import type { SectionMeta } from "@/data/types";

/** Built section compositions by id; the rest stay labelled placeholders (design/SPEC.md §1a). */
const built: Record<string, (meta: SectionMeta) => ReactNode> = {
  work: (meta) => <SelectedWork meta={meta} />,
  experience: (meta) => <Experience meta={meta} />,
  expertise: (meta) => <Expertise meta={meta} />,
  services: (meta) => <Services meta={meta} />,
  clients: (meta) => <ClientGallery meta={meta} />,
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
