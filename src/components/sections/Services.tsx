import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { services } from "@/data/services";
import type { SectionMeta } from "@/data/types";
import { ui } from "@/data/ui";
import { formatCount } from "@/lib/format";
import { ServicesLadder } from "./ServicesLadder";

/** §04 Services (SPEC §1a): the descending ladder of disclosures. Content from src/data/services.ts. */
export function Services({ meta }: { meta: SectionMeta }) {
  return (
    <Section id={meta.id} index={meta.index} label={meta.label} meta={formatCount(services.length, ui.unitServices)}>
      <Container className="mt-12 lg:mt-16">
        <ServicesLadder services={services} />
      </Container>
    </Section>
  );
}
