"use client";

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import Image from "next/image";
import { useRouteTransition } from "@/components/motion/TransitionProvider";
import SplitHeading from "@/components/motion/SplitHeading";
import CtaLink from "./CtaLink";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/types";

const isModified = (e: MouseEvent) => e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0;

/**
 * Selected work as a strip you move yourself — swipe, drag, or use the arrows.
 * It never takes over the page's scroll: the wheel keeps scrolling the page.
 * Clicking a card flies its photograph into the case study.
 */
export default function FeaturedWork({ projects, total }: { projects: Project[]; total: number }) {
  const railRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const drag = useRef({ active: false, startX: 0, startLeft: 0, moved: false });
  const [edges, setEdges] = useState({ start: true, end: false });
  const { navigateFromImage } = useRouteTransition();

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const onScroll = () => {
      const max = rail.scrollWidth - rail.clientWidth;
      const progress = max > 0 ? rail.scrollLeft / max : 0;
      if (barRef.current) barRef.current.style.transform = `scaleX(${Math.max(0.06, progress)})`;
      const start = rail.scrollLeft < 4;
      const end = rail.scrollLeft > max - 4;
      setEdges((prev) => (prev.start === start && prev.end === end ? prev : { start, end }));
    };
    rail.addEventListener("scroll", onScroll, { passive: true });
    return () => rail.removeEventListener("scroll", onScroll);
  }, []);

  const step = (direction: 1 | -1) => {
    const rail = railRef.current;
    if (!rail) return;
    const card = rail.querySelector<HTMLElement>("[data-card]");
    const amount = card ? card.offsetWidth + 32 : rail.clientWidth * 0.8;
    rail.scrollBy({ left: direction * amount, behavior: "smooth" });
  };

  /* Mouse drag to move the strip; touch and trackpads scroll it natively. */
  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !railRef.current) return;
    drag.current = { active: true, startX: e.clientX, startLeft: railRef.current.scrollLeft, moved: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state.active || !railRef.current) return;
    const dx = e.clientX - state.startX;
    if (Math.abs(dx) > 6) state.moved = true;
    if (state.moved) railRef.current.scrollLeft = state.startLeft - dx;
  };
  const endDrag = () => {
    drag.current.active = false;
  };

  const open = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (drag.current.moved) {
      e.preventDefault();
      drag.current.moved = false;
      return;
    }
    if (isModified(e)) return;
    e.preventDefault();
    navigateFromImage(href, e.currentTarget.querySelector<HTMLElement>("[data-card-figure]"));
  };

  const arrow = (direction: 1 | -1, disabled: boolean) => (
    <button
      type="button"
      onClick={() => step(direction)}
      disabled={disabled}
      aria-label={direction === 1 ? "Next projects" : "Previous projects"}
      className="grid size-12 cursor-pointer place-items-center rounded-full border border-rule-strong transition-[border-color,opacity] duration-300 hover:border-on-surface disabled:cursor-default disabled:opacity-30"
    >
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className={cn("size-4", direction === -1 && "rotate-180")}>
        <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    </button>
  );

  return (
    <section data-surface="night" className="relative overflow-hidden bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet grid gap-10 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-7">
          <p className="eyebrow mb-8 text-accent">(04) Selected work</p>
          <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
            Rooms that <em>speak</em> for us.
          </SplitHeading>
        </div>
        <div className="flex flex-col items-start gap-6 lg:col-span-5 lg:col-start-8 lg:items-end">
          <p className="max-w-sm text-on-surface-muted lg:text-right">
            {total} projects from the studio.
          </p>
          <div className="flex items-center gap-3">
            <CtaLink href="/projects" variant="outline">
              All projects
            </CtaLink>
            {arrow(-1, edges.start)}
            {arrow(1, edges.end)}
          </div>
        </div>
      </div>

      <div
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="mt-14 flex cursor-grab snap-x snap-proximity gap-5 overflow-x-auto overscroll-x-contain px-[var(--spacing-gutter)] pb-2 select-none [scrollbar-width:none] active:cursor-grabbing md:gap-8 [&::-webkit-scrollbar]:hidden"
      >
        {projects.map((project, i) => {
          const href = `/projects/${project.slug}`;
          return (
            <a
              key={project.slug}
              href={href}
              data-card
              draggable={false}
              onClick={(e) => open(e, href)}
              className="group block w-[78vw] shrink-0 snap-start sm:w-[44vw] lg:w-[30vw] xl:w-[26vw]"
            >
              <div data-card-figure className="relative aspect-[4/5] overflow-hidden bg-umber">
                <Image
                  src={project.cover.src}
                  alt={project.cover.alt}
                  fill
                  draggable={false}
                  sizes="(min-width: 1280px) 26vw, (min-width: 1024px) 30vw, (min-width: 640px) 44vw, 78vw"
                  quality={72}
                  placeholder={project.cover.blurDataURL ? "blur" : "empty"}
                  blurDataURL={project.cover.blurDataURL}
                  className="object-cover transition-transform duration-[1400ms] ease-settle group-hover:scale-[1.05]"
                />
                <span className="annotation absolute top-4 left-4 rounded-full bg-night/55 px-2.5 py-1 text-bone">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="absolute right-4 bottom-4 grid size-12 scale-75 place-items-center rounded-full bg-bone text-night opacity-0 transition-[opacity,transform] duration-500 ease-cut group-hover:scale-100 group-hover:opacity-100">
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" className="size-4 -rotate-45">
                    <path d="M2 8h11M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              </div>
              <div className="mt-5 flex items-start justify-between gap-4">
                <div>
                  <h3 className="inked text-[clamp(1.6rem,1.2rem+1vw,2.1rem)] leading-none">{project.title}</h3>
                  <p className="mt-2 text-sm text-on-surface-muted">
                    {project.typology} · {project.location}
                  </p>
                </div>
                <span className="annotation pt-1 text-on-surface-faint">{project.year}</span>
              </div>
            </a>
          );
        })}
        <div aria-hidden="true" className="w-px shrink-0" />
      </div>

      <div className="sheet mt-10">
        <span className="relative block h-px w-full overflow-hidden bg-rule">
          <span ref={barRef} className="absolute inset-0 origin-left scale-x-[0.06] bg-accent" />
        </span>
      </div>
    </section>
  );
}
