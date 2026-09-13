"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";
import { useFrameSequence, type FrameSet } from "@/components/motion/useFrameSequence";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { cn } from "@/lib/utils";

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
 * A film plays while nearly all of it is on screen: it starts once 85% of it has
 * risen into view and is finished while 85% of it still shows at the top, so no
 * step plays with much of the room cut off.
 */
const PLAY = { start: "85% bottom", end: "15% top" } as const;

const stepAt = (steps: BuildStep[], progress: number) =>
  steps.reduce((index, step, i) => (progress >= step.at ? i : index), 0);

const number = (i: number) => String(i + 1).padStart(2, "0");

/** The current step, laid over a film on a phone, where the list is not beside it. */
function Readout({ steps, step }: { steps: BuildStep[]; step: number }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 via-night/50 to-transparent px-4 pt-12 pb-3.5 text-bone sm:hidden"
    >
      <p className="annotation text-glow">
        {number(step)} / {String(steps.length).padStart(2, "0")}
      </p>
      <p className="mt-1.5 text-sm font-[520]">{steps[step].title}</p>
    </div>
  );
}

/**
 * Two empty rooms that finish themselves as they scroll into view. Side by side
 * they share one height and one position, so they build in step; on a phone they
 * stack, and each builds as it reaches the screen. The page scrolls normally —
 * nothing holds it.
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
  const pairRef = useRef<HTMLDivElement>(null);
  const wideFrameRef = useRef<HTMLDivElement>(null);
  const tallFrameRef = useRef<HTMLDivElement>(null);
  const wideRef = useRef<HTMLCanvasElement>(null);
  const tallRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const shown = useRef({ wide: 0, tall: 0 });
  const [wideStep, setWideStep] = useState(0);
  const [tallStep, setTallStep] = useState(0);
  const reduced = useReducedMotion();

  const wideSequence = useFrameSequence(wideRef, { landscape: wide.frames, fit: "cover" });
  const tallSequence = useFrameSequence(tallRef, { landscape: tall.frames, fit: "cover" });

  useEffect(() => {
    const pair = pairRef.current;
    const wideFrame = wideFrameRef.current;
    const tallFrame = tallFrameRef.current;
    if (reduced || !pair || !wideFrame || !tallFrame) return;

    const show = (which: "wide" | "tall", progress: number) => {
      const index = stepAt(steps, progress);
      if (shown.current[which] === index) return;
      shown.current[which] = index;
      (which === "wide" ? setWideStep : setTallStep)(index);
    };

    const follow = (trigger: Element, apply: (progress: number) => void) =>
      ScrollTrigger.create({
        trigger,
        ...PLAY,
        onUpdate: (self) => apply(self.progress),
        onRefresh: (self) => apply(self.progress),
      });

    const mm = gsap.matchMedia();

    // Side by side: one position drives both films, the steps and the progress lines.
    mm.add("(width >= 40rem)", () => {
      follow(pair, (progress) => {
        wideSequence.current?.seek(progress);
        tallSequence.current?.seek(progress);
        if (barRef.current) barRef.current.style.transform = `scaleY(${progress})`;
        if (railRef.current) railRef.current.style.transform = `scaleX(${progress})`;
        show("wide", progress);
        show("tall", progress);
      });
    });

    // Stacked: each film follows its own place on the screen.
    mm.add("(width < 40rem)", () => {
      follow(wideFrame, (progress) => {
        wideSequence.current?.seek(progress);
        show("wide", progress);
      });
      follow(tallFrame, (progress) => {
        tallSequence.current?.seek(progress);
        show("tall", progress);
      });
    });

    return () => mm.revert();
  }, [reduced, steps, tallSequence, wideSequence]);

  const wideRatio = wide.frames.width / wide.frames.height;
  const tallRatio = tall.frames.width / tall.frames.height;
  const current = steps[wideStep];

  return (
    <section data-surface="day" aria-label={title} className="bg-surface py-[var(--spacing-bay)] text-on-surface">
      <div className="sheet grid gap-y-12 lg:grid-cols-12 lg:items-center lg:gap-x-10">
        <div className="lg:col-span-4 lg:pr-4">
          <p className="eyebrow text-accent">{label}</p>
          <h2 className="inked mt-4 text-[clamp(2.2rem,1.4rem+2.6vw,4rem)] leading-[0.98] tracking-[-0.02em]">{title}</h2>
          <p className="mt-5 max-w-md text-on-surface-muted">{intro}</p>

          <ol className="relative mt-10 hidden border-l border-rule lg:block">
            <span
              ref={barRef}
              aria-hidden="true"
              className="absolute top-0 -left-px block h-full w-px origin-top scale-y-0 bg-accent"
            />
            {steps.map((step, i) => (
              <li
                key={step.title}
                className={cn("py-2.5 pl-6 transition-opacity duration-500", i === wideStep ? "opacity-100" : "opacity-40")}
              >
                <span className="annotation mr-3 text-accent">{number(i)}</span>
                <span className="font-[520]">{step.title}</span>
                <span
                  className={cn(
                    "grid transition-[grid-template-rows] duration-500 ease-cut",
                    i === wideStep ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <span className="overflow-hidden text-sm text-on-surface-muted">
                    <span className="block pt-1.5">{step.body}</span>
                  </span>
                </span>
              </li>
            ))}
          </ol>

          <ol className="sr-only lg:hidden">
            {steps.map((step) => (
              <li key={step.title}>
                {step.title}: {step.body}
              </li>
            ))}
          </ol>
        </div>

        <div className="lg:col-span-8">
          {/* Widths in proportion to each film's shape, so both frames come out the same height. */}
          <div
            ref={pairRef}
            style={{ "--sum": String(wideRatio + tallRatio) } as CSSProperties}
            className="flex flex-col gap-10 sm:mx-auto sm:max-w-[calc(72svh_*_var(--sum)_+_1.25rem)] sm:flex-row sm:items-start sm:gap-5 lg:mr-0"
          >
            <figure
              style={{ "--grow": String(wideRatio), "--ratio": `${wide.frames.width} / ${wide.frames.height}` } as CSSProperties}
              className="min-w-0 sm:flex-[var(--grow)_1_0%]"
            >
              <div ref={wideFrameRef} className="relative aspect-[var(--ratio)] overflow-hidden bg-plaster-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={wide.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                {!reduced && <canvas ref={wideRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />}
                <Readout steps={steps} step={wideStep} />
              </div>
              <figcaption className="annotation mt-3 text-on-surface-faint">{wide.caption}</figcaption>
            </figure>

            <figure
              style={{ "--grow": String(tallRatio), "--ratio": `${tall.frames.width} / ${tall.frames.height}` } as CSSProperties}
              className="min-w-0 sm:flex-[var(--grow)_1_0%]"
            >
              {/* A phone crops the bedroom a little top and bottom, so it is not a full screen tall. */}
              <div ref={tallFrameRef} className="relative aspect-[2/3] overflow-hidden bg-plaster-2 sm:aspect-[var(--ratio)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={tall.poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
                {!reduced && <canvas ref={tallRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />}
                <Readout steps={steps} step={tallStep} />
              </div>
              <figcaption className="annotation mt-3 text-on-surface-faint">{tall.caption}</figcaption>
            </figure>
          </div>

          <div aria-hidden="true" className="mt-8 hidden flex-col gap-3 sm:flex lg:hidden">
            <div className="flex items-center gap-5">
              <span className="annotation text-accent">
                {number(wideStep)} / {String(steps.length).padStart(2, "0")}
              </span>
              <span className="relative h-px flex-1 overflow-hidden bg-rule">
                <span ref={railRef} className="absolute inset-0 origin-left scale-x-0 bg-accent" />
              </span>
            </div>
            <p className="max-w-xl">
              <span className="font-[520]">{current.title}</span>
              <span className="text-on-surface-muted"> — {current.body}</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
