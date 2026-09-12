"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { SplitText } from "gsap/SplitText";
import { Observer } from "gsap/Observer";
import { CustomEase } from "gsap/CustomEase";

let registered = false;

if (typeof window !== "undefined" && !registered) {
  gsap.registerPlugin(ScrollTrigger, Flip, SplitText, Observer, CustomEase);

  // The house easing curves, mirroring --ease-* in globals.css so JS and CSS
  // timelines share one rhythm.
  CustomEase.create("cut", "0.76, 0, 0.16, 1");
  CustomEase.create("settle", "0.22, 1, 0.36, 1");
  CustomEase.create("leave", "0.55, 0, 1, 0.45");

  gsap.defaults({ ease: "settle", duration: 0.9 });
  ScrollTrigger.config({ ignoreMobileResize: true });

  registered = true;
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export { gsap, ScrollTrigger, Flip, SplitText, Observer };
