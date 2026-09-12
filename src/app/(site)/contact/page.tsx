import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import { Reveal } from "@/components/motion/Reveal";
import { STUDIO } from "@/lib/routes";
import { getSettings } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Contact",
  description: "How to reach Iconic — interior design, decor and execution in Cairo.",
};

const NEXT_STEPS = [
  "We reply within one working day with our first questions — not a brochure.",
  "A visit to measure and listen, or a video call if you are abroad.",
  "A clear proposal: the design fee, the programme and, if we build it, a priced scope.",
];

export default async function ContactPage() {
  const settings = await getSettings();

  return (
    <>
      <PageHeader
        sheet="06"
        eyebrow="Contact"
        title={
          <>
            Where to <em>find us.</em>
          </>
        }
        lead="The studio is in Cairo. Write, call, or send a message on Instagram — whichever suits you."
      />

      <section data-surface="day" className="bg-surface pt-[var(--spacing-bay)] pb-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet grid gap-16 lg:grid-cols-12 lg:gap-10">
          <Reveal as="div" className="grid gap-12 lg:col-span-12 lg:grid-cols-3">
            <div>
              <h2 className="eyebrow mb-5 border-b border-rule pb-4 text-on-surface-faint">Direct</h2>
              <ul className="flex flex-col gap-3">
                <li>
                  <a
                    href={`mailto:${settings.email}`}
                    className="inked text-[clamp(1.5rem,1.2rem+0.9vw,2rem)] leading-tight transition-colors duration-300 hover:text-accent"
                  >
                    {settings.email}
                  </a>
                </li>
                <li>
                  <a
                    href={`tel:${settings.phone.replace(/\s+/g, "")}`}
                    className="inked text-[clamp(1.5rem,1.2rem+0.9vw,2rem)] leading-tight transition-colors duration-300 hover:text-accent"
                  >
                    {settings.phone}
                  </a>
                </li>
                <li>
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex min-h-11 items-center text-sm text-on-surface-muted transition-colors duration-300 hover:text-on-surface"
                  >
                    Instagram — @{settings.instagram} ↗
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h2 className="eyebrow mb-5 border-b border-rule pb-4 text-on-surface-faint">Studio</h2>
              <address className="space-y-1 text-sm text-on-surface-muted not-italic">
                {settings.address.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
              <p className="mt-4 text-sm text-on-surface-muted">Principal — {STUDIO.principal}</p>
            </div>

            <div>
              <h2 className="eyebrow mb-5 border-b border-rule pb-4 text-on-surface-faint">What happens next</h2>
              <ol className="flex flex-col gap-5">
                {NEXT_STEPS.map((step, i) => (
                  <li key={step} className="grid grid-cols-[2rem_1fr] gap-3 text-sm text-on-surface-muted">
                    <span className="annotation pt-0.5 text-accent">{String(i + 1).padStart(2, "0")}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
