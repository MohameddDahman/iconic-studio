import type { Wall } from "./plan";

/**
 * The drawing. Line work is collected as flat [x, y, z, x, y, z] segments in
 * the order it should be drawn — walls, openings, furniture, dimensions — so
 * revealing the first N segments draws the plan the way it is set out.
 */
export class PlanPen {
  readonly positions: number[] = [];

  constructor(private readonly y = 0.03) {}

  get count() {
    return this.positions.length / 6;
  }

  line(ax: number, az: number, bx: number, bz: number) {
    this.positions.push(ax, this.y, az, bx, this.y, bz);
  }

  /** A rectangle centred on (cx, cz), `w` along local x and `d` along local z, turned by `rotation` (radians, three.js Y convention). */
  rect(cx: number, cz: number, w: number, d: number, rotation = 0) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    const corner = (lx: number, lz: number): [number, number] => [cx + lx * cos + lz * sin, cz - lx * sin + lz * cos];
    const pts = [corner(-w / 2, -d / 2), corner(w / 2, -d / 2), corner(w / 2, d / 2), corner(-w / 2, d / 2)];
    for (let i = 0; i < 4; i++) {
      const [ax, az] = pts[i];
      const [bx, bz] = pts[(i + 1) % 4];
      this.line(ax, az, bx, bz);
    }
  }

  arc(cx: number, cz: number, r: number, from: number, to: number, segments = 18) {
    for (let i = 0; i < segments; i++) {
      const a = from + ((to - from) * i) / segments;
      const b = from + ((to - from) * (i + 1)) / segments;
      this.line(cx + Math.cos(a) * r, cz + Math.sin(a) * r, cx + Math.cos(b) * r, cz + Math.sin(b) * r);
    }
  }

  circle(cx: number, cz: number, r: number) {
    this.arc(cx, cz, r, 0, Math.PI * 2, 40);
  }

  /** Both faces of a wall, broken at its openings, with a door swing or glazing line in each. */
  wall(spec: Wall) {
    const [ax, az] = spec.a;
    const [bx, bz] = spec.b;
    const length = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / length;
    const uz = (bz - az) / length;
    const nx = -uz;
    const nz = ux;
    const half = spec.thickness / 2;
    const at = (s: number, offset: number): [number, number] => [ax + ux * s + nx * offset, az + uz * s + nz * offset];

    const solid = (from: number, to: number) => {
      if (to - from < 0.001) return;
      for (const side of [-half, half]) {
        const [x0, z0] = at(from, side);
        const [x1, z1] = at(to, side);
        this.line(x0, z0, x1, z1);
      }
      for (const s of [from, to]) {
        const [x0, z0] = at(s, -half);
        const [x1, z1] = at(s, half);
        this.line(x0, z0, x1, z1);
      }
    };

    const openings = [...(spec.openings ?? [])].sort((p, q) => p.at - q.at);
    let cursor = 0;
    for (const o of openings) {
      solid(cursor, o.at - o.width / 2);
      cursor = o.at + o.width / 2;
    }
    solid(cursor, length);

    for (const o of openings) {
      const start = o.at - o.width / 2;
      const end = o.at + o.width / 2;
      if (o.kind === "window") {
        for (const offset of [-half / 3, half / 3]) {
          const [x0, z0] = at(start, offset);
          const [x1, z1] = at(end, offset);
          this.line(x0, z0, x1, z1);
        }
      } else {
        const swing = o.swing ?? 1;
        const [hx, hz] = at(start, swing * half);
        const [lx, lz] = at(start, swing * (half + o.width));
        this.line(hx, hz, lx, lz);
        const base = Math.atan2(uz, ux);
        const open = Math.atan2(nz * swing, nx * swing);
        let delta = open - base;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        this.arc(hx, hz, o.width, base, base + delta, 16);
        const [ex, ez] = at(end, swing * half);
        this.line(ex, ez, ex, ez);
      }
    }
  }

  /** A dimension string with extension lines and architect's ticks. */
  dimension(ax: number, az: number, bx: number, bz: number, offset: number) {
    const length = Math.hypot(bx - ax, bz - az);
    const ux = (bx - ax) / length;
    const uz = (bz - az) / length;
    const nx = -uz * offset;
    const nz = ux * offset;
    const sx = Math.sign(offset) || 1;
    this.line(ax + nx * 0.25, az + nz * 0.25, ax + nx * 1.15, az + nz * 1.15);
    this.line(bx + nx * 0.25, bz + nz * 0.25, bx + nx * 1.15, bz + nz * 1.15);
    this.line(ax + nx, az + nz, bx + nx, bz + nz);
    const tick = 0.12 * sx;
    for (const [px, pz] of [
      [ax + nx, az + nz],
      [bx + nx, bz + nz],
    ]) {
      this.line(px - (ux + -uz) * tick, pz - (uz + ux) * tick, px + (ux + -uz) * tick, pz + (uz + ux) * tick);
    }
  }
}
