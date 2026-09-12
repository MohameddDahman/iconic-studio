import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import BookVolume from "@/components/site/BookVolume";
import CtaLink from "@/components/site/CtaLink";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { getProjects, getSettings, getSpreads } from "@/lib/content";
import { buildBook } from "@/lib/book";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Monograph",
  description: "The studio's work bound into one volume — open the cover and turn the pages.",
};

export default async function MonographPage() {
  const [spreads, projects, settings] = await Promise.all([getSpreads(), getProjects(), getSettings()]);
  const pages = buildBook(spreads, projects, settings);

  return (
    <>
      <PageHeader
        sheet="04"
        eyebrow="The monograph"
        title={
          <>
            The work, <em>bound.</em>
          </>
        }
        lead="Every project set as printed spreads in one volume. Open the cover, then turn the pages with the arrows, the keyboard, or by dragging a corner."
        aside={
          <p className="annotation text-on-surface-faint">
            {String(spreads.length).padStart(2, "0")} projects · {pages.length} pages
          </p>
        }
      />

      <BookVolume pages={pages} studio={settings.name} />

      <section data-surface="day" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8 text-accent">In print</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              Want it as a <em>printed copy?</em>
            </SplitHeading>
          </div>
          <Reveal className="flex flex-col items-start gap-8 lg:col-span-4 lg:col-start-9">
            <p className="text-on-surface-muted">
              We print a short run of the volume for clients and partners. Ask, and we will put one aside
              for you.
            </p>
            <CtaLink href="/contact">Request a copy</CtaLink>
          </Reveal>
        </div>
      </section>
    </>
  );
}
