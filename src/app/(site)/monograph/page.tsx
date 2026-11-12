import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import BookVolume from "@/components/site/BookVolume";
import CtaLink from "@/components/site/CtaLink";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { getProjects, getSettings, getSpreads } from "@/lib/content";
import { buildBook } from "@/lib/book";
import copy from "@/lib/monograph-pdf.json";

// Content is read from the data cache, refreshed when the desk saves (app/api/refresh); this is only a backstop.
export const revalidate = 3600;

/** The book as a PDF, printed from its own pages by scripts/build-monograph-pdf.mjs. */
const COPY_HREF = "/monograph/iconic-volume-i.pdf";

export const metadata: Metadata = {
  title: "Monograph",
  description: "The studio's work bound into one volume — open the cover and turn the pages.",
};

export default async function MonographPage() {
  const [spreads, projects, settings] = await Promise.all([getSpreads(), getProjects(), getSettings()]);
  const pages = buildBook(spreads, projects, settings);
  const megabytes = (copy.bytes / 1024 / 1024).toFixed(1);

  return (
    <>
      <PageHeader
        sheet="03"
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
            <p className="eyebrow mb-8 text-accent">A copy to keep</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              Take the volume <em>with you.</em>
            </SplitHeading>
          </div>
          <Reveal className="flex flex-col items-start gap-8 lg:col-span-4 lg:col-start-9">
            <p className="text-on-surface-muted">
              The same book you can turn through above, page for page — to keep, to send on, or to print.
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
              <CtaLink href={COPY_HREF} download={`${settings.name} Volume I.pdf`}>
                Request a copy
              </CtaLink>
              <p className="annotation text-on-surface-faint">
                PDF · {copy.pages} pages · {megabytes} MB
              </p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
