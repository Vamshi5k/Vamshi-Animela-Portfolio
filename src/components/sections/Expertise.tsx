import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { skills } from "@/data/skills";
import type { SectionMeta } from "@/data/types";
import { ui } from "@/data/ui";
import { formatCount } from "@/lib/format";
import { ExpertisePlate } from "./ExpertisePlate";

/** §03 Expertise (SPEC §1a): the specification plate. Counts are derived from src/data/skills.ts. */
export function Expertise({ meta }: { meta: SectionMeta }) {
  const total = skills.reduce((n, g) => n + g.items.length, 0);
  const count = `${formatCount(skills.length, ui.unitGroups)} · ${formatCount(total, ui.unitSkills)}`;
  return (
    <Section id={meta.id} index={meta.index} label={meta.label} meta={count}>
      <Container className="mt-12 lg:mt-16">
        <ExpertisePlate groups={skills} />
      </Container>
    </Section>
  );
}
