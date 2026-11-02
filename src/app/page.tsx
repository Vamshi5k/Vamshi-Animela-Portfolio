import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Marquee } from "@/components/sections/Marquee";
import { Container } from "@/components/ui/Container";
import { PendingFrame } from "@/components/ui/PendingFrame";
import { Section } from "@/components/ui/Section";
import { sections } from "@/data/sections";

// Page shell: hero + numbered sections in data order. Numbered sections are labelled placeholders
// until their compositions are built (design/SPEC.md §1a).
export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        <Hero />
        <Marquee />
        {sections.map((s) => (
          <Section key={s.id} id={s.id} index={s.index} label={s.label}>
            <Container className="mt-10">
              <PendingFrame what={s.label} aspect="16 / 9" />
            </Container>
          </Section>
        ))}
      </main>
    </>
  );
}
