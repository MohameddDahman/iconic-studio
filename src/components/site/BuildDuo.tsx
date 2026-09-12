"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useFrameSequence, type FrameSet } from "@/components/motion/useFrameSequence";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { clamp, cn } from "@/lib/utils";

export interface BuildStep {
  at: number;
  title: string;
  body: string;
}

interface Film {
  frames: FrameSet;
  poster: string;
  caption: string;
}

/**
 * Two empty rooms that finish themselves as the section scrolls past — a
 * bedroom and a living room, driven by the same position so they build in
 * step. The section scrolls normally; nothing holds the page.
 */
export default function BuildDuo({
  label,
  title,
  intro,
  tall,
  wide,
  steps,
}: {
  label: string;
  title: string;
  intro: string;
  /** Portrait film. */
  tall: Film;
  /** Landscape film. */
  wide: Film;
  steps: BuildStep[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const tallRef = useRef<HTMLCanvasElement>(null);
  const wideRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();

  const tallSequence = useFrameSequence(tallRef, { landscape: tall.frames, fit: "cover" });
  const wideSequence = useFrameSequence(wideRef, { landscape: wide.frames, fit: "cover" });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    const apply = (progress: number) => {
      const build = clamp((progress - 0.15) / 0.62);
      tallSequence.current?.seek(build);
      wideSequence.current?.seek(build);
      if (barRef.current) barRef.current.style.transform = `scaleY(${build})`;
      let index = 0;
      steps.forEach((step, i) => {
        if (build >= step.at) index = i;
      });
      if (index !== activeRef.current) {
        activeRef.current = index;
        setActive(index);
      }
    };

    const trigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });

    return () => trigger.kill();
  }, [reduced, steps, tallSequence, wideSequence]);

  return (
    <section
      ref={sectionRef}
      data-surface="day"
      aria-label={title}
      className="relative overflow-hidden bg-surface py-[var(--spacing-bay)] text-on-surface"
    >
      <div className="sheet grid items-center gap-10 lg:grid-cols-12 lg:gap-10">
        <div className="flex flex-col justify-center lg:col-span-4">
          <p className="eyebrow text-accent">{label}</p>
          <h2 className="inked mt-4 text-[clamp(2.2rem,1.4rem+2.6vw,4rem)] leading-[0.98] tracking-[-0.02em]">{title}</h2>
          <p className="mt-5 max-w-sm text-on-surface-muted">{intro}</p>

          <ol className="relative mt-8 border-l border-rule">
            <span
              ref={barRef}
              aria-hidden="true"
              className="absolute top-0 -left-px block h-full w-px origin-top scale-y-0 bg-accent"
            />
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={cn("py-2.5 pl-6 transition-opacity duration-500", i === active ? "opacity-100" : "opacity-40")}
              >
                <span className="annotation mr-3 text-accent">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-[520]">{step.title}</span>
                <span
                  className={cn(
                    "grid transition-[grid-template-rows] duration-500 ease-cut",
                    i === active ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <span className="overflow-hidden text-sm text-on-surface-muted">
                    <span className="block pt-1.5">{step.body}</span>
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="grid grid-cols-12 items-center gap-4 lg:col-span-8 lg:gap-6">
          <figure className="col-span-12 sm:col-span-7">
            <div className="relative aspect-[640/458] overflow-hidden bg-plaster-2 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.45)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={wide.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              {!reduced && <canvas ref={wideRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />}
            </div>
            <figcaption className="annotation mt-3 text-on-surface-faint">{wide.caption}</figcaption>
          </figure>
          <figure className="col-span-8 col-start-3 sm:col-span-5 sm:col-start-auto">
            <div className="relative mx-auto aspect-[9/16] max-h-[78svh] overflow-hidden bg-plaster-2 shadow-[0_30px_60px_-35px_rgba(0,0,0,0.45)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={tall.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              {!reduced && <canvas ref={tallRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />}
            </div>
            <figcaption className="annotation mt-3 text-on-surface-faint">{tall.caption}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
