"use client";

import { cn } from "@/lib/utils";

/**
 * The reflected ceiling plan — the signature of the site.
 *
 * An RCP is the drawing an interior designer actually issues: the ceiling seen
 * from above, with every cove, downlight and pendant set out on it. Iconic's
 * work is lit almost entirely from its edges, so this is the drawing that
 * explains what they do. As the walkthrough moves from room to room, that
 * room's fittings come on — the plan does the thing the drawing describes.
 *
 * Drawn in a 100 × 64 user space. Room centres here are the plan coordinates
 * carried on each threshold.
 */

export interface PlanRoom {
  id: string;
  label: string;
  /** Downlight positions. */
  lights: [number, number][];
  /** Cove run, as an SVG path in the same user space. */
  cove?: string;
}

export const PLAN_ROOMS: PlanRoom[] = [
  {
    id: "master",
    label: "MASTER",
    lights: [[15, 12], [31, 12], [15, 22], [31, 22]],
    cove: "M11 9 H35",
  },
  {
    id: "childrens",
    label: "CHILDREN",
    lights: [[44, 13], [56, 13], [50, 23]],
    cove: "M42 9 H58",
  },
  {
    id: "dining",
    label: "DINING",
    lights: [[70, 12], [84, 12], [77, 23]],
    cove: "M66 9 H88",
  },
  {
    id: "bathroom",
    label: "BATH",
    lights: [[48, 32], [58, 32], [53, 37]],
  },
  {
    id: "reception",
    label: "RECEPTION",
    lights: [[16, 45], [26, 45], [36, 45], [21, 53], [31, 53]],
    cove: "M11 43 H41",
  },
  {
    id: "entrance",
    label: "HALL",
    lights: [[53, 45], [53, 53]],
  },
  {
    id: "living",
    label: "LIVING",
    lights: [[68, 45], [78, 45], [88, 45], [73, 53], [83, 53]],
    cove: "M65 43 H89",
  },
];

interface Props {
  /** Which room's fittings are lit. */
  activeRoom?: string;
  className?: string;
  showLabels?: boolean;
  /** Marker position in plan units; omit to hide the marker. */
  marker?: { x: number; y: number };
}

export default function PlanDrawing({
  activeRoom,
  className,
  showLabels = false,
  marker,
}: Props) {
  return (
    <svg
      viewBox="0 0 100 64"
      role="img"
      aria-label="Reflected ceiling plan of the apartment, showing which room you are in"
      className={cn("h-auto w-full text-current", className)}
    >
      {/* North arrow — every plan has one */}
      <g transform="translate(95 60)" opacity={0.45}>
        <path d="M0 -4 L1.6 2 L0 0.9 L-1.6 2 Z" fill="currentColor" />
      </g>

      {/* Envelope, broken at the front door */}
      <path
        d="M8 6 H92 V58 H54 M46 58 H8 V6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="square"
      />

      {/* Partitions. Gaps are openings; the living and dining ends have no wall
          between them because that division is made in the ceiling. */}
      <g fill="none" stroke="currentColor" strokeWidth={1} opacity={0.9}>
        <path d="M8 28 H26 M34 28 H48 M56 28 H62" />
        <path d="M38 6 V16 M38 22 V28" />
        <path d="M62 6 V28" />
        <path d="M44 40 V58" />
        <path d="M62 40 V46 M62 52 V58" />
        <path d="M44 40 H50 M58 40 H62" />
      </g>

      {/* Door swing at the entrance */}
      <path
        d="M46 58 A8 8 0 0 1 54 58"
        fill="none"
        stroke="currentColor"
        strokeWidth={0.35}
        opacity={0.45}
      />

      {/* The ceiling itself */}
      {PLAN_ROOMS.map((room) => {
        const lit = room.id === activeRoom;
        return (
          <g key={room.id} data-plan-room={room.id}>
            {room.cove && (
              <path
                d={room.cove}
                fill="none"
                strokeWidth={lit ? 1.6 : 0.9}
                strokeLinecap="round"
                className={cn(
                  "transition-all duration-700",
                  lit ? "stroke-glow" : "stroke-current opacity-25",
                )}
              />
            )}
            {room.lights.map(([lx, ly], i) => (
              <g key={i}>
                {lit && (
                  <circle
                    cx={lx}
                    cy={ly}
                    r={3.4}
                    className="fill-glow/20 transition-opacity duration-700"
                  />
                )}
                <circle
                  cx={lx}
                  cy={ly}
                  r={0.85}
                  strokeWidth={0.4}
                  className={cn(
                    "transition-all duration-500",
                    lit ? "fill-glow stroke-glow" : "fill-none stroke-current opacity-35",
                  )}
                />
              </g>
            ))}
          </g>
        );
      })}

      {showLabels && (
        <g
          fill="currentColor"
          fontSize={2.3}
          letterSpacing={0.35}
          style={{ fontFamily: "var(--font-mono)" }}
        >
          <text x={23} y={26} textAnchor="middle" opacity={activeRoom === "master" ? 0.95 : 0.4}>MASTER</text>
          <text x={50} y={26} textAnchor="middle" opacity={activeRoom === "childrens" ? 0.95 : 0.4}>CHILDREN</text>
          <text x={77} y={26} textAnchor="middle" opacity={activeRoom === "dining" ? 0.95 : 0.4}>DINING</text>
          <text x={53} y={38.5} textAnchor="middle" opacity={activeRoom === "bathroom" ? 0.95 : 0.4}>BATH</text>
          <text x={26} y={57} textAnchor="middle" opacity={activeRoom === "reception" ? 0.95 : 0.4}>RECEPTION</text>
          <text x={77} y={57} textAnchor="middle" opacity={activeRoom === "living" ? 0.95 : 0.4}>LIVING</text>
        </g>
      )}

      {marker && (
        <g
          className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translate(${marker.x}px, ${marker.y}px)`, transformBox: "view-box" }}
        >
          <circle r={1.7} className="fill-glow" />
          <circle r={4} className="fill-none stroke-glow/50" strokeWidth={0.4} />
        </g>
      )}
    </svg>
  );
}
