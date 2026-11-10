import type { Metadata } from "next";
import Image from "next/image";
import PageHeader from "@/components/site/PageHeader";
import ProcessSteps from "@/components/site/ProcessSteps";
import CtaLink from "@/components/site/CtaLink";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal, RevealImage } from "@/components/motion/Reveal";
import { STAGES } from "@/lib/practice";
import { STUDIO } from "@/lib/routes";
import { img } from "@/lib/media";
import credits from "@/lib/media-credits.json";
import { getSettings } from "@/lib/content";

// Each refresh reads Convex, so five minutes keeps a busy day inside the free allowance.
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Studio",
  description: `Iconic is an interior design and execution studio led by ${STUDIO.principal}.`,
};

const PRINCIPLES = [
  {
    n: "01",
    title: "Drawn before it is built",
    body: "Every decision is made on paper and on screen first — plans, ceiling and lighting layouts, elevations and 3D — so the site builds exactly what you approved.",
  },
  {
    n: "02",
    title: "Lit for day and night",
    body: "Key rooms are designed and rendered twice, because a room that works at noon can still fail at nine in the evening.",
  },
  {
    n: "03",
    title: "One team, one standard",
    body: "The people who design your space supervise its execution — from the empty shell to the last object on the shelf.",
  },
];

export default async function StudioPage() {
  const settings = await getSettings();

  const drawing = img("stock/drafting-00.jpg", "Hands drawing a floor plan with a scale ruler");
  const board = img("stock/material-29.jpg", "A material board with fabric swatches, a book and a glass vase");
  const photographers = [...new Set(Object.values(credits as Record<string, { photographer: string }>).map((c) => c.photographer))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return (
    <>
      <PageHeader
        sheet="04"
        eyebrow="Studio"
        title={
          <>
            One studio, from drawing <em>to handover.</em>
          </>
        }
        lead={settings.intro}
        media={img("stock/drafting-26.jpg", "")}
      />

      <section data-surface="day" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet grid gap-14 lg:grid-cols-12 lg:gap-10">
          <RevealImage className="relative aspect-[4/5] bg-plaster-2 lg:col-span-5">
            <div className="relative h-full w-full">
              <Image
                src={drawing.src}
                alt={drawing.alt}
                fill
                sizes="(min-width: 1024px) 42vw, 100vw"
                quality={72}
                placeholder={drawing.blurDataURL ? "blur" : "empty"}
                blurDataURL={drawing.blurDataURL}
                className="object-cover"
              />
            </div>
          </RevealImage>

          <div className="flex flex-col justify-center lg:col-span-6 lg:col-start-7">
            <p className="eyebrow mb-8 text-accent">(01) The principal</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">{STUDIO.principal}</SplitHeading>
            <Reveal stagger className="mt-8 flex flex-col gap-5">
              <p className="text-lead leading-[1.55]">
                Iconic is led by an engineer, and it shows in the drawings. Every project gets a
                complete set before anything is ordered — plans, ceiling and lighting layouts,
                elevations and joinery details — and then the same studio builds it.
              </p>
              <p className="text-on-surface-muted">
                That is unusual. Most studios hand a set of renders to a contractor and hope. We would
                rather be the ones who make the shadow gap work on a wall that is not quite straight.
              </p>
              <p className="text-on-surface-muted">
                Clients who followed their whole project from abroad are among the ones we are proudest
                of — their words are further down this page.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      <section data-surface="night" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-8 text-accent">(02) How we work</p>
              <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
                Three things we <em>never skip.</em>
              </SplitHeading>
            </div>
          </div>
          <Reveal stagger className="mt-16 grid border-t border-l border-rule md:grid-cols-3">
            {PRINCIPLES.map((principle) => (
              <div key={principle.n} className="flex flex-col gap-6 border-r border-b border-rule p-8 md:p-10">
                <span className="annotation text-accent">{principle.n}</span>
                <h3 className="inked text-d4 leading-[1.05]">{principle.title}</h3>
                <p className="text-on-surface-muted">{principle.body}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      <section data-surface="night" className="relative bg-surface text-on-surface">
        <RevealImage className="relative h-[70svh] min-h-[420px]">
          <div className="relative h-full w-full">
            <Image
              src={board.src}
              alt={board.alt}
              fill
              sizes="100vw"
              quality={72}
              placeholder={board.blurDataURL ? "blur" : "empty"}
              blurDataURL={board.blurDataURL}
              className="object-cover"
            />
            <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/85 via-night/20 to-transparent" />
          </div>
        </RevealImage>
        <div className="sheet absolute inset-x-0 bottom-0 pb-12">
          <p className="inked max-w-3xl text-d3 leading-[1.05] text-bone">
            Samples are chosen in the room they are <em>going into.</em>
          </p>
        </div>
      </section>

      <ProcessSteps stages={STAGES} index="(03)" />

      <section data-surface="day" className="bg-surface pb-[var(--spacing-bay)] text-on-surface">
        <div className="sheet flex flex-col gap-10 border-t border-rule pt-12 md:flex-row md:items-end md:justify-between">
          <SplitHeading className="inked max-w-2xl text-d3 leading-[1] tracking-[-0.015em]">
            The work is the <em>argument.</em>
          </SplitHeading>
          <div className="flex flex-wrap gap-3">
            <CtaLink href="/projects">See the projects</CtaLink>
          </div>
        </div>

        <div className="sheet mt-16">
          <details className="group border-t border-rule pt-6">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 [&::-webkit-details-marker]:hidden">
              <span className="eyebrow text-on-surface-faint">Image &amp; model credits</span>
              <span aria-hidden="true" className="annotation transition-transform duration-500 group-open:rotate-45">
                +
              </span>
            </summary>
            <div className="mt-6 grid gap-6 text-sm text-on-surface-muted md:grid-cols-2">
              <p>Selected photography courtesy of Unsplash photographers: {photographers.join(", ")}.</p>
              <p>
                Furniture models, textures and lighting in the 3D house are from Poly Haven (CC0). Renders
                of the studio&rsquo;s own projects and the walkthrough films were supplied by the studio.
              </p>
            </div>
          </details>
        </div>
      </section>
    </>
  );
}
