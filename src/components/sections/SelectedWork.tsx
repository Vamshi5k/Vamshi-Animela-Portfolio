import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { projects } from "@/data/projects";
import type { SectionMeta } from "@/data/types";
import { ui } from "@/data/ui";
import { formatCount } from "@/lib/format";
import { WorkStage } from "./WorkStage";

/** §01 Selected Work (SPEC §1a): sticky index + scrolling stage. Content from src/data/projects.ts. */
export function SelectedWork({ meta }: { meta: SectionMeta }) {
  return (
    <Section id={meta.id} index={meta.index} label={meta.label} meta={formatCount(projects.length, ui.unitProjects)}>
      <Container className="mt-12 lg:mt-16">
        <WorkStage projects={projects} />
      </Container>
    </Section>
  );
}
