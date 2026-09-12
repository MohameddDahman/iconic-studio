"use client";

import { useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import { Flip, gsap } from "@/lib/gsap";
import { useRouteTransition } from "@/components/motion/TransitionProvider";
import { prefersReducedMotion } from "@/lib/gsap";
import { cn } from "@/lib/utils";
import type { Project, Typology } from "@/lib/types";

const SECTOR: Record<Typology, string> = {
  Apartment: "Residential",
  Villa: "Residential",
  Duplex: "Residential",
  Penthouse: "Residential",
  Chalet: "Residential",
  Office: "Workplace",
  Commercial: "Workplace",
  Hospitality: "Hospitality",
  Retail: "Retail",
  Healthcare: "Healthcare",
};

const FILTERS = ["All", "Residential", "Workplace", "Hospitality", "Retail", "Healthcare"] as const;
type Filter = (typeof FILTERS)[number];

const isModified = (e: MouseEvent) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

/**
 * The portfolio. Filtering by sector does not re-render a new list — every
 * card stays in the DOM and GSAP Flip animates the survivors into their new
 * places while the rest fold away, so the grid visibly rearranges itself.
 */
export default function ProjectIndex({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<Filter>("All");
  const [view, setView] = useState<"grid" | "list">("grid");
  const listRef = useRef<HTMLUListElement>(null);
  const flipState = useRef<Flip.FlipState | null>(null);
  const { navigateFromImage } = useRouteTransition();

  const count = (f: Filter) => (f === "All" ? projects.length : projects.filter((p) => SECTOR[p.typology] === f).length);

  const change = (next: Filter) => {
    if (next === filter) return;
    if (listRef.current && !prefersReducedMotion()) {
      const cards = listRef.current.querySelectorAll("[data-card]");
      // A second click mid-flight would otherwise capture half-moved cards.
      Flip.killFlipsOf(cards);
      flipState.current = Flip.getState(cards);
    }
    setFilter(next);
  };

  useLayoutEffect(() => {
    const state = flipState.current;
    const list = listRef.current;
    if (!state || !list) return;
    flipState.current = null;
    Flip.from(state, {
      targets: list.querySelectorAll("[data-card]"),
      duration: 0.85,
      ease: "cut",
      absolute: true,
      stagger: 0.025,
      onEnter: (elements) => gsap.fromTo(elements, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.7, ease: "settle" }),
      onLeave: (elements) => gsap.to(elements, { opacity: 0, scale: 0.94, duration: 0.45, ease: "power2.in" }),
    });
  }, [filter]);

  const open = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isModified(e)) return;
    e.preventDefault();
    navigateFromImage(href, e.currentTarget.querySelector<HTMLElement>("[data-figure]"));
  };

  return (
    <div>
      <div className="flex flex-col gap-5 border-b border-rule pb-6 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="Filter by sector" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const n = count(f);
            if (n === 0) return null;
            const on = f === filter;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => change(f)}
                className={cn(
                  "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm transition-colors duration-300",
                  on ? "border-on-surface bg-on-surface text-surface" : "border-rule-strong hover:border-on-surface",
                )}
              >
                {f}
                <span className="annotation opacity-60">{String(n).padStart(2, "0")}</span>
              </button>
            );
          })}
        </div>

        <div role="group" aria-label="Layout" className="flex w-fit gap-1 rounded-full border border-rule-strong p-1">
          {(["grid", "list"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(
                "eyebrow h-8 cursor-pointer rounded-full px-4 transition-colors duration-300",
                view === v ? "bg-on-surface text-surface" : "text-on-surface-muted hover:text-on-surface",
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <ul
        ref={listRef}
        className={cn(
          // Positioned: while it rearranges, Flip takes the cards out of the flow,
          // and they must be placed against this list rather than the page.
          "relative mt-12",
          view === "grid" ? "grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3" : "flex flex-col border-t border-rule",
        )}
      >
        {projects.map((project, i) => {
          const visible = filter === "All" || SECTOR[project.typology] === filter;
          const href = `/projects/${project.slug}`;
          return (
            <li key={project.slug} data-card className={cn(!visible && "hidden")}>
              {view === "grid" ? (
                <a href={href} onClick={(e) => open(e, href)} className="group block cursor-pointer">
                  <div data-figure className="relative aspect-[4/5] overflow-hidden bg-plaster-2">
                    <Image
                      src={project.cover.src}
                      alt={project.cover.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      quality={80}
                      placeholder={project.cover.blurDataURL ? "blur" : "empty"}
                      blurDataURL={project.cover.blurDataURL}
                      className="object-cover transition-transform duration-[1400ms] ease-settle group-hover:scale-[1.05]"
                    />
                    <span className="absolute top-4 left-4 rounded-full bg-night/55 px-3 py-1.5 text-[0.7rem] text-bone backdrop-blur-md">
                      {project.typology}
                    </span>
                    {project.cover.night && (
                      <span className="eyebrow absolute top-4 right-4 rounded-full bg-glow px-3 py-1.5 text-[0.6rem] text-night">
                        Day &amp; evening
                      </span>
                    )}
                  </div>
                  <div className="mt-5 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="inked text-[clamp(1.6rem,1.3rem+0.8vw,2.1rem)] leading-none">{project.title}</h2>
                      <p className="mt-2 text-sm text-on-surface-muted">{project.location}</p>
                    </div>
                    <span className="annotation pt-1 text-on-surface-faint">{project.year}</span>
                  </div>
                </a>
              ) : (
                <a
                  href={href}
                  onClick={(e) => open(e, href)}
                  className="group grid cursor-pointer grid-cols-[2.5rem_1fr_auto] items-center gap-4 border-b border-rule py-6 md:grid-cols-[4rem_1.5fr_1fr_1fr_4rem]"
                >
                  <span className="annotation text-on-surface-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="inked text-d4 leading-none transition-transform duration-700 ease-cut group-hover:translate-x-2">
                    {project.title}
                  </span>
                  <span className="hidden text-sm text-on-surface-muted md:block">{project.typology}</span>
                  <span className="hidden text-sm text-on-surface-muted md:block">{project.location}</span>
                  <span className="annotation text-right text-on-surface-faint">{project.year}</span>
                </a>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
