import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import ServicesIndex from "@/components/site/ServicesIndex";
import ProcessSteps from "@/components/site/ProcessSteps";
import CtaLink from "@/components/site/CtaLink";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { DISCIPLINES, STAGES } from "@/lib/practice";
import { img } from "@/lib/media";

// The footer reads the studio's details from Convex, so this page refreshes like the rest.
// Each refresh reads Convex, so five minutes keeps a busy day inside the free allowance.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Services",
  description:
    "Interior design, decor and turnkey execution for homes, workplaces, restaurants, hotels, retail and clinics — from the first survey to the final styling.",
};

const QUESTIONS = [
  {
    q: "Do you design only, or build as well?",
    a: "Both. We can deliver the design on its own — drawings, 3D renders and specifications for your contractor — or take the project all the way through execution with our own site team, from the empty shell to the final styling.",
  },
  {
    q: "What kinds of spaces do you work on?",
    a: "Apartments, villas, duplexes and penthouses, as well as offices, restaurants and cafés, hotel lobbies, boutiques and clinics. If it has an interior, we can design it.",
  },
  {
    q: "Will I see the project before anything is built?",
    a: "Yes. Every key room is modelled and rendered, by daylight and after dark, and signed off by you before a single material is ordered.",
  },
  {
    q: "Can you work with furniture I already own?",
    a: "Of course. We survey and measure the pieces you want to keep and design around them, then source or make the rest.",
  },
  {
    q: "I live abroad — can we still work together?",
    a: "Yes. Many clients follow their project remotely: drawings, renders, samples and site progress are shared online, and we attend the site on your behalf.",
  },
  {
    q: "How long does a project take?",
    a: "It depends on the scope. A single room can be designed in weeks; a full home or a commercial fit-out is planned with you as a programme at the first meeting, so you know the timeline before you commit.",
  },
];

export default function ServicesPage() {
  return (
    <>
      <PageHeader
        sheet="02"
        eyebrow="Services"
        title={
          <>
            Everything <em>inside</em> the walls.
          </>
        }
        lead="One studio for every layer of an interior — the plan, the ceiling and the light, the joinery and the stone, the furniture and the last cushion — and the team that builds it."
        media={img("stock/detail-16.jpg", "")}
      />

      <ServicesIndex items={DISCIPLINES} />

      <ProcessSteps stages={STAGES} index="(02)" />

      <section data-surface="day" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet grid gap-12 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-4">
            <p className="eyebrow mb-8 text-accent">(03) Questions</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              Before you <em>ask.</em>
            </SplitHeading>
          </div>
          <Reveal className="border-t border-rule lg:col-span-7 lg:col-start-6">
            {QUESTIONS.map(({ q, a }) => (
              <details key={q} className="group border-b border-rule">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                  <span className="inked text-[clamp(1.35rem,1.1rem+0.8vw,1.85rem)] leading-tight">{q}</span>
                  <span
                    aria-hidden="true"
                    className="grid size-10 shrink-0 place-items-center rounded-full border border-rule-strong text-lg transition-transform duration-500 ease-cut group-open:rotate-45"
                  >
                    +
                  </span>
                </summary>
                <p className="max-w-2xl pb-8 text-on-surface-muted">{a}</p>
              </details>
            ))}
          </Reveal>
        </div>
      </section>

      <section data-surface="night" className="cove bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8 text-accent">Next step</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              Tell us what you are <em>planning.</em>
            </SplitHeading>
          </div>
          <Reveal className="flex flex-col items-start gap-8 lg:col-span-4 lg:col-start-9">
            <p className="text-on-surface-muted">
              A single room or a whole building, designed and built by one studio. The projects
              show what that looks like once it is finished.
            </p>
            <div className="flex flex-wrap gap-3">
              <CtaLink href="/projects">See the work</CtaLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
