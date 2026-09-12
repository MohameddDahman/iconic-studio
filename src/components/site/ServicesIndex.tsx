"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { RevealImage } from "@/components/motion/Reveal";
import { scrollToTarget } from "@/components/motion/ScrollSync";
import { cn } from "@/lib/utils";
import type { Discipline } from "@/lib/practice";

/**
 * Every discipline in full. A sticky index on the left marks the one you are
 * reading and jumps to any other; each block alternates its photograph side.
 */
export default function ServicesIndex({ items }: { items: Discipline[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const triggers = gsap.utils.toArray<HTMLElement>("[data-block]", rootRef.current).map((block, i) =>
        ScrollTrigger.create({
          trigger: block,
          start: "top 55%",
          end: "bottom 55%",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        }),
      );
      return () => triggers.forEach((t) => t.kill());
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} data-surface="day" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet grid gap-16 lg:grid-cols-12 lg:gap-10">
        <nav aria-label="Services" className="hidden lg:col-span-3 lg:block">
          <ol className="sticky top-32 flex flex-col gap-0.5">
            {items.map((d, i) => (
              <li key={d.id}>
                <a
                  href={`#${d.id}`}
                  onClick={(e) => {
                    const el = document.getElementById(d.id);
                    if (!el) return;
                    e.preventDefault();
                    scrollToTarget(el, -110);
                  }}
                  aria-current={i === active ? "true" : undefined}
                  className={cn(
                    "group flex items-baseline gap-3 py-2 transition-colors duration-500",
                    i === active ? "text-on-surface" : "text-on-surface-faint hover:text-on-surface-muted",
                  )}
                >
                  <span className="annotation w-6">{d.n}</span>
                  <span className="text-sm">{d.name}</span>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "ml-auto h-px bg-accent transition-[width] duration-500 ease-cut",
                      i === active ? "w-8" : "w-0",
                    )}
                  />
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-[var(--spacing-bay)] lg:col-span-9">
          {items.map((d, i) => (
            <article
              key={d.id}
              id={d.id}
              data-block
              className="grid scroll-mt-28 gap-8 border-t border-rule pt-10 md:grid-cols-9 md:gap-10"
            >
              <RevealImage className={cn("relative aspect-[4/3] bg-plaster-2 md:col-span-5", i % 2 === 1 && "md:order-2")}>
                <div className="relative h-full w-full">
                  <Image
                    src={d.media.src}
                    alt={d.media.alt}
                    fill
                    sizes="(min-width: 1024px) 40vw, (min-width: 768px) 55vw, 100vw"
                    quality={82}
                    placeholder={d.media.blurDataURL ? "blur" : "empty"}
                    blurDataURL={d.media.blurDataURL}
                    className="object-cover"
                  />
                </div>
              </RevealImage>
              <div className="flex flex-col md:col-span-4">
                <span className="annotation text-accent">{d.n}</span>
                <h2 className="inked mt-3 text-d3 leading-[0.98] tracking-[-0.015em]">{d.name}</h2>
                <p className="mt-3 text-sm text-on-surface-faint">{d.line}</p>
                <p className="mt-6 text-on-surface-muted">{d.body}</p>
                <ul className="mt-8 grid grid-cols-1 gap-x-6 gap-y-3 border-t border-rule pt-6 text-sm sm:grid-cols-2">
                  {d.includes.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <span aria-hidden="true" className="h-px w-3 shrink-0 bg-accent" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
