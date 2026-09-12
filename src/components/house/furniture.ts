import {
  BoxGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  QuadraticBezierCurve3,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type MeshStandardMaterial,
} from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { worldUV } from "./look";
import type { Wall } from "./plan";

/**
 * Procedural furniture and architecture. Everything is built at true size in
 * metres, faces +z, and sits with its origin on the floor at its centre, so
 * placing a piece is a position and a rotation — nothing is scaled to fit.
 */

export interface Kit {
  plaster: MeshStandardMaterial;
  floor: MeshStandardMaterial;
  terrazzo: MeshStandardMaterial;
  marble: MeshStandardMaterial;
  oak: MeshStandardMaterial;
  walnut: MeshStandardMaterial;
  boucle: MeshStandardMaterial;
  teddy: MeshStandardMaterial;
  linen: MeshStandardMaterial;
  linenWhite: MeshStandardMaterial;
  velvet: MeshStandardMaterial;
  leather: MeshStandardMaterial;
  rug: MeshStandardMaterial;
  rugBorder: MeshStandardMaterial;
  metalDark: MeshStandardMaterial;
  brass: MeshStandardMaterial;
  glass: MeshStandardMaterial;
  mirror: MeshStandardMaterial;
  screen: MeshStandardMaterial;
  shade: MeshStandardMaterial;
  ceramic: MeshStandardMaterial;
  slab: MeshStandardMaterial;
  plinth: MeshStandardMaterial;
}

const tileOf = (material: MeshStandardMaterial) => (material.userData.tile as number | undefined) ?? 1;

export function part(geometry: BufferGeometry, material: MeshStandardMaterial, x = 0, y = 0, z = 0) {
  if (material.map || material.normalMap) worldUV(geometry, tileOf(material));
  const mesh = new Mesh(geometry, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export const box = (w: number, h: number, d: number, m: MeshStandardMaterial, x = 0, y = 0, z = 0) =>
  part(new BoxGeometry(w, h, d), m, x, y, z);

export const soft = (w: number, h: number, d: number, r: number, m: MeshStandardMaterial, x = 0, y = 0, z = 0) =>
  part(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)), m, x, y, z);

export const cylinder = (
  top: number,
  bottom: number,
  h: number,
  m: MeshStandardMaterial,
  x = 0,
  y = 0,
  z = 0,
  segments = 40,
) => part(new CylinderGeometry(top, bottom, h, segments), m, x, y, z);

/* ---- Seating ------------------------------------------------------------ */

export function sofa(kit: Kit, length = 2.7, depth = 1.0) {
  const g = new Group();
  const cushion = (length - 0.36) / 2;
  g.add(box(length - 0.08, 0.05, depth - 0.12, kit.plinth, 0, 0.025, 0));
  g.add(soft(length, 0.24, depth, 0.05, kit.boucle, 0, 0.17, 0));
  for (const side of [-1, 1]) {
    g.add(soft(cushion - 0.02, 0.17, depth - 0.3, 0.07, kit.boucle, side * (cushion / 2 + 0.01), 0.37, 0.1));
    g.add(soft(cushion - 0.08, 0.36, 0.2, 0.08, kit.boucle, side * (cushion / 2 + 0.01), 0.62, -(depth / 2 - 0.34)));
    g.add(soft(0.18, 0.36, depth, 0.08, kit.boucle, side * (length / 2 - 0.09), 0.37, 0));
  }
  g.add(soft(length, 0.46, 0.22, 0.09, kit.boucle, 0, 0.5, -(depth / 2 - 0.11)));
  return g;
}

export function diningChair(kit: Kit) {
  const g = new Group();
  for (const [x, z] of [
    [-0.19, -0.19],
    [0.19, -0.19],
    [-0.19, 0.19],
    [0.19, 0.19],
  ]) {
    g.add(box(0.03, 0.44, 0.03, kit.walnut, x, 0.22, z));
  }
  g.add(soft(0.48, 0.08, 0.48, 0.03, kit.velvet, 0, 0.47, 0));
  const back = soft(0.46, 0.4, 0.06, 0.025, kit.velvet, 0, 0.73, -0.22);
  back.rotation.x = -0.1;
  g.add(back);
  return g;
}

export function stool(kit: Kit) {
  const g = new Group();
  g.add(cylinder(0.19, 0.18, 0.06, kit.leather, 0, 0.72, 0));
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const leg = cylinder(0.012, 0.012, 0.7, kit.metalDark, Math.cos(a) * 0.13, 0.35, Math.sin(a) * 0.13, 10);
    g.add(leg);
  }
  const ring = part(new TorusGeometry(0.14, 0.008, 8, 40), kit.metalDark, 0, 0.26, 0);
  ring.rotation.x = Math.PI / 2;
  g.add(ring);
  return g;
}

/* ---- Tables & storage --------------------------------------------------- */

export function diningTable(kit: Kit, length = 2.4, width = 1.0) {
  const g = new Group();
  g.add(soft(length, 0.05, width, 0.012, kit.walnut, 0, 0.735, 0));
  for (const side of [-1, 1]) {
    g.add(box(0.07, 0.71, width - 0.3, kit.walnut, side * (length / 2 - 0.35), 0.355, 0));
  }
  g.add(box(length - 0.8, 0.05, 0.06, kit.walnut, 0, 0.62, 0));
  return g;
}

export function nightstand(kit: Kit) {
  const g = new Group();
  g.add(soft(0.5, 0.45, 0.42, 0.015, kit.walnut, 0, 0.225, 0));
  g.add(box(0.46, 0.006, 0.01, kit.plinth, 0, 0.3, 0.212));
  g.add(cylinder(0.045, 0.065, 0.26, kit.ceramic, 0.08, 0.58, -0.04, 24));
  const shade = part(new CylinderGeometry(0.12, 0.15, 0.2, 40, 1, true), kit.shade, 0.08, 0.8, -0.04);
  g.add(shade);
  return { group: g, light: new Vector3(0.08, 0.78, -0.04) };
}

export function kitchenRun(kit: Kit, length: number, depth = 0.62) {
  const g = new Group();
  g.add(box(length - 0.04, 0.09, depth - 0.1, kit.plinth, 0, 0.045, -0.04));
  g.add(box(length, 0.78, depth - 0.02, kit.oak, 0, 0.48, 0));
  const doors = Math.round(length / 0.6);
  for (let i = 1; i < doors; i++) {
    g.add(box(0.006, 0.7, 0.01, kit.plinth, -length / 2 + (i * length) / doors, 0.48, depth / 2 - 0.005));
  }
  g.add(box(length, 0.03, 0.012, kit.plinth, 0, 0.84, depth / 2 - 0.004));
  g.add(soft(length + 0.02, 0.04, depth + 0.02, 0.006, kit.marble, 0, 0.9, 0));
  // sink and tap
  g.add(box(0.72, 0.012, 0.42, kit.metalDark, -length / 2 + 1.7, 0.921, 0.02));
  const spout = part(new TorusGeometry(0.12, 0.012, 10, 24, Math.PI), kit.brass, -length / 2 + 1.7, 1.02, -0.2);
  spout.rotation.y = Math.PI / 2;
  g.add(spout);
  g.add(cylinder(0.014, 0.014, 0.1, kit.brass, -length / 2 + 1.7, 0.97, -0.2 - 0.12, 12));
  // cooktop
  g.add(box(0.78, 0.008, 0.5, kit.screen, length / 2 - 0.75, 0.922, 0));
  return g;
}

export function tallUnit(kit: Kit, width: number, height = 2.4, depth = 0.62) {
  const g = new Group();
  g.add(box(width, height, depth, kit.oak, 0, height / 2, 0));
  g.add(box(0.006, height - 0.1, 0.01, kit.plinth, 0, height / 2, depth / 2 + 0.002));
  g.add(box(0.56, 0.56, 0.012, kit.screen, width / 4, 1.18, depth / 2 + 0.004));
  g.add(box(0.56, 0.02, 0.02, kit.brass, width / 4, 1.5, depth / 2 + 0.012));
  return g;
}

export function island(kit: Kit, length = 2.6, depth = 1.0, height = 0.92) {
  const g = new Group();
  g.add(box(length - 0.1, height - 0.05, depth - 0.12, kit.oak, 0, (height - 0.05) / 2, -0.02));
  g.add(soft(length, 0.05, depth, 0.008, kit.marble, 0, height - 0.025, 0));
  for (const side of [-1, 1]) {
    g.add(box(0.05, height - 0.05, depth, kit.marble, side * (length / 2 - 0.025), (height - 0.05) / 2, 0));
  }
  return g;
}

export function shelf(kit: Kit, length = 1.0) {
  const g = new Group();
  g.add(box(length, 0.035, 0.28, kit.walnut, 0, 0, 0));
  for (const side of [-1, 1]) g.add(box(0.02, 0.12, 0.02, kit.brass, side * (length / 2 - 0.12), -0.07, -0.12));
  return g;
}

/* ---- Bedroom ------------------------------------------------------------ */

export function bed(kit: Kit, width = 1.8, length = 2.1) {
  const g = new Group();
  g.add(soft(width + 0.06, 0.28, length, 0.03, kit.linen, 0, 0.16, 0));
  g.add(soft(width - 0.04, 0.22, length - 0.08, 0.07, kit.linenWhite, 0, 0.41, 0.01));
  g.add(soft(width + 0.02, 0.07, length * 0.7, 0.035, kit.linenWhite, 0, 0.55, length * 0.14));
  g.add(soft(width + 0.1, 0.035, 0.55, 0.015, kit.velvet, 0, 0.6, length / 2 - 0.36));
  for (const side of [-1, 1]) {
    const pillow = soft(0.66, 0.16, 0.42, 0.07, kit.linenWhite, side * 0.36, 0.62, -(length / 2 - 0.3));
    pillow.rotation.x = -0.25;
    g.add(pillow);
    const cushion = soft(0.42, 0.12, 0.3, 0.05, kit.teddy, side * 0.24, 0.62, -(length / 2 - 0.58));
    cushion.rotation.x = -0.35;
    g.add(cushion);
  }
  g.add(soft(width + 0.9, 1.15, 0.12, 0.04, kit.linen, 0, 0.6, -(length / 2 + 0.06)));
  return g;
}

/* ---- Living ------------------------------------------------------------- */

export function rug(kit: Kit, w: number, d: number) {
  const g = new Group();
  const border = box(w, 0.008, d, kit.rugBorder, 0, 0.004, 0);
  border.castShadow = false;
  const field = box(w - 0.16, 0.01, d - 0.16, kit.rug, 0, 0.007, 0);
  field.castShadow = false;
  g.add(border, field);
  return g;
}

export function arcLamp(kit: Kit) {
  const g = new Group();
  g.add(cylinder(0.17, 0.18, 0.05, kit.marble, 0, 0.025, 0));
  const curve = new QuadraticBezierCurve3(new Vector3(0, 0.05, 0), new Vector3(0, 2.4, 0.1), new Vector3(0, 1.86, 1.2));
  g.add(part(new TubeGeometry(curve, 48, 0.012, 10, false), kit.metalDark));
  const dome = part(new SphereGeometry(0.19, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), kit.brass, 0, 1.66, 1.22);
  g.add(dome);
  const inner = part(new SphereGeometry(0.185, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), kit.shade, 0, 1.66, 1.22);
  inner.material = kit.shade;
  (inner.material as MeshStandardMaterial).side = DoubleSide;
  inner.castShadow = false;
  g.add(inner);
  return { group: g, light: new Vector3(0, 1.55, 1.22) };
}

export function television(kit: Kit) {
  const g = new Group();
  g.add(box(1.64, 0.94, 0.035, kit.screen, 0, 0, 0));
  return g;
}

export function roundMirror(kit: Kit, radius = 0.42) {
  const g = new Group();
  g.add(part(new TorusGeometry(radius, 0.022, 14, 64), kit.brass));
  const glass = part(new CircleGeometry(radius - 0.01, 64), kit.mirror, 0, 0, 0.004);
  glass.castShadow = false;
  g.add(glass);
  return g;
}

/* ---- Architecture ------------------------------------------------------- */

/**
 * A wall as it is built: solid runs between openings, a lintel over every
 * opening, an upstand under every window, bronze window frames with glass,
 * and door leaves standing open. Built in the wall's own space (x along it,
 * z across it) and turned into place.
 */
export function wall(kit: Kit, spec: Wall, height: number) {
  const [ax, az] = spec.a;
  const [bx, bz] = spec.b;
  const length = Math.hypot(bx - ax, bz - az);
  const t = spec.thickness;
  const g = new Group();
  g.position.set(ax, 0, az);
  g.rotation.y = -Math.atan2(bz - az, bx - ax);

  const openings = [...(spec.openings ?? [])].sort((p, q) => p.at - q.at);
  let cursor = 0;
  const run = (from: number, to: number) => {
    if (to - from > 0.001) g.add(box(to - from, height, t, kit.plaster, (from + to) / 2, height / 2, 0));
  };

  for (const o of openings) {
    const start = o.at - o.width / 2;
    const end = o.at + o.width / 2;
    run(cursor, start);
    cursor = end;

    if (o.sill > 0) g.add(box(o.width, o.sill, t, kit.plaster, o.at, o.sill / 2, 0));
    if (o.head < height) g.add(box(o.width, height - o.head, t, kit.plaster, o.at, (o.head + height) / 2, 0));

    if (o.kind === "window") {
      const h = o.head - o.sill;
      const bar = 0.045;
      g.add(box(o.width, bar, 0.07, kit.metalDark, o.at, o.sill + bar / 2, 0));
      g.add(box(o.width, bar, 0.07, kit.metalDark, o.at, o.head - bar / 2, 0));
      g.add(box(bar, h, 0.07, kit.metalDark, start + bar / 2, o.sill + h / 2, 0));
      g.add(box(bar, h, 0.07, kit.metalDark, end - bar / 2, o.sill + h / 2, 0));
      if (o.width > 1.4) g.add(box(0.03, h, 0.06, kit.metalDark, o.at, o.sill + h / 2, 0));
      const pane = box(o.width - bar * 2, h - bar * 2, 0.012, kit.glass, o.at, o.sill + h / 2, 0);
      pane.castShadow = false;
      g.add(pane);
    } else {
      const hinge = new Group();
      hinge.position.set(start + 0.02, 0, (o.swing ?? 1) * (t / 2));
      hinge.rotation.y = -(o.swing ?? 1) * 1.15;
      hinge.add(box(o.width - 0.04, o.head - 0.02, 0.04, kit.walnut, (o.width - 0.04) / 2, (o.head - 0.02) / 2, 0));
      g.add(hinge);
    }
  }
  run(cursor, length);
  return g;
}
