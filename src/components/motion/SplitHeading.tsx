"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Play on mount instead of waiting for the element to be scrolled into view. */
  immediate?: boolean;
  delay?: number;
  /** Stagger between lines. */
  each?: number;
}

/**
 * Headlines rise line by line out of their own mask, tipping upright as they
 * arrive. Transform-only, so it stays cheap at display sizes. The split is
 * rebuilt when fonts load or the width changes (autoSplit), and the animation
 * is created inside onSplit so a re-split never leaves lines half-revealed.
 */
export default function SplitHeading({
  children,
  as: Tag = "h2",
  className,
  immediate = false,
  delay = 0,
  each = 0.085,
}: Props) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set(el, { autoAlpha: 1 });
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const split = SplitText.create(el, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit(self) {
            gsap.set(el, { autoAlpha: 1 });
            return gsap.from(self.lines, {
              yPercent: 115,
              rotate: 2.2,
              transformOrigin: "0% 100%",
              duration: 1.2,
              ease: "cut",
              stagger: each,
              delay,
              scrollTrigger: immediate ? undefined : { trigger: el, start: "top 88%", once: true },
            });
          },
        });

        return () => split.revert();
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [immediate, delay, each] },
  );

  return (
    // `invisible` prevents a flash of unsplit text; the noscript rule in the
    // root layout forces it back on if JS never runs.
    <Tag ref={ref} className={cn("split-heading invisible", className)}>
      {children}
    </Tag>
  );
}
