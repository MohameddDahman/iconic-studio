"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import SplitHeading from "@/components/motion/SplitHeading";
import { cn } from "@/lib/utils";

interface Stage {
  n: string;
  name: string;
  note: string;
}

/**
 * Six stages, read one at a time. The heading and the stage number hold still
 * while the steps pass; a line fills as the project moves toward handover.
 */
export default function ProcessSteps({ stages, index = "(06)" }: { stages: readonly Stage[]; index?: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      const root = rootRef.current!;
      const triggers = gsap.utils.toArray<HTMLElement>("[data-step]", root).map((step, i) =>
        ScrollTrigger.create({
          trigger: step,
          start: "top 58%",
          end: "bottom 58%",
          onToggle: (self) => {
            if (self.isActive) setActive(i);
          },
        }),
      );

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          root.querySelector("[data-progress]"),
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: { trigger: root.querySelector("[data-steps]"), start: "top 58%", end: "bottom 58%", scrub: true },
          },
        );
      });

      return () => {
        triggers.forEach((t) => t.kill());
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} data-surface="night" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet grid gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <p className="eyebrow mb-8 text-accent">{index} Process</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              From first visit to <em>final styling.</em>
            </SplitHeading>
            <p className="mt-8 max-w-md text-lead leading-[1.55] text-on-surface-muted">
              Six stages, one team. Nothing is ordered before it is drawn, and nothing is built before
              you have seen it by day and after dark.
            </p>
            <div className="mt-14 hidden items-end gap-4 lg:flex" aria-hidden="true">
              <span className="relative block h-[8.5rem] overflow-hidden">
                {stages.map((stage, i) => (
                  <span
                    key={stage.n}
                    className={cn(
                      "inked absolute bottom-0 left-0 block text-[9rem] leading-[0.8] text-accent tabular-nums transition-[transform,opacity] duration-700 ease-cut",
                      i === active ? "translate-y-0 opacity-100" : i < active ? "-translate-y-full opacity-0" : "translate-y-full opacity-0",
                    )}
                  >
                    {stage.n}
                  </span>
                ))}
                <span className="invisible inked block text-[9rem] leading-[0.8]">00</span>
              </span>
              <span className="annotation pb-3 text-on-surface-faint">/ {String(stages.length).padStart(2, "0")}</span>
            </div>
          </div>
        </div>

        <ol data-steps className="relative lg:col-span-6 lg:col-start-7">
          <span aria-hidden="true" className="absolute top-0 left-0 h-full w-px bg-rule">
            <span data-progress className="block h-full w-full origin-top bg-accent" />
          </span>
          {stages.map((stage, i) => (
            <li
              key={stage.n}
              data-step
              className={cn(
                "py-10 pl-8 transition-opacity duration-700 md:pl-12 lg:py-14",
                i === active ? "lg:opacity-100" : "lg:opacity-35",
              )}
            >
              <span className="annotation text-accent">{stage.n}</span>
              <h3 className="inked mt-3 text-d4 leading-[1.05]">{stage.name}</h3>
              <p className="mt-4 max-w-md text-on-surface-muted">{stage.note}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
