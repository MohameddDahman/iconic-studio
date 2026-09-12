"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/** The name set edge to edge at the foot of every page, rising letter by letter. */
export default function FooterWordmark({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(ref.current!.querySelectorAll("[data-letter]"), {
          yPercent: 100,
          duration: 1.3,
          ease: "cut",
          stagger: 0.06,
          scrollTrigger: { trigger: ref.current, start: "top 96%", once: true },
        });
      });
      return () => mm.revert();
    },
    { scope: ref },
  );

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none flex select-none justify-between overflow-hidden px-[var(--spacing-gutter)]"
    >
      {text.split("").map((letter, i) => (
        <span
          key={i}
          data-letter
          className="block text-[21vw] leading-[0.8] font-[640] tracking-[-0.04em] text-on-surface/[0.08] uppercase [font-variation-settings:'wdth'_125]"
        >
          {letter}
        </span>
      ))}
    </div>
  );
}
