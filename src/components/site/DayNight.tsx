"use client";

import PairedImage from "./PairedImage";
import LampSwitch from "./LampSwitch";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { useLights } from "@/lib/lights";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/types";

/**
 * The same two rooms by daylight and after dark — the studio's own renders.
 * One lamp switches both, and the section itself warms when the lights go on.
 */
export default function DayNight({
  living,
  bath,
  livingCaption,
  bathCaption,
}: {
  living: Media;
  bath: Media;
  livingCaption: string;
  bathCaption: string;
}) {
  const { mode } = useLights();
  const evening = mode === "evening";

  return (
    <section
      data-surface="night"
      className="relative overflow-hidden bg-surface py-[var(--spacing-bay-lg)] text-on-surface"
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 bg-[radial-gradient(55%_45%_at_30%_55%,rgb(201_168_120/0.13),transparent_70%)] transition-opacity duration-[1600ms]",
          evening ? "opacity-100" : "opacity-0",
        )}
      />

      <div className="sheet relative">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8 text-accent">(03) Day &amp; evening</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              Every room is designed <em>twice.</em>
            </SplitHeading>
          </div>
          <Reveal className="flex flex-col items-start gap-8 lg:col-span-4 lg:col-start-9">
            <p className="text-lead leading-[1.55] text-on-surface-muted">
              Daylight decides the layout; the evening decides the mood. We render both and design
              the lighting so each one works. Turn the lamp on to see these rooms after dark.
            </p>
            <div className="relative">
              {!evening && (
                <span
                  aria-hidden="true"
                  className="absolute inset-0 animate-ping rounded-full border border-glow/50 [animation-duration:2.4s]"
                />
              )}
              <LampSwitch />
            </div>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-6 md:mt-20 lg:grid-cols-12">
          <figure className="lg:col-span-8">
            <div className="relative aspect-[10/7] overflow-hidden bg-umber">
              <PairedImage
                media={living}
                sizes="(min-width: 1024px) 66vw, 100vw"
                lamp={{ x: 50, y: 0 }}
                showSwitch={false}
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4 text-sm text-on-surface-muted">
              <span>{livingCaption}</span>
              <span className="annotation">{evening ? "Evening" : "Daylight"}</span>
            </figcaption>
          </figure>

          <figure className="lg:col-span-4">
            <div className="relative aspect-[9/10] overflow-hidden bg-umber">
              <PairedImage
                media={bath}
                sizes="(min-width: 1024px) 33vw, 100vw"
                lamp={{ x: 78, y: 18 }}
                showSwitch={false}
              />
            </div>
            <figcaption className="mt-4 flex items-center justify-between gap-4 text-sm text-on-surface-muted">
              <span>{bathCaption}</span>
              <span className="annotation">{evening ? "Evening" : "Daylight"}</span>
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
