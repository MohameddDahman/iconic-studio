"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import PairedImage from "./PairedImage";
import LampSwitch from "./LampSwitch";
import { cn } from "@/lib/utils";
import { isPortrait } from "@/lib/media";
import type { Media } from "@/lib/types";

/**
 * The gallery lays itself out from the photographs rather than from a fixed
 * template: portraits pair up two to a row, landscapes run full width. Each
 * frame drifts slightly against the scroll; frames rendered twice carry the
 * lamp switch.
 */
function layout(images: Media[]) {
  const rows: Media[][] = [];
  let i = 0;
  while (i < images.length) {
    const current = images[i];
    const next = images[i + 1];
    if (next && isPortrait(current) && isPortrait(next)) {
      rows.push([current, next]);
      i += 2;
    } else {
      rows.push([current]);
      i += 1;
    }
  }
  return rows;
}

export default function ProjectGallery({ images }: { images: Media[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const rows = layout(images);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-figure]", rootRef.current).forEach((figure) => {
          gsap.from(figure, {
            opacity: 0,
            y: 30,
            duration: 1,
            ease: "settle",
            scrollTrigger: { trigger: figure, start: "top 88%", once: true },
          });
          const layer = figure.querySelector("[data-parallax]");
          if (layer) {
            gsap.fromTo(
              layer,
              { yPercent: -5 },
              {
                yPercent: 5,
                ease: "none",
                scrollTrigger: { trigger: figure, start: "top bottom", end: "bottom top", scrub: true },
              },
            );
          }
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} data-surface="night" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet">
        <div className="mb-12 flex items-baseline justify-between gap-6 border-b border-rule pb-5">
          <h2 className="eyebrow text-on-surface-faint">Gallery</h2>
          <span className="annotation text-on-surface-faint">{String(images.length).padStart(2, "0")} images</span>
        </div>

        <div className="flex flex-col gap-[var(--spacing-bay)]">
          {rows.map((row, ri) => (
            <div key={ri} className={cn("grid gap-6 md:gap-8", row.length === 2 && "md:grid-cols-2")}>
              {row.map((media) => (
                <figure key={media.src} data-figure>
                  <div
                    className="relative overflow-hidden bg-umber"
                    style={{ aspectRatio: `${media.width} / ${media.height}` }}
                  >
                    <div data-parallax className="absolute inset-x-0 -top-[6%] -bottom-[6%]">
                      <PairedImage
                        media={media}
                        sizes={row.length === 2 ? "(min-width: 768px) 50vw, 100vw" : "100vw"}
                        showSwitch={false}
                        lamp={{ x: 50, y: 10 }}
                      />
                    </div>
                    {media.night && (
                      <div className="absolute right-4 bottom-4 z-10 md:right-6 md:bottom-6">
                        <LampSwitch tone="glass" />
                      </div>
                    )}
                  </div>
                  {media.caption && (
                    <figcaption className="annotation mt-4 text-on-surface-faint">{media.caption}</figcaption>
                  )}
                </figure>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
