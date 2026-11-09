"use client";

import { useState } from "react";
import Image from "next/image";
import TransitionLink from "@/components/motion/TransitionLink";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import CtaLink from "./CtaLink";
import { cn } from "@/lib/utils";
import type { Discipline } from "@/lib/practice";

/**
 * Everything the studio designs, as an index. Pointing at a discipline wipes
 * its photograph into the frame beside the list; on a phone each row carries
 * its own thumbnail instead.
 */
export default function Disciplines({ items }: { items: Discipline[] }) {
  const [active, setActive] = useState(0);
  const current = items[active];

  return (
    <section data-surface="day" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8 text-accent">(02) What we design</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              Everything <em>inside</em> the walls.
            </SplitHeading>
          </div>
          <Reveal className="flex flex-col items-start gap-8 lg:col-span-4 lg:col-start-9">
            <p className="text-lead leading-[1.55] text-on-surface-muted">
              From a single bathroom to a hotel lobby — every discipline an interior needs, designed
              and delivered by one studio.
            </p>
            <CtaLink href="/services" variant="outline">
              All services
            </CtaLink>
          </Reveal>
        </div>

        <div className="mt-16 grid gap-12 lg:mt-24 lg:grid-cols-12 lg:gap-10">
          <ul className="border-t border-rule lg:col-span-7">
            {items.map((d, i) => {
              const on = i === active;
              return (
                <li key={d.id} className="border-b border-rule">
                  <TransitionLink
                    href={`/services#${d.id}`}
                    onPointerEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    className="group grid cursor-pointer grid-cols-[2.25rem_1fr_auto] items-center gap-4 py-5 md:grid-cols-[4rem_1fr_auto] md:py-7"
                  >
                    <span
                      className={cn(
                        "annotation transition-colors duration-500",
                        on ? "text-accent" : "text-on-surface-faint",
                      )}
                    >
                      {d.n}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cn(
                          "inked block text-d4 leading-[1.05] transition-transform duration-700 ease-cut",
                          on && "lg:translate-x-3",
                        )}
                      >
                        {d.name}
                      </span>
                      <span className="mt-1.5 block text-sm text-on-surface-muted">{d.line}</span>
                    </span>

                    <span className="relative size-14 overflow-hidden bg-plaster-2 lg:hidden">
                      <Image
                        src={d.media.src}
                        alt=""
                        fill
                        sizes="56px"
                        quality={60}
                        className="object-cover"
                      />
                    </span>
                    <span
                      className={cn(
                        "hidden size-11 place-items-center rounded-full border transition-[background-color,border-color,color] duration-500 lg:grid",
                        on ? "border-on-surface bg-on-surface text-surface" : "border-rule-strong",
                      )}
                    >
                      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-3.5 -rotate-45">
                        <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    </span>
                  </TransitionLink>
                </li>
              );
            })}
          </ul>

          <div className="relative hidden lg:col-span-5 lg:block">
            <div className="sticky top-28">
              <div className="relative aspect-[4/5] overflow-hidden bg-plaster-2">
                {items.map((d, i) => (
                  <div
                    key={d.id}
                    aria-hidden={i !== active}
                    className={cn(
                      "absolute inset-0 transition-[clip-path] duration-[1200ms] ease-cut",
                      i === active ? "z-10 [clip-path:inset(0%_0%_0%_0%)]" : "z-0 [clip-path:inset(0%_0%_100%_0%)]",
                    )}
                  >
                    <Image
                      src={d.media.src}
                      alt={d.media.alt}
                      fill
                      sizes="(min-width: 1024px) 40vw, 1px"
                      quality={72}
                      placeholder={d.media.blurDataURL ? "blur" : "empty"}
                      blurDataURL={d.media.blurDataURL}
                      className={cn(
                        "object-cover transition-transform duration-[1800ms] ease-settle",
                        i === active ? "scale-100" : "scale-110",
                      )}
                    />
                  </div>
                ))}
                <span className="annotation absolute top-5 left-5 z-20 text-bone mix-blend-difference">
                  {current.n} / {String(items.length).padStart(2, "0")}
                </span>
              </div>
              <ul className="mt-5 flex flex-wrap gap-2" aria-label={`${current.name} includes`}>
                {current.includes.map((item) => (
                  <li key={item} className="rounded-full border border-rule px-3.5 py-1.5 text-xs text-on-surface-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
