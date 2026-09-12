import Image from "next/image";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import type { ReactNode } from "react";
import type { Media } from "@/lib/types";

/**
 * The opening of every inner page: index and name, a large title, and the one
 * paragraph that says what you are looking at. With `media` it sits over a
 * darkened photograph.
 */
export default function PageHeader({
  sheet,
  eyebrow,
  title,
  lead,
  aside,
  media,
  surface = "night",
}: {
  sheet: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  media?: Media;
  surface?: "night" | "day";
}) {
  return (
    <section
      data-surface={surface}
      className="cove relative isolate overflow-hidden bg-surface text-on-surface"
    >
      {media && (
        <div aria-hidden="true" className="absolute inset-0 -z-10">
          <Image
            src={media.src}
            alt=""
            fill
            preload
            sizes="100vw"
            quality={80}
            placeholder={media.blurDataURL ? "blur" : "empty"}
            blurDataURL={media.blurDataURL}
            className="object-cover opacity-45"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-night/70 via-night/60 to-night" />
        </div>
      )}

      <div className="sheet relative pt-40 pb-16 md:pt-52 md:pb-24">
        <p className="mb-10 flex items-center gap-4 text-on-surface-faint">
          <span className="annotation text-accent">{sheet}</span>
          <span aria-hidden="true" className="block h-px w-12 bg-current opacity-50" />
          <span className="eyebrow">{eyebrow}</span>
        </p>

        <div className="grid gap-10 lg:grid-cols-12 lg:items-end lg:gap-10">
          <div className="lg:col-span-8">
            <SplitHeading
              as="h1"
              immediate
              delay={0.25}
              className="inked text-d2 leading-[0.94] tracking-[-0.02em]"
            >
              {title}
            </SplitHeading>
          </div>

          {(lead || aside) && (
            <Reveal delay={0.5} className="flex flex-col gap-6 lg:col-span-4 lg:pb-3">
              {lead && <p className="text-lead leading-[1.55] text-on-surface-muted">{lead}</p>}
              {aside}
            </Reveal>
          )}
        </div>
      </div>
    </section>
  );
}
