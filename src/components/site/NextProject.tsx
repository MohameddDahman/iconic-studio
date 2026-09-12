"use client";

import Image from "next/image";
import type { MouseEvent } from "react";
import { useRouteTransition } from "@/components/motion/TransitionProvider";
import type { Project } from "@/lib/types";

/** The way onward from a case study: the next project's photograph, which flies into its hero when clicked. */
export default function NextProject({ project }: { project: Project }) {
  const { navigateFromImage } = useRouteTransition();
  const href = `/projects/${project.slug}`;

  const open = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigateFromImage(href, e.currentTarget.querySelector<HTMLElement>("[data-figure]"));
  };

  return (
    <section data-surface="night" className="bg-surface pb-[var(--spacing-bay-lg)] text-on-surface">
      <div className="sheet">
        <a href={href} onClick={open} className="group block cursor-pointer border-t border-rule pt-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="eyebrow block text-on-surface-faint">Next project</span>
              <span className="inked mt-4 block text-d2 leading-[0.95] tracking-[-0.02em]">{project.title}</span>
            </div>
            <span className="annotation flex items-center gap-4 text-accent">
              {project.typology} · {project.location}
              <span aria-hidden="true" className="block h-px w-10 bg-current transition-[width] duration-500 group-hover:w-20" />
            </span>
          </div>
          <div data-figure className="relative mt-10 aspect-[21/9] overflow-hidden bg-umber">
            <Image
              src={project.cover.src}
              alt={project.cover.alt}
              fill
              sizes="100vw"
              quality={80}
              placeholder={project.cover.blurDataURL ? "blur" : "empty"}
              blurDataURL={project.cover.blurDataURL}
              className="object-cover transition-transform duration-[1600ms] ease-settle group-hover:scale-[1.04]"
            />
          </div>
        </a>
      </div>
    </section>
  );
}
