import TransitionLink from "@/components/motion/TransitionLink";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import CtaLink from "@/components/site/CtaLink";
import FooterWordmark from "./FooterWordmark";
import { DISCIPLINES } from "@/lib/practice";
import { NAV_SHEETS, STUDIO } from "@/lib/routes";
import { getSettings } from "@/lib/content";

export default async function SiteFooter() {
  const settings = await getSettings();
  const year = new Date().getFullYear();

  return (
    <footer data-surface="night" className="relative overflow-hidden bg-surface text-on-surface">
      <div className="sheet pt-[var(--spacing-bay-lg)]">
        {/* The ask */}
        <div className="grid gap-12 border-b border-rule pb-[var(--spacing-bay)] lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-8">
            <p className="eyebrow mb-8 text-accent">The studio</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              Let&rsquo;s design the rooms <em className="text-accent">you&rsquo;ll live in.</em>
            </SplitHeading>
          </div>

          <Reveal className="flex flex-col justify-end gap-8 lg:col-span-4">
            <p className="max-w-md text-on-surface-muted">
              Homes, restaurants, offices and clinics — designed, drawn and built by the studio
              in Cairo. The work is below; the studio&rsquo;s details are at the end of it.
            </p>
            <div className="flex flex-wrap gap-3">
              <CtaLink href="/projects">See the work</CtaLink>
              <CtaLink href={`mailto:${settings.email}`} variant="outline">
                Email us
              </CtaLink>
            </div>
          </Reveal>
        </div>

        {/* Directory */}
        <div className="grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <h2 className="eyebrow mb-6 text-on-surface-faint">Studio</h2>
            <address className="space-y-1.5 text-sm text-on-surface-muted not-italic">
              {settings.address.map((line) => (
                <span key={line} className="block">
                  {line}
                </span>
              ))}
            </address>
            <p className="mt-6 text-sm text-on-surface-muted">Principal — {STUDIO.principal}</p>
          </div>

          <nav aria-label="Footer" className="lg:col-span-3">
            <h2 className="eyebrow mb-6 text-on-surface-faint">Explore</h2>
            <ul className="space-y-1">
              {NAV_SHEETS.map((sheet) => (
                <li key={sheet.key}>
                  <TransitionLink
                    href={sheet.href}
                    className="group inline-flex min-h-10 cursor-pointer items-center gap-3 text-sm"
                  >
                    <span className="annotation w-6 text-on-surface-faint transition-colors duration-300 group-hover:text-accent">
                      {sheet.sheet}
                    </span>
                    <span className="transition-transform duration-500 ease-cut group-hover:translate-x-1">
                      {sheet.label}
                    </span>
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className="eyebrow mb-6 text-on-surface-faint">Services</h2>
            <ul className="space-y-1">
              {DISCIPLINES.map((d) => (
                <li key={d.id}>
                  <TransitionLink
                    href={`/services#${d.id}`}
                    className="inline-flex min-h-10 cursor-pointer items-center text-sm text-on-surface-muted transition-colors duration-300 hover:text-on-surface"
                  >
                    {d.name}
                  </TransitionLink>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-2">
            <h2 className="eyebrow mb-6 text-on-surface-faint">Contact</h2>
            <ul className="space-y-1 text-sm">
              <li>
                <a
                  href={`mailto:${settings.email}`}
                  className="inline-flex min-h-10 items-center transition-colors duration-300 hover:text-accent"
                >
                  {settings.email}
                </a>
              </li>
              <li>
                <a
                  href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                  className="inline-flex min-h-10 items-center transition-colors duration-300 hover:text-accent"
                >
                  {settings.phone}
                </a>
              </li>
              <li>
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex min-h-10 items-center transition-colors duration-300 hover:text-accent"
                >
                  Instagram ↗
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <FooterWordmark text={settings.name} />

      <div className="sheet flex flex-col gap-3 border-t border-rule py-6 text-on-surface-faint sm:flex-row sm:items-center sm:justify-between">
        <p className="annotation">
          © {year} {STUDIO.legalName}
        </p>
        <p className="annotation">Interior design · Decor · Execution</p>
      </div>
    </footer>
  );
}
