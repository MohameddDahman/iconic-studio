/**
 * The apartment in the process model, in metres.
 * x runs east, z runs south, y is up. The camera looks in from the south-east,
 * so the north and west walls are the ones built full height.
 */

export const PLAN = {
  width: 14,
  depth: 9,
  wallHeight: 2.6,
  slab: 0.26,
};

export interface Opening {
  /** Distance along the wall, from `a`, to the centre of the opening. */
  at: number;
  width: number;
  sill: number;
  head: number;
  kind: "door" | "window";
  /** Which side a door leaf swings to: +1 toward the wall's local +z, -1 toward -z. */
  swing?: 1 | -1;
}

export interface Wall {
  id: string;
  a: [number, number];
  b: [number, number];
  thickness: number;
  openings?: Opening[];
}

export const WALLS: Wall[] = [
  {
    id: "north",
    a: [0, 0],
    b: [14, 0],
    thickness: 0.2,
    openings: [
      { at: 6.6, width: 1.0, sill: 0, head: 2.2, kind: "door", swing: 1 },
      { at: 11.5, width: 2.2, sill: 1.05, head: 2.3, kind: "window" },
    ],
  },
  {
    id: "west",
    a: [0, 0],
    b: [0, 9],
    thickness: 0.2,
    openings: [
      { at: 1.75, width: 1.5, sill: 0.75, head: 2.3, kind: "window" },
      { at: 8.05, width: 1.2, sill: 0.4, head: 2.35, kind: "window" },
    ],
  },
  {
    id: "bedroom-living",
    a: [0, 3.4],
    b: [5.1, 3.4],
    thickness: 0.12,
    openings: [{ at: 4.5, width: 0.9, sill: 0, head: 2.1, kind: "door", swing: -1 }],
  },
  { id: "bedroom-entrance", a: [5.1, 0], b: [5.1, 3.4], thickness: 0.12 },
];

export interface Room {
  id: string;
  label: string;
  x: number;
  z: number;
}

/** Label positions for the drawing. */
export const ROOMS: Room[] = [
  { id: "bedroom", label: "Bedroom", x: 0.9, z: 1.5 },
  { id: "entrance", label: "Entrance", x: 7.1, z: 2.1 },
  { id: "kitchen", label: "Kitchen", x: 11.3, z: 1.75 },
  { id: "living", label: "Living", x: 3.3, z: 8.5 },
  { id: "dining", label: "Dining", x: 10.9, z: 8.15 },
];

/** Where the drawn dimension strings break along the north and west walls. */
export const DIMENSION_BREAKS = {
  x: [0, 5.1, 8.4, 14],
  z: [0, 3.4, 9],
};
