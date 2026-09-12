"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import CtaLink from "./CtaLink";

export interface Stat {
  value: number;
  suffix?: string;
  label: string;
}

/**
 * The studio in one sentence, read at the pace of the scroll: words light up
 * as you move through them. Figures count up once, when they arrive.
 */
export default function IntroStatement({ statement, stats }: { statement: string; stats: Stat[] }) {
  const rootRef = useRef<HTMLElement>(null);
  const words = statement.split(" ");

  useGSAP(
    () => {
      const root = rootRef.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        // Plays once on arrival rather than tracking every scroll frame, so
        // it costs nothing while the page is being scrolled.
        gsap.fromTo(
          root.querySelectorAll("[data-word]"),
          { opacity: 0.14 },
          {
            opacity: 1,
            duration: 0.7,
            ease: "power1.out",
            stagger: 0.035,
            scrollTrigger: { trigger: root.querySelector("[data-statement]"), start: "top 75%", once: true },
          },
        );

        root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const counter = { v: 0 };
          el.textContent = "0";
          gsap.to(counter, {
            v: target,
            duration: 2.2,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
            onUpdate: () => {
              el.textContent = String(Math.round(counter.v));
            },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} data-surface="night" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet grid gap-12 lg:grid-cols-12 lg:gap-10">
        <p className="eyebrow text-accent lg:col-span-3 lg:pt-4">(01) The studio</p>

        <div className="lg:col-span-9">
          <p data-statement className="inked text-d3 leading-[1.1] tracking-[-0.015em]">
            {words.map((word, i) => (
              <span key={i} data-word>
                {word}{" "}
              </span>
            ))}
          </p>

          <dl className="mt-16 grid grid-cols-2 gap-x-6 gap-y-10 border-t border-rule pt-10 md:mt-20 md:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <dt className="sr-only">{stat.label}</dt>
                <dd>
                  <span className="inked block text-d2 leading-none text-accent tabular-nums">
                    <span data-count={stat.value}>{stat.value}</span>
                    {stat.suffix}
                  </span>
                  <span className="eyebrow mt-4 block text-on-surface-faint">{stat.label}</span>
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-14">
            <CtaLink href="/studio" variant="outline">
              About the studio
            </CtaLink>
          </div>
        </div>
      </div>
    </section>
  );
}
