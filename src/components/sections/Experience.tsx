import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { experience } from "@/data/experience";
import type { SectionMeta } from "@/data/types";
import { ui } from "@/data/ui";
import { formatCount } from "@/lib/format";
import { ExperienceTimeline } from "./ExperienceTimeline";

/** §02 Experience (SPEC §1a): the time ruler. One company in the data today; each gets its own ruler. */
export function Experience({ meta }: { meta: SectionMeta }) {
  const roleCount = experience.reduce((n, c) => n + c.roles.length, 0);
  return (
    <Section id={meta.id} index={meta.index} label={meta.label} meta={formatCount(roleCount, ui.unitRoles)}>
      <Container className="mt-12 flex flex-col gap-24 lg:mt-16">
        {experience.map((company) => (
          <ExperienceTimeline key={company.company} company={company} />
        ))}
      </Container>
    </Section>
  );
}
