import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import Testimonials from "@/components/site/Testimonials";
import CtaLink from "@/components/site/CtaLink";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { getTestimonials } from "@/lib/content";

// Content is read from the data cache, refreshed when the desk saves (app/api/refresh); this is only a backstop.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Client reviews",
  description:
    "What clients say about working with Iconic — recommendations left on the studio's own page, in the language they were written in.",
};

export default async function ReviewsPage() {
  const reviews = await getTestimonials();

  return (
    <>
      <PageHeader
        sheet="05"
        eyebrow="Client reviews"
        title={
          <>
            In their <em>own words.</em>
          </>
        }
        lead="Every recommendation here was left by a client on the studio's own page. The Arabic ones are kept as they were written, with an English reading beneath."
        aside={
          <p className="annotation text-on-surface-faint">
            {String(reviews.length).padStart(2, "0")} reviews
          </p>
        }
      />

      <Testimonials items={reviews} showHeading={false} />

      <section data-surface="day" className="bg-surface pb-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet grid gap-12 border-t border-rule pt-16 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8 text-accent">Your project</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              See the work <em>behind the words.</em>
            </SplitHeading>
          </div>
          <Reveal className="flex flex-wrap items-center gap-3 lg:col-span-4 lg:col-start-9">
            <CtaLink href="/projects">See the work</CtaLink>
            <CtaLink href="/contact" variant="outline">
              Find us
            </CtaLink>
          </Reveal>
        </div>
      </section>
    </>
  );
}
