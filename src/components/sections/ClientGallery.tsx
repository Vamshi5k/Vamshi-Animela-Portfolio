import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { clients } from "@/data/clients";
import type { SectionMeta } from "@/data/types";
import { ui } from "@/data/ui";
import { isTodo } from "@/lib/content";
import { formatCount } from "@/lib/format";
import { ClientsMotion } from "./ClientsMotion";

/**
 * §05 Clients (SPEC §1a): the centered credits roll, the site's only centered composition. Each client name is
 * set large and centered with a mono caption (location if known, then category) and the contribution beneath.
 * A verified live URL turns the name into a link with ↗ (new tab, noopener noreferrer). No screenshots exist
 * yet, so no plate renders (SPEC: a plate only when a screenshot exists).
 */
export function ClientGallery({ meta }: { meta: SectionMeta }) {
  return (
    <Section id={meta.id} index={meta.index} label={meta.label} meta={formatCount(clients.length, ui.unitClients)}>
      <Container className="mt-12 lg:mt-16">
        <ClientsMotion>
          <p className="type-mono-xs text-center text-muted">{ui.clientsKicker}</p>
          <ol className="mt-14 flex flex-col items-center gap-20 lg:mt-20 lg:gap-28">
            {clients.map((c) => {
              const category = isTodo(c.category) ? null : c.category;
              const contribution = isTodo(c.contribution) ? null : c.contribution;
              const caption = [c.location, category].filter(Boolean).join(" · ");
              const linked = c.urlVerified && c.liveUrl !== null;
              const name = (
                <span data-client-name data-reveal className="client-name">
                  {c.name}
                  {linked && (
                    <span aria-hidden="true" className="client-arrow">
                      {" ↗"}
                    </span>
                  )}
                </span>
              );
              return (
                <li key={c.id} data-client={c.id} className="flex max-w-full flex-col items-center text-center">
                  <h3>
                    {linked ? (
                      <a href={c.liveUrl ?? undefined} target="_blank" rel="noopener noreferrer" data-cursor="open" className="client-link">
                        {name}
                        <span className="sr-only">, {ui.contact.opensNewTab}</span>
                      </a>
                    ) : (
                      name
                    )}
                  </h3>
                  <span data-client-rule aria-hidden="true" className="client-rule" />
                  {caption && <p className="type-mono-xs mt-4 text-muted">{caption}</p>}
                  {contribution && <p className="type-body mt-3 max-w-[52ch] text-muted">{contribution}</p>}
                </li>
              );
            })}
          </ol>
        </ClientsMotion>
      </Container>
    </Section>
  );
}
