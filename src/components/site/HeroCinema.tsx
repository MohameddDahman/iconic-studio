"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import TransitionLink from "@/components/motion/TransitionLink";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/types";
import { STUDIO } from "@/lib/routes";
import mark from "../../../public/brand/iconic-mark.png";

export interface HeroSlide {
  media: Media;
  title: string;
  meta: string;
  href: string;
}

/** Seconds each photograph holds before the next one cuts in. */
const HOLD = 6.5;
const OPEN = "inset(0% 0% 0% 0%)";
const WAITING = "inset(0% 0% 0% 100%)";

/**
 * The opening reel. Full-bleed photographs cut in from the right while the
 * outgoing frame slides away beneath them, and each image drifts slowly while
 * it holds — the grammar of a film title sequence rather than a carousel.
 * The reel pauses off screen and never runs under reduced motion.
 */
export default function HeroCinema({ slides, lead }: { slides: HeroSlide[]; lead: string }) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLSpanElement[]>([]);
  const prevRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(true);
  const count = slides.length;

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold: 0.05 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  /* Entrance, and the hero giving way as the page scrolls. */
  useGSAP(
    () => {
      const root = rootRef.current!;
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from(root.querySelectorAll("[data-hero-line]"), {
          yPercent: 118,
          rotate: 2.5,
          transformOrigin: "0% 100%",
          duration: 1.5,
          ease: "cut",
          stagger: 0.13,
          delay: 1.05,
        });
        gsap.from(root.querySelectorAll("[data-hero-fade]"), {
          opacity: 0,
          y: 18,
          duration: 1.2,
          ease: "settle",
          stagger: 0.1,
          delay: 1.55,
        });
        gsap.fromTo(
          root.querySelector("[data-slide='0'] [data-kb]"),
          { scale: 1.28 },
          { scale: 1.06, duration: 3.2, ease: "settle", delay: 0.55 },
        );
        gsap.to(stageRef.current, {
          yPercent: 22,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(contentRef.current, {
          yPercent: -16,
          opacity: 0,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "75% top", scrub: true },
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  /* The cut between two photographs. */
  useGSAP(
    () => {
      const root = rootRef.current!;
      const prev = prevRef.current;
      if (prev === index) return;
      prevRef.current = index;

      const all = root.querySelectorAll<HTMLElement>("[data-slide]");
      const incoming = root.querySelector<HTMLElement>(`[data-slide='${index}']`);
      const outgoing = root.querySelector<HTMLElement>(`[data-slide='${prev}']`);
      if (!incoming || !outgoing) return;

      if (prefersReducedMotion()) {
        all.forEach((slide, i) => gsap.set(slide, { zIndex: i === index ? 2 : 0, clipPath: i === index ? OPEN : WAITING }));
        return;
      }

      gsap.set(all, { zIndex: 0 });
      gsap.set(outgoing, { zIndex: 1, clipPath: OPEN });
      gsap.set(incoming, { zIndex: 2, clipPath: WAITING });

      gsap
        .timeline()
        .to(incoming, { clipPath: OPEN, duration: 1.6, ease: "cut" })
        .fromTo(incoming.querySelector("[data-move]"), { xPercent: 14 }, { xPercent: 0, duration: 1.6, ease: "cut" }, 0)
        .fromTo(outgoing.querySelector("[data-move]"), { xPercent: 0 }, { xPercent: -12, duration: 1.6, ease: "cut" }, 0)
        .fromTo(incoming.querySelector("[data-kb]"), { scale: 1.22 }, { scale: 1, duration: HOLD + 2, ease: "none" }, 0);
    },
    { dependencies: [index], scope: rootRef },
  );

  /* The timer is the progress bar itself, so the two can never disagree. */
  useGSAP(
    () => {
      if (!inView || count < 2 || prefersReducedMotion()) return;
      barsRef.current.forEach((bar, i) => {
        if (bar && i !== index) gsap.set(bar, { scaleX: i < index ? 1 : 0 });
      });
      const bar = barsRef.current[index];
      if (!bar) return;
      const tween = gsap.fromTo(
        bar,
        { scaleX: 0 },
        { scaleX: 1, duration: HOLD, ease: "none", onComplete: () => setIndex((i) => (i + 1) % count) },
      );
      return () => {
        tween.kill();
      };
    },
    { dependencies: [index, inView, count] },
  );

  return (
    <section
      ref={rootRef}
      data-surface="night"
      aria-roledescription="carousel"
      aria-label="Selected interiors"
      className="relative h-[100svh] min-h-[640px] overflow-hidden bg-night text-bone"
    >
      <div ref={stageRef} className="absolute inset-0 will-change-transform">
        {slides.map((slide, i) => (
          <div
            key={slide.media.src}
            data-slide={i}
            aria-hidden={i !== index}
            className={cn(
              "absolute inset-0 overflow-hidden",
              i === 0 ? "z-[2] [clip-path:inset(0%_0%_0%_0%)]" : "z-0 [clip-path:inset(0%_0%_0%_100%)]",
            )}
          >
            <div data-move className="absolute inset-0">
              <div data-kb className="absolute inset-0 will-change-transform">
                <Image
                  src={slide.media.src}
                  alt={slide.media.alt}
                  fill
                  sizes="100vw"
                  quality={85}
                  preload={i === 0}
                  placeholder={slide.media.blurDataURL ? "blur" : "empty"}
                  blurDataURL={slide.media.blurDataURL}
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        ))}
        <div aria-hidden="true" className="absolute inset-0 z-10 bg-gradient-to-t from-night via-night/30 to-night/40" />
        <div
          aria-hidden="true"
          className="absolute inset-0 z-10 bg-[radial-gradient(110%_75%_at_15%_100%,rgb(15_14_13/0.8),transparent_62%)]"
        />
      </div>

      <div ref={contentRef} className="relative z-20 flex h-full flex-col justify-end">
        <div className="sheet pb-8 md:pb-12">
          <Image
            src={mark}
            alt={STUDIO.legalName}
            data-hero-fade
            preload
            sizes="(min-width: 768px) 15rem, 45vw"
            className="mb-6 h-auto w-[clamp(8rem,15vw,14rem)] md:mb-8"
          />

          <p data-hero-fade className="eyebrow mb-7 max-w-[22ch] text-balance text-bone/70 md:mb-9 md:max-w-none">
            Architecture Design · Landscape · Interior
          </p>

          <h1 className="text-d1 leading-[0.86] tracking-[-0.025em]">
            <span className="block overflow-hidden pb-[0.07em]">
              <span data-hero-line className="condensed block font-[760] uppercase">
                Your space
              </span>
            </span>
            <span className="block overflow-hidden pb-[0.16em]">
              <span data-hero-line className="block">
                <span className="condensed font-[760] uppercase">Our</span>{" "}
                <span className="font-script text-glow">signature</span>
              </span>
            </span>
          </h1>

          <div
            data-hero-fade
            className="mt-8 grid gap-8 border-t border-white/15 pt-6 md:mt-12 md:grid-cols-12 md:items-end md:gap-6"
          >
            <p className="max-w-md text-bone/75 md:col-span-5 lg:col-span-4">{lead}</p>

            <div className="relative h-14 md:col-span-4 md:col-start-6 lg:col-start-6">
              {slides.map((slide, i) => (
                <TransitionLink
                  key={slide.href + i}
                  href={slide.href}
                  tabIndex={i === index ? 0 : -1}
                  aria-hidden={i !== index}
                  className={cn(
                    "group absolute inset-0 flex flex-col justify-end transition-[opacity,transform] duration-700 ease-cut",
                    i === index ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0",
                  )}
                >
                  <span className="eyebrow text-glow">{slide.meta}</span>
                  <span className="mt-1.5 flex items-center gap-2 text-lg">
                    {slide.title}
                    <span aria-hidden="true" className="transition-transform duration-500 ease-cut group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </TransitionLink>
              ))}
            </div>

            <ol className="flex gap-3 md:col-span-3 md:col-start-10">
              {slides.map((slide, i) => (
                <li key={slide.media.src} className="flex-1">
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${slide.title}`}
                    aria-current={i === index}
                    className="group flex w-full cursor-pointer flex-col gap-2 py-2 text-left"
                  >
                    <span
                      className={cn(
                        "annotation transition-colors duration-500",
                        i === index ? "text-bone" : "text-bone/45 group-hover:text-bone/80",
                      )}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="relative block h-px w-full overflow-hidden bg-white/20">
                      <span
                        ref={(el) => {
                          if (el) barsRef.current[i] = el;
                        }}
                        className="absolute inset-0 origin-left scale-x-0 bg-glow"
                      />
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
