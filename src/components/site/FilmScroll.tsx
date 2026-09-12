"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { useFrameSequence, type FrameSet } from "@/components/motion/useFrameSequence";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { clamp, cn } from "@/lib/utils";

export interface FilmChapter {
  /** Progress (0–1) at which this chapter begins. */
  at: number;
  title: string;
  body: string;
}

/**
 * A film that plays as you scroll past it.
 *
 * The section is one screen tall and scrolls with the page like anything else —
 * nothing pins, nothing holds the page. While it crosses the screen, its
 * position picks the frame, so scrolling forward plays the film and scrolling
 * back rewinds it.
 */
export default function FilmScroll({
  id,
  label,
  title,
  landscape,
  portrait,
  poster,
  chapters,
}: {
  id?: string;
  label: string;
  title: string;
  landscape: FrameSet;
  portrait?: FrameSet;
  poster: string;
  chapters: FilmChapter[];
}) {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const activeRef = useRef(0);
  const [active, setActive] = useState(0);
  const reduced = useReducedMotion();
  const sequence = useFrameSequence(canvasRef, { landscape, portrait, fit: "cover" });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || reduced) return;

    const apply = (progress: number) => {
      // Play while the film is at least ~40% on screen.
      const film = clamp((progress - 0.2) / 0.6);
      sequence.current?.seek(film);
      if (barRef.current) barRef.current.style.transform = `scaleX(${film})`;
      let index = 0;
      chapters.forEach((chapter, i) => {
        if (film >= chapter.at) index = i;
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
  }, [chapters, reduced, sequence]);

  const count = String(chapters.length).padStart(2, "0");

  return (
    <section
      ref={sectionRef}
      id={id}
      data-surface="night"
      aria-label={title}
      className="relative h-[100svh] min-h-[560px] overflow-hidden bg-night text-bone"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
      {!reduced && <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />}
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-night/90 via-night/10 to-night/60" />

      <div className="sheet relative z-10 flex h-full flex-col justify-between pt-24 pb-8 md:pt-28 md:pb-10">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="eyebrow text-glow">{label}</p>
            <h2 className="inked mt-3 text-d4 leading-none md:text-[clamp(2.4rem,1.6rem+2vw,3.6rem)]">{title}</h2>
          </div>
          <ol aria-hidden="true" className="hidden gap-7 md:flex">
            {chapters.map((chapter, i) => (
              <li
                key={chapter.title}
                className={cn(
                  "eyebrow relative pb-2 transition-colors duration-500",
                  i === active ? "text-bone" : "text-bone/50",
                )}
              >
                {chapter.title}
                <span
                  className={cn(
                    "absolute bottom-0 left-0 h-px bg-glow transition-[width] duration-500 ease-cut",
                    i === active ? "w-full" : "w-0",
                  )}
                />
              </li>
            ))}
          </ol>
        </div>

        <div>
          <div className="relative min-h-[11rem] max-w-xl">
            {chapters.map((chapter, i) => (
              <div
                key={chapter.title}
                aria-hidden={i !== active}
                className={cn(
                  "absolute inset-x-0 bottom-0 transition-[opacity,transform] duration-700 ease-cut",
                  i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
                )}
              >
                <p className="annotation text-glow">
                  {String(i + 1).padStart(2, "0")} / {count}
                </p>
                <h3 className="inked mt-3 text-d3 leading-none">{chapter.title}</h3>
                <p className="mt-4 max-w-md text-bone/80">{chapter.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center gap-5">
            <span className="annotation text-bone/60">Film</span>
            <span className="relative h-px flex-1 overflow-hidden bg-white/20">
              <span ref={barRef} className="absolute inset-0 origin-left scale-x-0 bg-glow" />
            </span>
            <span className="annotation text-bone/60">{count} chapters</span>
          </div>
        </div>
      </div>

      <ol className="sr-only">
        {chapters.map((chapter) => (
          <li key={chapter.title}>
            {chapter.title}: {chapter.body}
          </li>
        ))}
      </ol>
    </section>
  );
}
