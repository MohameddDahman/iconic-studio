"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import { gsap, prefersReducedMotion } from "@/lib/gsap";
import TransitionLink from "@/components/motion/TransitionLink";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/types";
import { STUDIO } from "@/lib/routes";
import type { SocialProfile } from "@/lib/social";
import SocialIcon from "./SocialIcon";
import mark from "../../../public/brand/iconic-mark-hero.webp";

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
export default function HeroCinema({
  slides,
  lead,
  completed = null,
  socials = [],
}: {
  slides: HeroSlide[];
  lead: string;
  /** Every project the studio has finished, published or not. Null leaves the count out. */
  completed?: number | null;
  socials?: SocialProfile[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const barsRef = useRef<HTMLSpanElement[]>([]);
  const timerRef = useRef<ReturnType<typeof gsap.fromTo> | null>(null);
  const prevRef = useRef(0);

  const [index, setIndex] = useState(0);
  const [inView, setInView] = useState(true);
  const count = slides.length;
  const rail = socials.length > 0;

  // A full-width photograph is the heaviest thing on the page, so only the one
  // on show and the one after it are fetched; the rest wait their turn.
  const [reached, setReached] = useState(() => new Set([0, 1]));
  const following = (index + 1) % count;
  if (!reached.has(index) || !reached.has(following)) {
    setReached(new Set([...reached, index, following]));
  }

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
        // The studio's count runs up as it fades in, and lands on the number the page was served with.
        const tallies = root.querySelectorAll<HTMLElement>("[data-hero-count]");
        tallies.forEach((el) => {
          const target = Number(el.dataset.heroCount);
          const tally = { v: 0 };
          el.textContent = "0";
          gsap.to(tally, {
            v: target,
            duration: 2.2,
            ease: "power2.out",
            delay: 1.75,
            onUpdate: () => {
              el.textContent = Math.round(tally.v).toLocaleString("en-US");
            },
          });
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
        return () => {
          // Cut short, the count would otherwise stay wherever it had reached.
          tallies.forEach((el) => {
            el.textContent = Number(el.dataset.heroCount).toLocaleString("en-US");
          });
        };
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
      // Without this, the last photograph's timer keeps running and cuts the next one short.
      timerRef.current?.kill();
      timerRef.current = null;
      if (!inView || count < 2 || prefersReducedMotion()) return;
      barsRef.current.forEach((bar, i) => {
        if (bar && i !== index) gsap.set(bar, { scaleX: i < index ? 1 : 0 });
      });
      const bar = barsRef.current[index];
      if (!bar) return;
      timerRef.current = gsap.fromTo(
        bar,
        { scaleX: 0 },
        { scaleX: 1, duration: HOLD, ease: "none", onComplete: () => setIndex((i) => (i + 1) % count) },
      );
    },
    { dependencies: [index, inView, count] },
  );

  return (
    <section
      ref={rootRef}
      data-surface="night"
      aria-roledescription="carousel"
      aria-label="Selected projects"
      // A screen tall, unless the words need more: then it grows, rather than
      // letting the top of the title slide under the header on a short phone.
      className="relative flex min-h-[max(100svh,640px)] flex-col overflow-hidden bg-night text-bone"
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
                {reached.has(i) && (
                  <Image
                    src={slide.media.src}
                    alt={slide.media.alt}
                    fill
                    sizes="100vw"
                    quality={80}
                    preload={i === 0}
                    placeholder={slide.media.blurDataURL ? "blur" : "empty"}
                    blurDataURL={slide.media.blurDataURL}
                    className="object-cover"
                  />
                )}
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

      <div ref={contentRef} className="relative z-20 flex flex-1 flex-col justify-end pt-24">
        <div className="sheet pb-8 md:pb-12">
          <div className="relative">
            <Image
              src={mark}
              alt={STUDIO.legalName}
              data-hero-fade
              preload
              sizes="(min-width: 768px) 11rem, 30vw"
              // Sized against the height as well, so the hero never grows past a short screen.
              className="mb-5 h-[clamp(2.1rem,min(4.6vw,5.6vh),3.6rem)] w-auto md:mb-7"
            />

            <p data-hero-fade className="eyebrow mb-5 text-balance text-bone/70 md:mb-7">
              Architecture Design&nbsp;· Landscape&nbsp;· Interior
            </p>

            <h1 className="text-[clamp(2.8rem,min(10vw,16vh),9rem)] leading-[0.86] tracking-[-0.025em]">
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

            {/* The studio's record and where it posts, opposite the title. On a phone the
                links run down the right edge, so the rule and the lead below stop short of
                them. A screen too narrow for that keeps the title clear and leaves them to
                the menu and the footer. */}
            {(completed || rail) && (
              <div
                data-hero-fade
                className="absolute -top-1 right-0 flex flex-col items-end gap-3 max-[22rem]:hidden md:top-0 md:items-stretch md:gap-4"
              >
                {completed ? (
                  <p className="flex items-center gap-3 border border-white/15 bg-night/55 px-3 py-1 md:flex-col md:items-start md:gap-2 md:px-6 md:py-5">
                    <span className="condensed text-[2rem] leading-none font-[760] tabular-nums md:text-[clamp(2.75rem,4.2vw,4.25rem)]">
                      <span data-hero-count={completed}>{completed.toLocaleString("en-US")}</span>
                      <span className="text-glow">+</span>
                    </span>
                    <span className="eyebrow max-w-[6.5rem] text-[0.625rem] leading-snug text-bone/75 md:max-w-none md:text-[0.6875rem]">
                      Projects completed
                    </span>
                  </p>
                ) : null}

                {rail && (
                  <ul
                    aria-label="The studio on social media"
                    className="flex flex-col gap-2 md:flex-row md:justify-end"
                  >
                    {socials.map((profile) => (
                      <li key={profile.platform}>
                        <a
                          href={profile.url}
                          target="_blank"
                          rel="noreferrer noopener"
                          title={profile.name}
                          className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-night/55 text-bone/85 transition-colors duration-500 ease-cut hover:border-glow hover:bg-glow hover:text-night focus-visible:border-glow focus-visible:bg-glow focus-visible:text-night lg:size-10"
                        >
                          <SocialIcon platform={profile.platform} className="size-4" />
                          <span className="sr-only">{profile.name}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div
            aria-hidden="true"
            data-hero-fade
            className={cn("mt-8 h-px bg-white/15 md:mt-12", rail && "min-[22rem]:max-md:mr-14")}
          />

          <div data-hero-fade className="grid gap-8 pt-6 md:grid-cols-12 md:items-end md:gap-6">
            <p className={cn("max-w-md text-bone/75 md:col-span-5 lg:col-span-4", rail && "min-[22rem]:max-md:pr-14")}>
              {lead}
            </p>

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

            <ol className="flex gap-3 pr-14 md:col-span-3 md:col-start-10 xl:pr-10">
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
