import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";
import type { Testimonial } from "@/lib/types";

/**
 * Real recommendations. One is set large; the rest sit in a hairline grid.
 * Arabic reviews are set in Arabic, right to left, with the English beneath —
 * showing only a translation would be putting words in a client's mouth.
 */
export default function Testimonials({
  items,
  index = "(07)",
  showHeading = true,
}: {
  items: Testimonial[];
  index?: string;
  /** Off on the reviews page, where the page header already names them. */
  showHeading?: boolean;
  /** Every review is always shown; kept so older call sites still type-check. */
  showAll?: boolean;
}) {
  if (items.length === 0) return null;

  const featured = items.find((item) => item.lang !== "ar") ?? items[0];
  const others = items.filter((item) => item !== featured);
  const long = featured.quote.length > 170;

  return (
    <section data-surface="day" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet">
        {showHeading && (
          <div className="grid gap-10 border-b border-rule pb-12 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-8 text-accent">{index} Clients</p>
              <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
                In their <em>own words.</em>
              </SplitHeading>
            </div>
            <p className="annotation text-on-surface-faint lg:col-span-4 lg:col-start-9 lg:text-right">
              {String(items.length).padStart(2, "0")} reviews · left on the studio&rsquo;s page
            </p>
          </div>
        )}

        <Reveal as="figure" className="grid gap-8 py-16 md:py-20 lg:grid-cols-12 lg:gap-10">
          <span aria-hidden="true" className="inked text-[7rem] leading-[0.7] text-accent lg:col-span-1 lg:text-[9rem]">
            &ldquo;
          </span>
          <div className="lg:col-span-10">
            <blockquote
              className={cn(
                "inked leading-[1.12] tracking-[-0.01em] text-balance",
                long ? "text-d4 lg:text-[clamp(2rem,1.4rem+1.6vw,3rem)]" : "text-d3",
              )}
            >
              {featured.quote}
            </blockquote>
            <figcaption className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2">
              <span className="text-lg font-[520]">{featured.author}</span>
              <span className="annotation text-on-surface-faint">
                {[featured.role, featured.source, featured.date].filter(Boolean).join(" · ")}
              </span>
            </figcaption>
          </div>
        </Reveal>

        {others.length > 0 && (
          <Reveal stagger className="grid border-t border-l border-rule md:grid-cols-2">
            {others.map((item) => {
              const arabic = item.lang === "ar";
              return (
                <figure
                  key={item.id}
                  className="flex h-full flex-col justify-between gap-8 border-r border-b border-rule p-7 md:p-10"
                >
                  <div className="flex flex-col gap-5">
                    <blockquote
                      {...(arabic ? { lang: "ar", dir: "rtl" } : null)}
                      className={cn(
                        "text-balance",
                        arabic ? "text-lead leading-[1.85] font-light" : "inked text-[1.65rem] leading-[1.2]",
                      )}
                    >
                      {item.quote}
                    </blockquote>
                    {item.translation && (
                      <p className="border-l border-accent/50 pl-4 text-sm text-on-surface-muted">{item.translation}</p>
                    )}
                  </div>
                  <figcaption className="flex flex-wrap items-baseline justify-between gap-3 border-t border-rule pt-5">
                    <span className="font-[520]">{item.author}</span>
                    <span className="annotation text-on-surface-faint">
                      {[item.source, item.date].filter(Boolean).join(" · ")}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </Reveal>
        )}
      </div>
    </section>
  );
}
