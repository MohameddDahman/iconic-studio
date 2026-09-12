import Image from "next/image";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import CtaLink from "./CtaLink";
import type { Spread } from "@/lib/types";

/** The bound volume, shown as a fanned stack of its first spreads. */
export default function MonographTeaser({ spreads, index = "(08)" }: { spreads: Spread[]; index?: string }) {
  const shown = spreads.slice(0, 3);

  return (
    <section data-surface="night" className="cove relative overflow-hidden bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet grid items-center gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="eyebrow mb-8 text-accent">{index} The monograph</p>
          <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
            The work, <em>bound.</em>
          </SplitHeading>
          <Reveal className="mt-8 flex flex-col items-start gap-10">
            <p className="max-w-md text-lead leading-[1.55] text-on-surface-muted">
              Every project set as printed spreads in one volume — open the cover and turn the pages
              one at a time, the way the studio presents to clients.
            </p>
            <CtaLink href="/monograph">Open the book</CtaLink>
          </Reveal>
        </div>

        <Reveal className="lg:col-span-6 lg:col-start-7">
          <div className="relative mx-auto mt-[4%] aspect-[4/3] w-[86%] [perspective:1800px]">
            {shown.map((spread, i) => (
              <div
                key={spread.id}
                className="absolute inset-0 origin-bottom-left bg-bone p-3 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)] transition-transform duration-[1200ms] ease-settle"
                style={{
                  transform: `translate(${i * 5}%, ${i * -4}%) rotate(${(shown.length - 1 - i) * -2}deg)`,
                  zIndex: i,
                }}
              >
                <div className="relative h-full w-full overflow-hidden">
                  <Image
                    src={spread.media.src}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 45vw, 90vw"
                    quality={72}
                    placeholder={spread.media.blurDataURL ? "blur" : "empty"}
                    blurDataURL={spread.media.blurDataURL}
                    className="object-cover"
                  />
                  <div className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 bg-gradient-to-r from-transparent via-black/20 to-transparent" />
                </div>
                <span className="annotation absolute right-5 bottom-5 text-bone mix-blend-difference">
                  {String(spread.folio).padStart(3, "0")}
                </span>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
