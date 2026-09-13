"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { scrollToTarget, scrollToTop } from "./ScrollSync";
import { sheetForPath, STUDIO } from "@/lib/routes";

const MIN_COVERED_MS = 220;
const ROUTE_TIMEOUT_MS = 6000;

interface TransitionApi {
  navigate: (href: string) => void;
  /**
   * Navigate by growing the clicked photograph into the next page's hero,
   * instead of cutting to it. Used for project cards, where the image is the
   * thing you are actually clicking on.
   */
  navigateFromImage: (href: string, figure: HTMLElement | null) => void;
  prefetch: (href: string) => void;
  isBusy: boolean;
}

const Ctx = createContext<TransitionApi | null>(null);

export function useRouteTransition() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useRouteTransition must be used inside <TransitionProvider>");
  return ctx;
}

const normalise = (href: string) => {
  const [path] = href.split("#");
  return path.replace(/\/+$/, "") || "/";
};

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

const OPEN = "inset(0% 0% 0% 0%)";
const BELOW = "inset(100% 0% 0% 0%)";
const ABOVE = "inset(0% 0% 100% 0%)";

export default function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  const rootRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef<HTMLSpanElement>(null);
  const titleRef = useRef<HTMLSpanElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);

  const flipRootRef = useRef<HTMLDivElement>(null);
  const flipFrameRef = useRef<HTMLDivElement>(null);
  const flipImgRef = useRef<HTMLImageElement>(null);

  const busyRef = useRef(false);
  const pendingRef = useRef<string | null>(null);
  const arrivedRef = useRef<(() => void) | null>(null);
  const pathnameRef = useRef(pathname);

  const [isBusy, setIsBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const label = useCallback((index: string, title: string) => {
    if (indexRef.current) indexRef.current.textContent = index;
    if (titleRef.current) titleRef.current.textContent = title;
  }, []);

  /** Two panels rise one after the other; the destination's name comes up through them. */
  const playCover = useCallback(() => {
    const tl = gsap.timeline();
    tl.set(rootRef.current, { pointerEvents: "auto" })
      .fromTo(backRef.current, { clipPath: BELOW }, { clipPath: OPEN, duration: 0.8, ease: "cut" })
      .fromTo(panelRef.current, { clipPath: BELOW }, { clipPath: OPEN, duration: 0.8, ease: "cut" }, 0.09)
      .fromTo(
        [indexRef.current, titleRef.current],
        { yPercent: 115 },
        { yPercent: 0, duration: 0.75, ease: "settle", stagger: 0.07 },
        0.42,
      )
      .fromTo(progressRef.current, { scaleX: 0 }, { scaleX: 0.72, duration: 1.2, ease: "power2.out" }, 0.35);
    return tl;
  }, []);

  /** The panels keep travelling upward and leave through the top of the frame. */
  const playReveal = useCallback(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        gsap.set(rootRef.current, { pointerEvents: "none" });
      },
    });
    tl.to(progressRef.current, { scaleX: 1, duration: 0.35, ease: "power2.out" })
      .to([indexRef.current, titleRef.current], { yPercent: -115, duration: 0.5, ease: "leave", stagger: 0.05 }, 0.12)
      .to(panelRef.current, { clipPath: ABOVE, duration: 0.9, ease: "cut" }, 0.34)
      .to(backRef.current, { clipPath: ABOVE, duration: 0.9, ease: "cut" }, 0.44);
    return tl;
  }, []);

  /* ---- Boot: the site opens the same way it changes pages ---------------- */
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    label(STUDIO.tagline, STUDIO.name);

    if (prefersReducedMotion()) {
      gsap.set(root, { pointerEvents: "none", autoAlpha: 0 });
      root.dataset.state = "open";
      return;
    }

    gsap.set([backRef.current, panelRef.current], { clipPath: OPEN });
    gsap.set([indexRef.current, titleRef.current], { yPercent: 115 });
    gsap.to([indexRef.current, titleRef.current], {
      yPercent: 0,
      duration: 0.9,
      ease: "settle",
      stagger: 0.08,
      delay: 0.1,
    });
    gsap.fromTo(progressRef.current, { scaleX: 0 }, { scaleX: 0.8, duration: 1.4, ease: "power2.out" });

    let cancelled = false;
    const fontsReady =
      typeof document !== "undefined" && "fonts" in document ? document.fonts.ready : Promise.resolve();

    Promise.all([Promise.race([fontsReady, wait(1800)]), wait(900)]).then(() => {
      if (cancelled) return;
      root.dataset.state = "open";
      ScrollTrigger.refresh();
      playReveal();
    });

    return () => {
      cancelled = true;
    };
    // Boot runs exactly once, deliberately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Arrival: resolves the promise navigate() is parked on ------------- */
  useEffect(() => {
    pathnameRef.current = pathname;
    if (pendingRef.current && normalise(pathname) === pendingRef.current) {
      arrivedRef.current?.();
      arrivedRef.current = null;
    }
  }, [pathname]);

  const prefetch = useCallback(
    (href: string) => {
      try {
        router.prefetch(href);
      } catch {
        /* prefetch is best-effort */
      }
    },
    [router],
  );

  const settleFocus = () => {
    const main = document.getElementById("main");
    if (main) {
      main.setAttribute("tabindex", "-1");
      main.focus({ preventScroll: true });
    }
  };

  const navigate = useCallback(
    async (href: string) => {
      const target = normalise(href);
      const hash = href.includes("#") ? decodeURIComponent(href.split("#")[1]) : "";

      // Same page: an anchor link just goes to its section.
      if (target === normalise(pathnameRef.current)) {
        const anchor = hash ? document.getElementById(hash) : null;
        if (anchor) scrollToTarget(anchor, -96);
        return;
      }
      if (busyRef.current) return;

      const sheet = sheetForPath(target);

      if (prefersReducedMotion()) {
        router.push(href);
        setAnnouncement(sheet.label + ". " + sheet.title + ".");
        return;
      }

      busyRef.current = true;
      setIsBusy(true);
      pendingRef.current = target;
      label(sheet.sheet + " — " + sheet.label, sheet.title);

      const arrived = new Promise<void>((resolve) => {
        arrivedRef.current = resolve;
      });

      await playCover();
      if (rootRef.current) rootRef.current.dataset.state = "covered";

      router.push(href);

      await Promise.race([arrived, wait(ROUTE_TIMEOUT_MS)]);
      await wait(MIN_COVERED_MS);

      const anchor = hash ? document.getElementById(hash) : null;
      if (anchor) scrollToTarget(anchor, -96);
      else scrollToTop();
      ScrollTrigger.refresh();
      setAnnouncement(sheet.label + ". " + sheet.title + ".");

      if (rootRef.current) rootRef.current.dataset.state = "open";
      await playReveal();
      settleFocus();

      pendingRef.current = null;
      busyRef.current = false;
      setIsBusy(false);
    },
    [router, playCover, playReveal, label],
  );

  /**
   * The shared-element route.
   *
   * A copy of the clicked photograph is pinned over the page and grown to fill
   * the viewport, which is exactly where the case study's hero image sits — so
   * when the clone fades, the same photograph is already underneath it. Size and
   * position are animated rather than transformed on purpose: object-fit
   * recomputes the crop every frame, which is what makes the framing morph
   * instead of stretch.
   */
  const navigateFromImage = useCallback(
    async (href: string, figure: HTMLElement | null) => {
      const target = normalise(href);
      if (busyRef.current || target === normalise(pathnameRef.current)) return;

      const source = figure?.querySelector("img") as HTMLImageElement | null;
      const root = flipRootRef.current;
      const frame = flipFrameRef.current;
      const image = flipImgRef.current;

      if (prefersReducedMotion() || !source || !root || !frame || !image) {
        navigate(href);
        return;
      }

      // Grow from the visible frame, not the image: cards over-scale their
      // photographs for parallax, so the <img> is larger than what you see.
      const rect = (figure ?? source).getBoundingClientRect();
      busyRef.current = true;
      setIsBusy(true);
      pendingRef.current = target;

      image.src = source.currentSrc || source.src;
      image.alt = "";
      image.style.objectPosition = getComputedStyle(source).objectPosition;

      const arrived = new Promise<void>((resolve) => {
        arrivedRef.current = resolve;
      });

      gsap.set(root, { autoAlpha: 1, pointerEvents: "auto" });
      gsap.set(frame, { top: rect.top, left: rect.left, width: rect.width, height: rect.height });

      await gsap.to(frame, {
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        duration: 1.05,
        ease: "cut",
      });

      router.push(href);

      await Promise.race([arrived, wait(ROUTE_TIMEOUT_MS)]);
      await wait(MIN_COVERED_MS);

      scrollToTop();
      ScrollTrigger.refresh();

      const sheet = sheetForPath(target);
      setAnnouncement(sheet.label + ". " + sheet.title + ".");

      // Give the incoming hero a frame to paint before uncovering it.
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      await gsap.to(root, { autoAlpha: 0, duration: 0.55, ease: "power2.out" });
      gsap.set(root, { pointerEvents: "none" });
      settleFocus();

      pendingRef.current = null;
      busyRef.current = false;
      setIsBusy(false);
    },
    [navigate, router],
  );

  const api = useMemo<TransitionApi>(
    () => ({ navigate, navigateFromImage, prefetch, isBusy }),
    [navigate, navigateFromImage, prefetch, isBusy],
  );

  return (
    <Ctx.Provider value={api}>
      {children}

      {/* Without JS the overlay must never be able to cover the site. */}
      <noscript>
        <style>{".route-cut{display:none !important}"}</style>
      </noscript>

      <div
        ref={rootRef}
        data-state="covered"
        aria-hidden="true"
        className="route-cut pointer-events-none fixed inset-0 z-[200]"
      >
        <div ref={backRef} className="absolute inset-0 bg-umber-2" />

        <div ref={panelRef} className="absolute inset-0 overflow-hidden bg-night-deep text-bone">
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_110%,rgb(201_168_120/0.16),transparent_70%)]"
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6 text-center">
            <span className="block overflow-hidden">
              <span ref={indexRef} className="eyebrow block text-glow" />
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <span ref={titleRef} className="inked block text-d2 leading-none tracking-[-0.02em]" />
            </span>
          </div>

          <div className="absolute inset-x-[var(--spacing-gutter)] bottom-10 flex items-center gap-5">
            <span className="annotation text-bone/50">{STUDIO.name}</span>
            <span className="relative h-px flex-1 overflow-hidden bg-white/10">
              <span ref={progressRef} className="absolute inset-0 origin-left scale-x-0 bg-glow" />
            </span>
            <span className="annotation text-bone/50">Alexandria</span>
          </div>
        </div>
      </div>

      {/* Shared-element layer for project cards */}
      <div
        ref={flipRootRef}
        aria-hidden="true"
        className="pointer-events-none invisible fixed inset-0 z-[190] opacity-0"
      >
        <div ref={flipFrameRef} className="absolute overflow-hidden bg-night">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={flipImgRef} alt="" className="h-full w-full object-cover" />
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
    </Ctx.Provider>
  );
}
