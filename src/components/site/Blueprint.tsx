"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { cn } from "@/lib/utils";

/**
 * Architectural drawings, drawn in SVG rather than photographed.
 *
 * Every line is real vector geometry, so the drawings stay crisp at any size
 * and can draw themselves: each stroke is normalised with pathLength=1 and its
 * dash offset animated from 1 to 0. Text, hatching and dashed guides fade in
 * after the linework, the way a drawing is annotated once it is set out.
 *
 * Without JavaScript (or with reduced motion) the drawing simply renders whole.
 */

/** Spread onto any shape that should draw itself. */
const DRAW = { "data-draw": "", pathLength: 1 } as const;

type Tone = "blueprint" | "paper" | "night";

const TONES: Record<Tone, string> = {
  blueprint:
    "bg-[#0c2136] text-[#cfe3f7] [--bp-grid:rgba(207,227,247,0.07)]",
  paper: "bg-[#f3efe8] text-[#2a241e] [--bp-grid:rgba(42,36,30,0.06)]",
  night: "bg-transparent text-bone [--bp-grid:rgba(244,238,228,0.05)]",
};

/* ---- Shared drawing furniture --------------------------------------------- */

function Text({
  x,
  y,
  children,
  size = 13,
  anchor = "start",
  rotate,
  opacity = 0.9,
}: {
  x: number;
  y: number;
  children: string;
  size?: number;
  anchor?: "start" | "middle" | "end";
  rotate?: number;
  opacity?: number;
}) {
  return (
    <text
      x={x}
      y={y}
      fill="currentColor"
      stroke="none"
      fontSize={size}
      textAnchor={anchor}
      opacity={opacity}
      letterSpacing={size * 0.14}
      transform={rotate ? `rotate(${rotate} ${x} ${y})` : undefined}
      style={{ fontFamily: "var(--font-mono), ui-monospace, monospace" }}
    >
      {children}
    </text>
  );
}

/** A horizontal dimension string with architectural ticks. */
function DimH({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  return (
    <g>
      <line {...DRAW} x1={x1} y1={y} x2={x2} y2={y} strokeWidth={0.9} />
      <line {...DRAW} x1={x1 - 6} y1={y + 6} x2={x1 + 6} y2={y - 6} strokeWidth={1.3} />
      <line {...DRAW} x1={x2 - 6} y1={y + 6} x2={x2 + 6} y2={y - 6} strokeWidth={1.3} />
      <g data-fade="">
        <Text x={(x1 + x2) / 2} y={y - 8} anchor="middle" size={12}>
          {label}
        </Text>
      </g>
    </g>
  );
}

/** A vertical dimension string. */
function DimV({ y1, y2, x, label }: { y1: number; y2: number; x: number; label: string }) {
  return (
    <g>
      <line {...DRAW} x1={x} y1={y1} x2={x} y2={y2} strokeWidth={0.9} />
      <line {...DRAW} x1={x - 6} y1={y1 + 6} x2={x + 6} y2={y1 - 6} strokeWidth={1.3} />
      <line {...DRAW} x1={x - 6} y1={y2 + 6} x2={x + 6} y2={y2 - 6} strokeWidth={1.3} />
      <g data-fade="">
        <Text x={x - 9} y={(y1 + y2) / 2} anchor="middle" size={12} rotate={-90}>
          {label}
        </Text>
      </g>
    </g>
  );
}

function Bubble({ cx, cy, label, guide }: { cx: number; cy: number; label: string; guide?: [number, number, number, number] }) {
  return (
    <g>
      <circle {...DRAW} cx={cx} cy={cy} r={14} strokeWidth={1.1} />
      <g data-fade="">
        {guide && (
          <line
            x1={guide[0]}
            y1={guide[1]}
            x2={guide[2]}
            y2={guide[3]}
            strokeWidth={0.6}
            strokeDasharray="6 7"
            opacity={0.5}
          />
        )}
        <Text x={cx} y={cy + 4.5} anchor="middle" size={12}>
          {label}
        </Text>
      </g>
    </g>
  );
}

/* ---- Drawing 1: apartment floor plan -------------------------------------- */

function FloorPlan() {
  return (
    <g>
      {/* Grid bubbles and their guide lines */}
      <Bubble cx={120} cy={24} label="A" guide={[120, 38, 120, 98]} />
      <Bubble cx={480} cy={24} label="B" guide={[480, 38, 480, 98]} />
      <Bubble cx={720} cy={24} label="C" guide={[720, 38, 720, 98]} />
      <Bubble cx={1080} cy={24} label="D" guide={[1080, 38, 1080, 98]} />
      <Bubble cx={24} cy={100} label="1" guide={[38, 100, 118, 100]} />
      <Bubble cx={24} cy={380} label="2" guide={[38, 380, 118, 380]} />
      <Bubble cx={24} cy={700} label="3" guide={[38, 700, 118, 700]} />

      {/* Exterior wall — outer and inner faces, broken at every opening */}
      <g strokeWidth={2.6}>
        <path {...DRAW} d="M 120 100 L 200 100 M 380 100 L 800 100 M 980 100 L 1080 100" />
        <path {...DRAW} d="M 134 114 L 200 114 M 380 114 L 800 114 M 980 114 L 1066 114" />
        <path {...DRAW} d="M 120 700 L 180 700 M 420 700 L 520 700 M 580 700 L 700 700 M 1000 700 L 1080 700" />
        <path {...DRAW} d="M 134 686 L 180 686 M 420 686 L 520 686 M 580 686 L 700 686 M 1000 686 L 1066 686" />
        <path {...DRAW} d="M 120 100 L 120 180 M 120 320 L 120 700" />
        <path {...DRAW} d="M 134 114 L 134 180 M 134 320 L 134 686" />
        <path {...DRAW} d="M 1080 100 L 1080 160 M 1080 300 L 1080 700" />
        <path {...DRAW} d="M 1066 114 L 1066 160 M 1066 300 L 1066 686" />
        <path {...DRAW} d="M 520 686 L 520 700 M 580 686 L 580 700" />
      </g>

      {/* Windows: frame and glazing line */}
      <g strokeWidth={1.2}>
        <rect {...DRAW} x={200} y={100} width={180} height={14} />
        <line {...DRAW} x1={200} y1={107} x2={380} y2={107} />
        <rect {...DRAW} x={800} y={100} width={180} height={14} />
        <line {...DRAW} x1={800} y1={107} x2={980} y2={107} />
        <rect {...DRAW} x={180} y={686} width={240} height={14} />
        <line {...DRAW} x1={180} y1={693} x2={420} y2={693} />
        <rect {...DRAW} x={700} y={686} width={300} height={14} />
        <line {...DRAW} x1={700} y1={693} x2={1000} y2={693} />
        <rect {...DRAW} x={120} y={180} width={14} height={140} />
        <line {...DRAW} x1={127} y1={180} x2={127} y2={320} />
        <rect {...DRAW} x={1066} y={160} width={14} height={140} />
        <line {...DRAW} x1={1073} y1={160} x2={1073} y2={300} />
      </g>

      {/* Interior partitions */}
      <g strokeWidth={1.6}>
        <rect {...DRAW} x={134} y={372} width={336} height={8} />
        <rect {...DRAW} x={720} y={372} width={346} height={8} />
        <rect {...DRAW} x={480} y={114} width={8} height={186} />
        <rect {...DRAW} x={480} y={352} width={8} height={20} />
        <rect {...DRAW} x={712} y={114} width={8} height={186} />
        <rect {...DRAW} x={712} y={352} width={8} height={28} />
        <rect {...DRAW} x={488} y={252} width={72} height={8} />
        <rect {...DRAW} x={612} y={252} width={100} height={8} />
      </g>

      {/* Doors: leaf and swing */}
      <g>
        <line {...DRAW} x1={480} y1={352} x2={428} y2={352} strokeWidth={1.4} />
        <path {...DRAW} d="M 428 352 A 52 52 0 0 1 480 300" strokeWidth={0.8} />
        <line {...DRAW} x1={720} y1={352} x2={772} y2={352} strokeWidth={1.4} />
        <path {...DRAW} d="M 772 352 A 52 52 0 0 0 720 300" strokeWidth={0.8} />
        <line {...DRAW} x1={560} y1={260} x2={560} y2={312} strokeWidth={1.4} />
        <path {...DRAW} d="M 560 312 A 52 52 0 0 0 612 260" strokeWidth={0.8} />
        <line {...DRAW} x1={520} y1={686} x2={520} y2={626} strokeWidth={1.4} />
        <path {...DRAW} d="M 520 626 A 60 60 0 0 1 580 686" strokeWidth={0.8} />
      </g>

      {/* Furniture — master bedroom */}
      <g strokeWidth={1}>
        <rect {...DRAW} x={180} y={160} width={200} height={170} rx={4} />
        <rect {...DRAW} x={196} y={172} width={78} height={34} rx={7} />
        <rect {...DRAW} x={286} y={172} width={78} height={34} rx={7} />
        <line {...DRAW} x1={180} y1={236} x2={380} y2={236} />
        <rect {...DRAW} x={144} y={170} width={30} height={30} />
        <rect {...DRAW} x={386} y={170} width={30} height={30} />
        <rect {...DRAW} x={432} y={130} width={44} height={200} />
        <line {...DRAW} x1={432} y1={196} x2={476} y2={196} />
        <line {...DRAW} x1={432} y1={262} x2={476} y2={262} />
      </g>

      {/* Furniture — bath */}
      <g strokeWidth={1}>
        <rect {...DRAW} x={500} y={128} width={196} height={64} rx={18} />
        <rect {...DRAW} x={510} y={136} width={176} height={48} rx={14} />
        <rect {...DRAW} x={628} y={200} width={64} height={40} rx={6} />
        <circle {...DRAW} cx={660} cy={220} r={11} />
        <rect {...DRAW} x={500} y={200} width={36} height={18} rx={3} />
        <circle {...DRAW} cx={518} cy={234} r={15} />
      </g>

      {/* Furniture — bedroom */}
      <g strokeWidth={1}>
        <rect {...DRAW} x={820} y={130} width={190} height={140} rx={4} />
        <rect {...DRAW} x={832} y={140} width={76} height={30} rx={6} />
        <rect {...DRAW} x={922} y={140} width={76} height={30} rx={6} />
        <rect {...DRAW} x={900} y={330} width={150} height={36} />
        <circle {...DRAW} cx={975} cy={312} r={13} />
      </g>

      {/* Furniture — living */}
      <g strokeWidth={1}>
        <rect {...DRAW} x={200} y={386} width={240} height={20} />
        <rect {...DRAW} x={170} y={580} width={260} height={70} rx={8} />
        <rect {...DRAW} x={170} y={630} width={260} height={20} rx={4} />
        <rect {...DRAW} x={170} y={580} width={24} height={70} rx={6} />
        <rect {...DRAW} x={406} y={580} width={24} height={70} rx={6} />
        <rect {...DRAW} x={240} y={480} width={120} height={64} rx={14} />
        <rect {...DRAW} x={452} y={470} width={70} height={70} rx={12} />
        <rect {...DRAW} x={452} y={560} width={70} height={70} rx={12} />
      </g>
      <g data-fade="">
        <rect x={160} y={440} width={300} height={230} strokeWidth={0.7} strokeDasharray="8 6" opacity={0.55} />
      </g>

      {/* Furniture — kitchen and dining */}
      <g strokeWidth={1}>
        <rect {...DRAW} x={1006} y={420} width={60} height={250} />
        <rect {...DRAW} x={1016} y={470} width={40} height={60} rx={6} />
        <circle {...DRAW} cx={1026} cy={590} r={8} />
        <circle {...DRAW} cx={1046} cy={590} r={8} />
        <circle {...DRAW} cx={1026} cy={620} r={8} />
        <circle {...DRAW} cx={1046} cy={620} r={8} />
        <rect {...DRAW} x={780} y={470} width={190} height={80} rx={4} />
        <circle {...DRAW} cx={810} cy={566} r={11} />
        <circle {...DRAW} cx={860} cy={566} r={11} />
        <circle {...DRAW} cx={910} cy={566} r={11} />
        <rect {...DRAW} x={620} y={586} width={170} height={64} rx={4} />
        <rect {...DRAW} x={640} y={566} width={26} height={14} rx={3} />
        <rect {...DRAW} x={692} y={566} width={26} height={14} rx={3} />
        <rect {...DRAW} x={744} y={566} width={26} height={14} rx={3} />
        <rect {...DRAW} x={640} y={656} width={26} height={14} rx={3} />
        <rect {...DRAW} x={692} y={656} width={26} height={14} rx={3} />
        <rect {...DRAW} x={744} y={656} width={26} height={14} rx={3} />
      </g>

      {/* Dimensions */}
      <DimH x1={120} x2={1080} y={58} label="14 400" />
      <DimH x1={120} x2={480} y={80} label="5 400" />
      <DimH x1={480} x2={720} y={80} label="3 600" />
      <DimH x1={720} x2={1080} y={80} label="5 400" />
      <DimV y1={100} y2={700} x={66} label="9 000" />
      <DimV y1={100} y2={380} x={92} label="4 200" />
      <DimV y1={380} y2={700} x={92} label="4 800" />

      {/* Room names and areas */}
      <g data-fade="">
        <Text x={300} y={528} anchor="middle" size={13}>LIVING</Text>
        <Text x={300} y={546} anchor="middle" size={10} opacity={0.6}>42.6 M²</Text>
        <Text x={880} y={430} anchor="middle" size={13}>KITCHEN · DINING</Text>
        <Text x={880} y={448} anchor="middle" size={10} opacity={0.6}>36.2 M²</Text>
        <Text x={300} y={358} anchor="middle" size={13}>MASTER BEDROOM</Text>
        <Text x={600} y={236} anchor="middle" size={12}>BATH</Text>
        <Text x={600} y={326} anchor="middle" size={12}>HALL</Text>
        <Text x={880} y={358} anchor="middle" size={13}>BEDROOM</Text>
      </g>

      {/* North arrow and scale bar */}
      <g>
        <circle {...DRAW} cx={1130} cy={640} r={22} strokeWidth={1} />
        <path {...DRAW} d="M 1130 614 L 1142 652 L 1130 644 L 1118 652 Z" strokeWidth={1} />
        <rect {...DRAW} x={820} y={748} width={333} height={8} strokeWidth={1} />
      </g>
      <g data-fade="">
        <Text x={1130} y={606} anchor="middle" size={12}>N</Text>
        <rect x={820} y={748} width={67} height={8} fill="currentColor" stroke="none" opacity={0.85} />
        <rect x={953} y={748} width={67} height={8} fill="currentColor" stroke="none" opacity={0.85} />
        <rect x={1087} y={748} width={66} height={8} fill="currentColor" stroke="none" opacity={0.85} />
        <Text x={820} y={776} anchor="middle" size={10}>0</Text>
        <Text x={887} y={776} anchor="middle" size={10}>1</Text>
        <Text x={1020} y={776} anchor="middle" size={10}>3</Text>
        <Text x={1153} y={776} anchor="middle" size={10}>5 M</Text>
        <Text x={120} y={758} size={13}>GROUND FLOOR PLAN</Text>
        <Text x={120} y={778} size={10} opacity={0.6}>APARTMENT · MOUNTAIN VIEW · SCALE 1:100</Text>
      </g>
    </g>
  );
}

/* ---- Drawing 2: interior elevation of the reception wall ------------------- */

function Elevation() {
  const slats = Array.from({ length: 22 }, (_, k) => 650 + k * 16);
  const hatch = Array.from({ length: 40 }, (_, k) => 120 + k * 24);

  return (
    <g>
      {/* Structure: slab, floor, wall edges */}
      <g strokeWidth={2.6}>
        <line {...DRAW} x1={120} y1={110} x2={1040} y2={110} />
        <line {...DRAW} x1={120} y1={640} x2={1040} y2={640} />
        <line {...DRAW} x1={120} y1={110} x2={120} y2={640} />
        <line {...DRAW} x1={1040} y1={110} x2={1040} y2={640} />
      </g>

      {/* Section hatching through slab and floor */}
      <g data-fade="" strokeWidth={0.6} opacity={0.45}>
        {hatch.map((x) => (
          <line key={`s${x}`} x1={x} y1={110} x2={x + 20} y2={90} />
        ))}
        {hatch.map((x) => (
          <line key={`f${x}`} x1={x} y1={664} x2={x + 20} y2={644} />
        ))}
      </g>

      {/* Gypsum cove ceiling and the LED strip it hides */}
      <path {...DRAW} d="M 120 130 L 160 130 L 160 150 L 1000 150 L 1000 130 L 1040 130" strokeWidth={1.6} />
      <circle {...DRAW} cx={140} cy={123} r={3.5} strokeWidth={1.2} />
      <circle {...DRAW} cx={1020} cy={123} r={3.5} strokeWidth={1.2} />
      <g data-fade="" strokeWidth={0.6} strokeDasharray="3 5" opacity={0.6}>
        <line x1={144} y1={128} x2={210} y2={196} />
        <line x1={1016} y1={128} x2={950} y2={196} />
      </g>

      {/* Walnut slat screen */}
      <g strokeWidth={1}>
        {slats.map((x) => (
          <line key={x} {...DRAW} x1={x} y1={166} x2={x} y2={640} />
        ))}
      </g>

      {/* Niche shelving */}
      <g strokeWidth={1.1}>
        <rect {...DRAW} x={136} y={200} width={52} height={300} />
        <line {...DRAW} x1={136} y1={280} x2={188} y2={280} />
        <line {...DRAW} x1={136} y1={360} x2={188} y2={360} />
        <line {...DRAW} x1={136} y1={440} x2={188} y2={440} />
      </g>

      {/* Television and floating console */}
      <g strokeWidth={1.2}>
        <rect {...DRAW} x={230} y={300} width={320} height={190} />
        <rect {...DRAW} x={242} y={312} width={296} height={166} />
        <rect {...DRAW} x={200} y={515} width={380} height={50} />
        <line {...DRAW} x1={327} y1={515} x2={327} y2={565} />
        <line {...DRAW} x1={453} y1={515} x2={453} y2={565} />
      </g>
      <g data-fade="">
        <line x1={210} y1={580} x2={570} y2={580} strokeWidth={0.6} strokeDasharray="10 6" opacity={0.5} />
        <rect x={250} y={590} width={520} height={50} rx={10} strokeWidth={0.7} strokeDasharray="8 6" opacity={0.4} />
      </g>

      {/* Levels */}
      <g strokeWidth={1}>
        <path {...DRAW} d="M 104 640 L 96 626 L 112 626 Z" />
        <path {...DRAW} d="M 104 150 L 96 136 L 112 136 Z" />
        <path {...DRAW} d="M 104 110 L 96 96 L 112 96 Z" />
      </g>

      {/* Dimensions */}
      <DimV y1={150} y2={640} x={1086} label="2 700" />
      <DimV y1={110} y2={640} x={1128} label="2 950" />
      <DimH x1={120} x2={1040} y={692} label="4 900" />
      <DimH x1={650} x2={986} y={728} label="1 800" />

      {/* Annotation */}
      <g data-fade="">
        <Text x={90} y={644} anchor="end" size={11}>±0.00</Text>
        <Text x={90} y={154} anchor="end" size={11}>+2.70</Text>
        <Text x={90} y={100} anchor="end" size={11}>+2.95</Text>
        <line x1={150} y1={128} x2={214} y2={70} strokeWidth={0.7} />
        <Text x={220} y={66} size={12}>GYPSUM COVE — LED STRIP 3000K</Text>
        <line x1={818} y1={300} x2={862} y2={70} strokeWidth={0.7} />
        <Text x={868} y={66} size={12}>WALNUT SLATS 45×20 @ 60</Text>
        <Text x={390} y={286} anchor="middle" size={11} opacity={0.7}>TV — 75&quot;</Text>
        <Text x={390} y={602} anchor="middle" size={11} opacity={0.7}>FLOATING CONSOLE · OAK VENEER</Text>
        <Text x={120} y={778} size={13}>ELEVATION A — RECEPTION WALL</Text>
        <Text x={1040} y={778} anchor="end" size={10} opacity={0.6}>SCALE 1:50</Text>
      </g>
    </g>
  );
}

const DRAWINGS = {
  plan: { Component: FloorPlan, title: "Ground floor plan of a Mountain View apartment" },
  elevation: { Component: Elevation, title: "Elevation of the reception wall: cove ceiling, walnut slats and TV console" },
} as const;

export type DrawingKind = keyof typeof DRAWINGS;

export default function Blueprint({
  drawing,
  tone = "blueprint",
  scrub = false,
  start = "top 78%",
  end = "bottom 60%",
  showGrid = true,
  className,
}: {
  drawing: DrawingKind;
  tone?: Tone;
  /** Tie the drawing to scroll position instead of playing once on arrival. */
  scrub?: boolean;
  start?: string;
  end?: string;
  showGrid?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLElement>(null);
  const { Component, title } = DRAWINGS[drawing];

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;
      const strokes = root.querySelectorAll("[data-draw]");
      const fades = root.querySelectorAll("[data-fade]");

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.set(strokes, { strokeDasharray: 1, strokeDashoffset: 1 });
        gsap.set(fades, { opacity: 0 });

        const tl = gsap.timeline({
          scrollTrigger: scrub
            ? { trigger: root, start, end, scrub: true }
            : { trigger: root, start, once: true },
        });

        tl.to(strokes, {
          strokeDashoffset: 0,
          duration: scrub ? 1 : 2.2,
          ease: "power1.inOut",
          stagger: { amount: scrub ? 0.8 : 1.6, from: "start" },
        }).to(fades, { opacity: 1, duration: scrub ? 0.3 : 0.8, stagger: 0.02 }, scrub ? 0.7 : 1.4);
      });

      return () => mm.revert();
    },
    { scope: rootRef, dependencies: [drawing, scrub, start, end] },
  );

  return (
    <figure ref={rootRef} className={cn("relative overflow-hidden", TONES[tone], className)}>
      {showGrid && (
        <div
          aria-hidden="true"
          className="absolute inset-0 [background-image:linear-gradient(var(--bp-grid)_1px,transparent_1px),linear-gradient(90deg,var(--bp-grid)_1px,transparent_1px)] [background-size:28px_28px]"
        />
      )}
      <svg viewBox="0 0 1200 800" role="img" aria-label={title} className="relative block h-auto w-full">
        <g fill="none" stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter">
          <Component />
        </g>
      </svg>
    </figure>
  );
}
