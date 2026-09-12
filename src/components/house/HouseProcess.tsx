"use client";

import { useEffect, useRef, useState } from "react";
import { ScrollTrigger } from "@/lib/gsap";
import { lights, useLights } from "@/lib/lights";
import { useReducedMotion } from "@/lib/useReducedMotion";
import LampSwitch from "@/components/site/LampSwitch";
import Blueprint from "@/components/site/Blueprint";
import { clamp, cn } from "@/lib/utils";
import type { HouseEngine } from "./engine";

const STAGES = [
  {
    n: "01",
    title: "Initial atmosphere",
    body: "Every project starts as massing and light — a white model where we test proportion, openings and how the day moves through the rooms.",
  },
  {
    n: "02",
    title: "Design direction",
    body: "Then the drawing takes over: walls, doors, furniture and every dimension set out on plan, so nothing on site is left to guesswork.",
  },
  {
    n: "03",
    title: "Material resolution",
    body: "Finally the finishes — oak, bouclé, linen, walnut and stone — lit for daylight and for the evening. Switch the lamp to see it after dark.",
  },
] as const;

type Quality = "high" | "low";

/** Full quality only on a wide screen with cores to spare and the power connected. */
async function chooseQuality(): Promise<Quality> {
  const wide = window.matchMedia("(min-width: 900px)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  let charging = true;
  try {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ charging: boolean }> };
    const battery = await nav.getBattery?.();
    if (battery) charging = battery.charging;
  } catch {
    /* no battery API — assume mains */
  }
  return wide && cores >= 6 && charging ? "high" : "low";
}

/**
 * The process, as a model that changes while you scroll past it.
 *
 * The section is three screens tall and holds its contents in view with
 * position: sticky, so the model stays on screen until its three stages have
 * played and the page then carries on. Its position drives the model. The words
 * sit in a title block beside the drawing (above it on a phone), so the model
 * never runs under them; within its own area the model drifts toward the part
 * that is on screen. three.js and the assets load only when the section is close.
 */
export default function HouseProcess() {
  const sectionRef = useRef<HTMLElement>(null);
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const labelsRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLSpanElement>(null);
  const lineRef = useRef<HTMLSpanElement>(null);
  const engineRef = useRef<HouseEngine | null>(null);
  const progressRef = useRef(0);
  const stageRef = useRef(0);

  const [stage, setStage] = useState(0);
  const [loaded, setLoaded] = useState(0);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "failed">("idle");
  const { mode } = useLights();
  const reduced = useReducedMotion();

  useEffect(() => {
    const section = sectionRef.current;
    const area = areaRef.current;
    const canvas = canvasRef.current;
    const labels = labelsRef.current;
    if (!section || !area || !canvas || !labels || reduced) return;

    let cancelled = false;

    // The drawing area's padding is the margin the model is fitted inside.
    const margins = { top: 0, right: 0, bottom: 0, left: 0 };
    const measure = () => {
      const style = getComputedStyle(area);
      margins.top = parseFloat(style.paddingTop) || 0;
      margins.right = parseFloat(style.paddingRight) || 0;
      margins.bottom = parseFloat(style.paddingBottom) || 0;
      margins.left = parseFloat(style.paddingLeft) || 0;
    };

    /** Frame the model on the middle of the part of the drawing area that is on screen. */
    const frame = () => {
      const rect = area.getBoundingClientRect();
      const top = Math.max(0, -rect.top);
      const bottom = Math.min(rect.height, window.innerHeight - rect.top);
      engineRef.current?.setFraming({ ...margins, focus: bottom > top ? (top + bottom) / 2 : rect.height / 2 });
    };

    const apply = (sectionProgress: number) => {
      const progress = clamp((sectionProgress - 0.05) / 0.9);
      progressRef.current = progress;
      const engine = engineRef.current;
      if (engine) {
        frame();
        engine.setProgress(progress);
      }
      if (railRef.current) railRef.current.style.transform = `scaleY(${progress})`;
      if (lineRef.current) lineRef.current.style.transform = `scaleX(${progress})`;
      const next = progress < 0.3 ? 0 : progress < 0.6 ? 1 : 2;
      if (next !== stageRef.current) {
        stageRef.current = next;
        setStage(next);
      }
    };

    measure();
    const resizeObserver = new ResizeObserver(() => {
      measure();
      frame();
    });
    resizeObserver.observe(area);

    const trigger = ScrollTrigger.create({
      trigger: section,
      // The section is three screens tall and its contents are sticky, so progress
      // runs from the moment it reaches the top of the screen to the moment it
      // leaves — exactly the time the model is held in view.
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => apply(self.progress),
      onRefresh: (self) => apply(self.progress),
    });

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        observer.disconnect();
        setStatus("loading");

        chooseQuality()
          .then((quality) =>
            import("./engine").then(({ createHouse }) =>
              createHouse(canvas, labels, {
                quality,
                onProgress: (fraction) => {
                  if (!cancelled) setLoaded(fraction);
                },
                // The canvas is transparent; the section paints the ground, so the
                // title block and the drawing are always exactly the same colour.
                onBackground: (color) => {
                  if (!cancelled) section.style.setProperty("--ground", color);
                },
              }),
            ),
          )
          .then((engine) => {
            if (cancelled) {
              engine.dispose();
              return;
            }
            engineRef.current = engine;
            engine.setEvening(lights.mode === "evening");
            frame();
            engine.setProgress(progressRef.current);
            setStatus("ready");
          })
          .catch((error) => {
            console.error("[house]", error);
            if (!cancelled) setStatus("failed");
          });
      },
      { rootMargin: "100% 0px" },
    );
    observer.observe(section);

    return () => {
      cancelled = true;
      trigger.kill();
      observer.disconnect();
      resizeObserver.disconnect();
      engineRef.current?.dispose();
      engineRef.current = null;
      section.style.removeProperty("--ground");
    };
  }, [reduced]);

  useEffect(() => {
    engineRef.current?.setEvening(mode === "evening");
  }, [mode, status]);

  const evening = mode === "evening";
  const darkUi = stage === 1 || (stage === 2 && evening);
  const lampShown = stage === 2;

  if (reduced || status === "failed") {
    return (
      <section data-surface="day" aria-label="Process" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <Blueprint drawing="plan" tone="paper" className="w-full" />
          </div>
          <ol className="flex flex-col gap-8 lg:col-span-4 lg:col-start-9">
            {STAGES.map((s) => (
              <li key={s.n} className="border-t border-rule pt-5">
                <span className="annotation text-accent">{s.n}</span>
                <h3 className="inked mt-2 text-d4">{s.title}</h3>
                <p className="mt-3 text-on-surface-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      aria-label="Process — from a white model to a plan to finished rooms"
      data-surface={darkUi ? "night" : "day"}
      className={cn(
        "relative h-[300svh] bg-[var(--ground,#e8e4dc)] transition-[color] duration-700",
        darkUi ? "text-bone" : "text-night",
      )}
    >
      <div className="sticky top-0 flex h-[100svh] min-h-[640px] flex-col overflow-hidden lg:flex-row">
      {/* Title block — the words never share space with the model. */}
      <div
        className={cn(
          "relative z-10 flex shrink-0 flex-col px-[var(--spacing-gutter)] pt-24 pb-3 transition-[border-color] duration-700 md:pt-28 lg:w-[clamp(21rem,30vw,30rem)] lg:border-r lg:pb-10",
          darkUi ? "border-white/15" : "border-night/15",
        )}
      >
        <p className={cn("eyebrow transition-colors duration-700", darkUi ? "text-glow" : "text-ember")}>
          The house — process
        </p>

        <div className="@container mt-4 lg:mt-6">
          <p
            aria-hidden="true"
            className={cn(
              // Tracked open enough that the outlined letters never cross.
              "text-[18cqw] leading-[0.8] font-[760] tracking-[0.02em] whitespace-nowrap uppercase transition-colors duration-700 [font-variation-settings:'wdth'_118]",
              // On the drawing the word is drawn too: outlined. The fill is the ground
              // colour painted over the stroke, which hides the overlapping strokes
              // inside letters like E, so only the outer edge shows.
              stage === 1 &&
                "[color:var(--ground,#0b0d0f)] [paint-order:stroke_fill] [-webkit-text-stroke:2px_rgb(236_241_245/0.78)]",
            )}
          >
            Process
          </p>
        </div>

        {/* Phone: the three stages in a row over one progress line. */}
        <div aria-hidden="true" className="mt-5 lg:hidden">
          <div className="flex items-baseline gap-3 whitespace-nowrap">
            {STAGES.map((s, i) => (
              <span
                key={s.n}
                className={cn("annotation transition-opacity duration-500", i === stage ? "opacity-100" : "opacity-40")}
              >
                {s.n}
              </span>
            ))}
            <span className="ml-2 truncate text-sm font-[520]">{STAGES[stage].title}</span>
          </div>
          <span
            className={cn(
              "relative mt-3 block h-px w-full overflow-hidden transition-colors duration-700",
              darkUi ? "bg-white/20" : "bg-night/15",
            )}
          >
            <span ref={lineRef} className={cn("absolute inset-0 origin-left scale-x-0", darkUi ? "bg-glow" : "bg-ember")} />
          </span>
        </div>

        {/* Wide screens: the stages as a list beside a progress rail. */}
        <ol aria-hidden="true" className="relative mt-10 hidden flex-col gap-3 pl-5 lg:flex">
          <span
            className={cn(
              "absolute top-0 left-0 h-full w-px transition-colors duration-700",
              darkUi ? "bg-white/20" : "bg-night/15",
            )}
          >
            <span ref={railRef} className={cn("block h-full w-full origin-top scale-y-0", darkUi ? "bg-glow" : "bg-ember")} />
          </span>
          {STAGES.map((s, i) => (
            <li
              key={s.n}
              className={cn(
                "flex items-baseline gap-3 whitespace-nowrap transition-opacity duration-500",
                i === stage ? "opacity-100" : "opacity-40",
              )}
            >
              <span className="annotation">{s.n}</span>
              <span className="font-[520]">{s.title}</span>
            </li>
          ))}
        </ol>

        {/* Every caption in one grid cell, so the block keeps the height of the longest. */}
        <div aria-hidden="true" className="mt-3 grid lg:mt-auto">
          {STAGES.map((s, i) => (
            <p
              key={s.n}
              className={cn(
                "col-start-1 row-start-1 max-w-md text-sm leading-relaxed transition-[opacity,transform] duration-700 ease-cut lg:text-base",
                i === stage ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
                darkUi ? "text-bone/80" : "text-night/75",
              )}
            >
              {s.body}
            </p>
          ))}
        </div>

        <div
          inert={!lampShown}
          className={cn("mt-6 hidden transition-opacity duration-500 lg:block", lampShown ? "opacity-100" : "opacity-0")}
        >
          <LampSwitch />
        </div>
      </div>

      {/* The drawing. Its padding is the margin the model is fitted inside. */}
      <div
        ref={areaRef}
        className="relative min-h-0 flex-1 px-5 pt-4 pb-16 md:px-10 lg:pt-24 lg:pr-[var(--spacing-gutter)] lg:pb-12 lg:pl-12"
      >
        <canvas ref={canvasRef} aria-hidden="true" className="absolute inset-0 h-full w-full" />
        {/* The plan's labels are sized in em, so they shrink with the drawing on a phone. */}
        <div
          ref={labelsRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden text-[9px] opacity-0 md:text-[10px] lg:text-[11px]"
        />

        {status !== "ready" && (
          <div className="absolute inset-0 grid place-items-center text-night">
            <div className="flex w-56 flex-col items-center gap-4">
              <span className="eyebrow">Building the model</span>
              <span className="relative block h-px w-full overflow-hidden bg-night/15">
                <span
                  className="absolute inset-0 origin-left bg-ember transition-transform duration-300"
                  style={{ transform: `scaleX(${loaded})` }}
                />
              </span>
              <span className="annotation text-night/60">{Math.round(loaded * 100)}%</span>
            </div>
          </div>
        )}

        <div
          inert={!lampShown}
          className={cn(
            "absolute right-[var(--spacing-gutter)] bottom-4 transition-opacity duration-500 lg:hidden",
            lampShown ? "opacity-100" : "opacity-0",
          )}
        >
          <LampSwitch />
        </div>
      </div>

      </div>

      <ol className="sr-only">
        {STAGES.map((s) => (
          <li key={s.n}>
            {s.title}: {s.body}
          </li>
        ))}
      </ol>
    </section>
  );
}
