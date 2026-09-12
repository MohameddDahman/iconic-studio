"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ScrollTrigger } from "@/lib/gsap";

/**
 * Scrolling is the browser's own.
 *
 * Nothing on the site changes scroll speed, smooths it, or moves the page by
 * itself. This component only asks ScrollTrigger to re-measure once a new page
 * has painted, so scroll-linked sections start from the right positions.
 */

export function scrollToTop() {
  window.scrollTo({ top: 0, left: 0, behavior: "instant" });
}

/** Jump to a position or an element — used by in-page links such as a room index. */
export function scrollToTarget(target: number | HTMLElement, offset = 0) {
  const y = typeof target === "number" ? target : target.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: y + offset, left: 0, behavior: "instant" });
}

export default function ScrollSync() {
  const pathname = usePathname();

  useEffect(() => {
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(() => ScrollTrigger.refresh());
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [pathname]);

  return null;
}
