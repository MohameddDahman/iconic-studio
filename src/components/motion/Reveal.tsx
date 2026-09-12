"use client";

import { useRef, type ElementType, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger direct children instead of moving the block as one. */
  stagger?: boolean;
  delay?: number;
  /** Travel distance in px. Kept small so it reads as a settle, not a slide. */
  y?: number;
  start?: string;
}

/**
 * The workhorse scroll reveal. Deliberately restrained — the loud motion is
 * spent on the hero, the walkthrough and the route cut, so everything else
 * only needs to arrive without drawing attention to itself.
 */
export function Reveal({
  children,
  as: Tag = "div",
  className,
  stagger = false,
  delay = 0,
  y = 18,
  start = "top 86%",
}: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const targets = stagger ? Array.from(el.children) : el;
        gsap.from(targets, {
          opacity: 0,
          y,
          duration: 0.85,
          delay,
          ease: "settle",
          stagger: stagger ? 0.07 : 0,
          scrollTrigger: { trigger: el, start, once: true },
        });
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [stagger, delay, y, start] },
  );

  return (
    <Tag ref={ref} className={className}>
      {children}
    </Tag>
  );
}

interface RevealImageProps {
  children: ReactNode;
  className?: string;
  /** Which edge the image is uncovered from. */
  from?: "bottom" | "left" | "right";
  delay?: number;
  start?: string;
}

/**
 * Photographs are uncovered rather than faded: the frame opens from one edge
 * while the picture inside settles from a slight zoom, the way a print is
 * slid out of a sleeve. The first child is the element that scales.
 */
export function RevealImage({
  children,
  className,
  from = "bottom",
  delay = 0,
  start = "top 85%",
}: RevealImageProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inner = el.firstElementChild;

      const hidden = {
        bottom: "inset(100% 0% 0% 0%)",
        left: "inset(0% 100% 0% 0%)",
        right: "inset(0% 0% 0% 100%)",
      }[from];

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ delay, scrollTrigger: { trigger: el, start, once: true } });
        tl.fromTo(
          el,
          { clipPath: hidden },
          { clipPath: "inset(0% 0% 0% 0%)", duration: 1.35, ease: "cut", clearProps: "clipPath" },
        );
        if (inner) {
          tl.fromTo(inner, { scale: 1.22 }, { scale: 1, duration: 1.8, ease: "settle" }, 0);
        }
      });
      return () => mm.revert();
    },
    { scope: ref, dependencies: [from, delay, start] },
  );

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}

interface ParallaxProps {
  children: ReactNode;
  className?: string;
  /** Percentage of its own height the layer travels across the scroll range. */
  amount?: number;
}

/**
 * Depth for imagery only. Never wrap body copy in this — parallaxed reading
 * text is a motion-sickness trigger and hurts comprehension.
 */
export function Parallax({ children, className, amount = 12 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el) return;
      const inner = el.firstElementChild;
      if (!inner) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          inner,
          { yPercent: -amount / 2 },
          {
            yPercent: amount / 2,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          },
        );
      });

      return () => mm.revert();
    },
    { scope: ref, dependencies: [amount] },
  );

  return (
    <div ref={ref} className={cn("overflow-hidden", className)}>
      {children}
    </div>
  );
}
