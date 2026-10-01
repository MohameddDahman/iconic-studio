import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { STUDIO } from "@/lib/routes";
import { getSettings } from "@/lib/content";
import { mapEmbedSrc, mapPlaceId, telHref, whatsappHref } from "@/lib/contact";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach Iconic — architecture, landscape and interior design in Alexandria.",
};

const NEXT_STEPS = [
  "We reply within one working day with our first questions — not a brochure.",
  "A visit to measure and listen, or a video call if you are abroad.",
  "A clear proposal: the design fee, the programme and, if we build it, a priced scope.",
];

const headingClass = "eyebrow mb-5 border-b border-rule pb-4 text-on-surface-faint";
const directClass =
  "inked text-[clamp(1.5rem,1.2rem+0.9vw,2rem)] leading-tight transition-colors duration-300 hover:text-accent";
const linkClass =
  "inline-flex min-h-11 items-center text-sm text-on-surface-muted transition-colors duration-300 hover:text-on-surface";

/** Anything that leaves the site opens in a new tab. */
const away = { target: "_blank", rel: "noreferrer noopener" } as const;

export default async function ContactPage() {
  const settings = await getSettings();
  const place = await mapPlaceId(settings.mapUrl);

  return (
    <>
      <PageHeader
        sheet="07"
        eyebrow="Contact"
        title={
          <>
            Where to <em>find us.</em>
          </>
        }
        lead="The studio is in Alexandria. Message us on WhatsApp, call, or come and see us — whichever suits you."
      />

      <section data-surface="day" className="bg-surface pt-[var(--spacing-bay)] pb-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet flex flex-col gap-16 lg:gap-24">
          <Reveal as="div" className="grid gap-12 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10">
            <div>
              <h2 className={headingClass}>Direct</h2>
              <ul className="flex flex-col gap-3">
                {settings.phone && (
                  <li>
                    <a href={telHref(settings.phone)} className={directClass}>
                      {settings.phone}
                    </a>
                  </li>
                )}
                {settings.email && (
                  <li>
                    <a href={`mailto:${settings.email}`} className={directClass}>
                      {settings.email}
                    </a>
                  </li>
                )}
                {settings.whatsapp && (
                  <li>
                    <a href={whatsappHref(settings.whatsapp, STUDIO.legalName)} {...away} className={linkClass}>
                      Message us on WhatsApp ↗
                    </a>
                  </li>
                )}
              </ul>
            </div>

            <div>
              <h2 className={headingClass}>Studio</h2>
              <address className="space-y-1 text-sm text-on-surface-muted not-italic">
                {settings.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              {settings.mapUrl && (
                <a href={settings.mapUrl} {...away} className={`${linkClass} mt-1`}>
                  Directions on Google Maps ↗
                </a>
              )}
              <p className="mt-3 text-sm text-on-surface-muted">Principal — {STUDIO.principal}</p>
            </div>

            <div>
              <h2 className={headingClass}>Online</h2>
              <ul className="flex flex-col">
                {settings.instagramUrl && (
                  <li>
                    <a href={settings.instagramUrl} {...away} className={linkClass}>
                      Instagram — @{settings.instagram} ↗
                    </a>
                  </li>
                )}
                {settings.links.map((link) => (
                  <li key={link.url}>
                    <a href={link.url} {...away} className={linkClass}>
                      {link.label} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <div className="grid gap-12 lg:grid-cols-12 lg:gap-10">
            {(place || settings.address.length > 0) && (
              <Reveal as="div" className="lg:col-span-8">
                <div className="relative aspect-square overflow-hidden border border-rule bg-plaster-2 sm:aspect-[16/10]">
                  <iframe
                    src={mapEmbedSrc(place, settings.address)}
                    title={`Map showing ${settings.address[0] ?? STUDIO.legalName}`}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="absolute inset-0 h-full w-full [filter:saturate(0.4)_contrast(1.02)]"
                  />
                </div>
              </Reveal>
            )}

            <div className="lg:col-span-4">
              <h2 className={headingClass}>What happens next</h2>
              <ol className="flex flex-col gap-5">
                {NEXT_STEPS.map((step, i) => (
                  <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 text-sm text-on-surface-muted">
                    <span className="annotation pt-0.5 text-accent">{String(i + 1).padStart(2, "0")}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
