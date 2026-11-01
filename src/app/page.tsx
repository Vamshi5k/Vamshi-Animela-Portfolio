import { Header } from "@/components/sections/Header";
import { Container } from "@/components/ui/Container";
import { PendingFrame } from "@/components/ui/PendingFrame";
import { Section } from "@/components/ui/Section";
import { nav } from "@/data/nav";
import { sections } from "@/data/sections";
import { anchorId } from "@/lib/anchors";

const home = nav.items[0];

// Page shell: hero + numbered sections in data order. Each section is a labelled placeholder
// until its composition is built (design/SPEC.md §1a).
export default function Home() {
  return (
    <>
      <Header />
      <main id="main" className="flex flex-1 flex-col">
        <section
          id={anchorId(home.href)}
          aria-label={home.label}
          className="flex min-h-svh scroll-mt-(--header-h) flex-col justify-end pt-(--header-h) pb-(--section-pad)"
        >
          <Container>
            <PendingFrame what={home.label} aspect="16 / 7" />
          </Container>
        </section>

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
