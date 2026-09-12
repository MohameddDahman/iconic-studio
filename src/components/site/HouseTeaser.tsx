import Image from "next/image";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal, RevealImage } from "@/components/motion/Reveal";
import Blueprint from "./Blueprint";
import CtaLink from "./CtaLink";

/** The way into /inside: the plan drawing itself, and a frame from the film laid over it. */
export default function HouseTeaser({ index = "(05)" }: { index?: string }) {
  return (
    <section
      data-surface="night"
      className="relative overflow-hidden bg-surface py-[var(--spacing-bay-lg)] text-on-surface"
    >
      <div className="sheet grid items-center gap-20 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <p className="eyebrow mb-8 text-accent">{index} The house</p>
          <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
            Walk through a home <em>before it exists.</em>
          </SplitHeading>
          <Reveal className="mt-8 flex flex-col items-start gap-10">
            <p className="max-w-md text-lead leading-[1.55] text-on-surface-muted">
              Scroll from the first plan to the finished rooms — a model that draws itself, then a
              film through the spaces. It is how our clients see a project before a single wall is
              built.
            </p>
            <CtaLink href="/inside">Enter the house</CtaLink>
            <dl className="grid w-full grid-cols-3 gap-6 border-t border-rule pt-8">
              {[
                ["Drawing", "Plan"],
                ["Model", "3D"],
                ["Film", "Walk"],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="eyebrow text-on-surface-faint">{label}</dt>
                  <dd className="inked mt-2 text-[2rem] leading-none">{value}</dd>
                </div>
              ))}
            </dl>
          </Reveal>
        </div>

        <div className="relative pb-10 lg:col-span-7 lg:pb-0">
          <Blueprint drawing="plan" tone="blueprint" start="top 80%" className="w-full ring-1 ring-white/10" />
          <RevealImage
            from="left"
            className="absolute -bottom-2 left-3 w-[56%] shadow-[0_40px_80px_-30px_rgba(0,0,0,0.85)] ring-1 ring-white/15 md:-left-8 lg:-bottom-12"
          >
            <div className="relative aspect-video">
              <Image
                src="/film/poster.webp"
                alt="A frame from the walkthrough film: an open-plan living room and kitchen"
                fill
                sizes="(min-width: 1024px) 32vw, 56vw"
                quality={80}
                className="object-cover"
              />
            </div>
          </RevealImage>
        </div>
      </div>
    </section>
  );
}
