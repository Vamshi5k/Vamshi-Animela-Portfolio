import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Section } from "@/components/ui/Section";
import { contact } from "@/data/contact";
import { profile } from "@/data/profile";
import type { SectionMeta } from "@/data/types";
import { ui } from "@/data/ui";
import { ContactEmail } from "./ContactEmail";

type Row = { id: string; label: string; href: string; detail: string };

/** "https://linkedin.com/in/x/" → "linkedin.com/in/x": the address as a mono coordinate. */
const bare = (href: string) => href.replace(/^https?:\/\//, "").replace(/\/$/, "");

/**
 * §07 Contact (SPEC §1a): one giant line. Headline, then the email across the full width (proximity type,
 * click or Enter to copy, plus a plain mailto link), then the profile links as big ruled rows. The right
 * half of the last row is the reserved slot for the contact form (a later prompt); nothing renders there.
 */
export function Contact({ meta }: { meta: SectionMeta }) {
  const rows: Row[] = contact.socials.map((s) => ({ id: s.label.toLowerCase(), label: s.label, href: s.href, detail: bare(s.href) }));
  if (contact.whatsapp !== null) {
    const digits = contact.whatsapp.replace(/\D/g, "");
    rows.push({ id: "whatsapp", label: ui.contact.whatsapp, href: `https://wa.me/${digits}`, detail: contact.whatsapp });
  }
  const availability = profile.availability.map((a) => a.label.toUpperCase()).join(" · ");

  return (
    <Section id={meta.id} index={meta.index} label={meta.label} meta={availability}>
      <Container className="mt-12 lg:mt-16">
        <p className="type-contact-headline max-w-[16ch] text-text">{contact.headline}</p>

        <div className="mt-16 md:mt-20 lg:mt-28">
          <ContactEmail email={contact.email} />
        </div>

        <div className="layout-grid mt-20 lg:mt-28">
          <ul className="col-span-full border-b border-rule lg:col-span-6">
            {rows.map((row) => (
              <li key={row.id} className="border-t border-rule">
                <a
                  href={row.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-cursor="open"
                  data-contact-link={row.id}
                  className="group flex min-h-16 items-center gap-6 py-5 md:py-6"
                >
                  <span className="type-display-m">{row.label}</span>
                  <span className="sr-only">, {ui.contact.opensNewTab}</span>
                  <span aria-hidden="true" className="type-mono-xs ml-auto hidden truncate text-muted md:block">
                    {row.detail}
                  </span>
                  <ArrowUpRight
                    aria-hidden="true"
                    strokeWidth={1.25}
                    className="contact-arrow ml-auto size-8 shrink-0 md:ml-0 md:size-10"
                  />
                </a>
              </li>
            ))}
          </ul>
          {/* Reserved: lg cols 8–12 hold the contact form (prompt 5). Nothing renders here until then. */}
        </div>
      </Container>
    </Section>
  );
}
