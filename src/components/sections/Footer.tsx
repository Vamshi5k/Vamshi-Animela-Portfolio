import type { CSSProperties } from "react";
import { Container } from "@/components/ui/Container";
import { nav } from "@/data/nav";
import { profile } from "@/data/profile";
import { ui } from "@/data/ui";
import { buildYear } from "@/lib/build-year";
import { BackToTop, FooterYear } from "./FooterControls";
import { FooterMotion } from "./FooterMotion";

/**
 * Footer (SPEC §1a): the end credits. A colophon strip on a hairline (credits, location, index, type +
 * back to top), then the giant VAMSHI.DEV wordmark cropped by the bottom edge. Not a numbered section.
 * The curtain (sticky behind <main>, wordmark rising letter by letter) is set up by FooterMotion.
 */
export async function Footer() {
  const letters = [...profile.siteName];
  const fallbackYear = await buildYear();
  return (
    <footer data-footer className="site-footer overflow-hidden bg-bg">
      <FooterMotion>
        <Container>
          <div className="type-mono-xs layout-grid gap-y-10 border-t border-rule pt-5">
            <div className="col-span-2 md:col-span-4 lg:col-span-3">
              <p className="text-muted">{ui.footer.credits}</p>
              <p className="mt-3 text-text">
                <FooterYear mark={ui.footer.copyright} fallback={fallbackYear} /> {profile.name}
              </p>
              <p className="mt-1 text-text">
                {ui.footer.designedBy} {profile.name}
              </p>
            </div>
            <div className="col-span-2 md:col-span-4 lg:col-span-3">
              <p className="text-muted">{ui.footer.location}</p>
              <p className="mt-3 text-text">{profile.location.coordinates}</p>
              <p className="mt-1 text-text">
                {profile.location.city}, {profile.location.country}
              </p>
            </div>
            <nav aria-label={ui.footer.navLabel} className="col-span-2 md:col-span-4 lg:col-span-3">
              <p className="text-muted">{ui.footer.index}</p>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                {nav.items.map((item) => (
                  <li key={item.href}>
                    <a href={item.href} className="text-text underline-offset-4 hover:underline">
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="col-span-2 md:col-span-4 lg:col-span-3">
              <p className="text-muted">{ui.footer.setIn}</p>
              <p className="mt-3 text-text">{ui.footer.typefaces.join(" · ")}</p>
              <p className="mt-4">
                <BackToTop href={nav.items[0].href} label={ui.footer.backToTop} />
              </p>
            </div>
          </div>
        </Container>

        {/* Wordmark: decorative (the name is in the credits and the header), cropped by the bottom edge. */}
        <Container className="mt-12 lg:mt-16">
          <div className="@container">
            <div aria-hidden="true" className="footer-wordmark-crop" style={{ "--chars": letters.length } as CSSProperties}>
              <p data-wordmark data-reveal className="footer-wordmark">
                {letters.map((ch, i) => (
                  <span key={i} data-wm-letter className="inline-block">
                    {ch}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </Container>
      </FooterMotion>
    </footer>
  );
}
