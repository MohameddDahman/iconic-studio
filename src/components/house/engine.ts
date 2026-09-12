import {
  AgXToneMapping,
  Box3,
  Matrix4,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  HemisphereLight,
  MathUtils,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PCFShadowMap,
  PMREMGenerator,
  PlaneGeometry,
  PointLight,
  Scene,
  ShadowMaterial,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type LineBasicMaterial,
  type Material,
  type MeshPhysicalMaterial,
  type Object3D,
  type Texture,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { N8AOPass } from "n8ao";
import { applyLook, createLook, loadSet, pbr, type PBRSet } from "./look";
import {
  arcLamp,
  bed,
  box,
  diningChair,
  diningTable,
  island,
  kitchenRun,
  nightstand,
  part,
  roundMirror,
  rug,
  shelf,
  sofa,
  stool,
  tallUnit,
  television,
  wall,
  type Kit,
} from "./furniture";
import { PlanPen } from "./blueprint";
import { DIMENSION_BREAKS, PLAN, ROOMS, WALLS } from "./plan";

/**
 * The process model.
 *
 * One apartment, three readings of it, driven entirely by a progress value:
 *
 *   0.00 – 0.30  Initial atmosphere — a white clay model, turning slowly.
 *   0.30 – 0.60  Design direction   — the camera rises to plan, the model sinks
 *                                     into the page and the drawing sets itself out.
 *   0.60 – 1.00  Material resolution — the rooms rise again in real finishes,
 *                                     and the camera settles into the living room.
 *
 * Rendering is on demand: nothing draws unless progress, the lamp or the size
 * changes, so a still page costs nothing.
 */

export interface Framing {
  /** Margins, in CSS pixels, the whole model is fitted inside. */
  top: number;
  right: number;
  bottom: number;
  left: number;
  /** Height from the canvas top the model centres on, as far as the margins allow. */
  focus: number;
}

export interface HouseEngine {
  setProgress: (progress: number) => void;
  setEvening: (on: boolean) => void;
  setFraming: (framing: Framing) => void;
  dispose: () => void;
}

const MODELS = [
  "modern_arm_chair_01",
  "mid_century_lounge_chair",
  "coffee_table_round_01",
  "modern_wooden_cabinet",
  "wooden_display_shelves_01",
  "modern_ceiling_lamp_01",
  "ceramic_vase_01",
  "ceramic_vase_02",
  "ceramic_vase_03",
  "ceramic_vase_04",
  "potted_plant_02",
  "potted_plant_04",
  "hanging_picture_frame_01",
  "standing_picture_frame_01",
  "wooden_bowl_01",
  "marble_bust_01",
  "wicker_basket_02",
  "Ottoman_01",
] as const;

type ModelName = (typeof MODELS)[number];

const TEXTURES = [
  "wool_boucle",
  "curly_teddy_natural",
  "rough_linen",
  "velour_velvet",
  "brown_leather",
  "herringbone_parquet",
  "natural_walnut_veneer",
  "grey_oak_veneer_01",
  "marble_01",
  "terrazzo_tiles",
  "beige_wall_001",
] as const;

const smooth = (a: number, b: number, x: number) => {
  const t = MathUtils.clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};
const mix = MathUtils.lerp;

async function settleAll<T>(record: Record<string, Promise<T>>) {
  const entries = await Promise.all(Object.entries(record).map(async ([key, promise]) => [key, await promise] as const));
  return Object.fromEntries(entries) as Record<string, T>;
}

/**
 * Collapse a static group into one mesh per material. A sofa built from a
 * dozen rounded boxes becomes one or two draw calls; the whole apartment goes
 * from several hundred draw calls to around a hundred.
 */
function mergeStatic(root: Object3D) {
  root.updateMatrixWorld(true);
  const toRoot = new Matrix4().copy(root.matrixWorld).invert();
  const buckets = new Map<Material, BufferGeometry[]>();
  const merged: Mesh[] = [];

  root.traverse((child) => {
    const mesh = child as Mesh;
    if (!mesh.isMesh || Array.isArray(mesh.material)) return;
    const geometry = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry.clone();
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal" && name !== "uv") geometry.deleteAttribute(name);
    }
    if (!geometry.getAttribute("uv") || !geometry.getAttribute("normal")) {
      geometry.dispose();
      return;
    }
    geometry.applyMatrix4(new Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld));
    const list = buckets.get(mesh.material) ?? [];
    list.push(geometry);
    buckets.set(mesh.material, list);
    merged.push(mesh);
  });

  for (const mesh of merged) {
    mesh.removeFromParent();
    mesh.geometry.dispose();
  }

  for (const [material, geometries] of buckets) {
    const geometry = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    root.add(mesh);
  }
}

export async function createHouse(
  canvas: HTMLCanvasElement,
  labelsRoot: HTMLElement,
  options: {
    quality: "high" | "low";
    onProgress?: (fraction: number) => void;
    /** The ground colour behind the model. The canvas itself is transparent. */
    onBackground?: (color: string) => void;
  },
): Promise<HouseEngine> {
  const high = options.quality === "high";
  const renderer = new WebGLRenderer({ canvas, antialias: !high, alpha: true, powerPreference: "high-performance" });

  try {
    return await build();
  } catch (error) {
    renderer.dispose();
    throw error;
  }

  async function build(): Promise<HouseEngine> {
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, high ? 1.25 : 1));
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.toneMapping = AgXToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = PCFShadowMap;
    // The sun never moves, so shadows only need redrawing when the model changes shape.
    renderer.shadowMap.autoUpdate = false;

    const scene = new Scene();
    const overlay = new Scene();
    const look = createLook();
    const camera = new OrthographicCamera(-10, 10, 10, -10, 1, 200);

    /* ---- Assets ---------------------------------------------------------- */

    const total = MODELS.length + TEXTURES.length + 1;
    let loaded = 0;
    const tick = () => {
      loaded += 1;
      options.onProgress?.(loaded / total);
    };

    const anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    const textureLoader = new TextureLoader();
    const gltfLoader = new GLTFLoader();
    gltfLoader.setMeshoptDecoder(MeshoptDecoder);
    const pmrem = new PMREMGenerator(renderer);

    const [environment, sets, models] = await Promise.all([
      new HDRLoader().loadAsync("/house/studio_small_09_1k.hdr").then((hdr) => {
        const env = pmrem.fromEquirectangular(hdr).texture;
        hdr.dispose();
        tick();
        return env;
      }),
      settleAll<PBRSet>(
        Object.fromEntries(
          TEXTURES.map((name) => [
            name,
            loadSet(textureLoader, name, anisotropy).then((set) => {
              tick();
              return set;
            }),
          ]),
        ),
      ),
      settleAll<Group>(
        Object.fromEntries(
          MODELS.map((name) => [
            name,
            gltfLoader.loadAsync(`/house/models/${name}.glb`).then((result) => {
              tick();
              return result.scene;
            }),
          ]),
        ),
      ),
    ]);

    /* ---- Materials ------------------------------------------------------- */

    const lit = <T extends Material>(material: T) => {
      applyLook(material, look);
      return material;
    };
    const plain = (color: string, roughness = 0.9, metalness = 0) =>
      lit(new MeshStandardMaterial({ color, roughness, metalness }));

    const kit: Kit = {
      plaster: lit(pbr(sets.beige_wall_001, 3, { color: "#f4f1eb", withMap: false, normalScale: 0.35 })),
      floor: lit(pbr(sets.herringbone_parquet, 3.4, { color: "#b2aca6" })),
      terrazzo: lit(pbr(sets.terrazzo_tiles, 2, { color: "#f3efe9" })),
      marble: lit(pbr(sets.marble_01, 1.5, { roughness: 0.45 })),
      oak: lit(pbr(sets.grey_oak_veneer_01, 1, { color: "#ddd5c9" })),
      walnut: lit(pbr(sets.natural_walnut_veneer, 1)),
      // Fabrics take their weave from the normal and roughness maps only; the
      // colour is set here, so every textile belongs to one warm palette.
      boucle: lit(pbr(sets.wool_boucle, 0.35, { color: "#e9e2d6", withMap: false, normalScale: 1.4 })),
      teddy: lit(pbr(sets.curly_teddy_natural, 0.33, { color: "#e7ddcd", withMap: false })),
      linen: lit(pbr(sets.rough_linen, 0.27, { color: "#c9bba8", withMap: false })),
      linenWhite: lit(pbr(sets.rough_linen, 0.27, { color: "#f1ece4", withMap: false })),
      velvet: lit(pbr(sets.velour_velvet, 0.28, { color: "#7a5a48", withMap: false })),
      leather: lit(pbr(sets.brown_leather, 0.4)),
      rug: lit(pbr(sets.rough_linen, 0.7, { color: "#cdbfab", withMap: false, normalScale: 1.6 })),
      rugBorder: plain("#8c7f6f", 1),
      metalDark: plain("#1f1d1b", 0.42, 0.65),
      brass: plain("#b8925c", 0.3, 1),
      glass: lit(
        new MeshStandardMaterial({ color: "#dfe8ec", roughness: 0.05, transparent: true, opacity: 0.24, depthWrite: false }),
      ),
      mirror: plain("#cfd6d9", 0.12, 0.9),
      screen: plain("#0d0d0e", 0.2, 0.35),
      shade: lit(
        new MeshStandardMaterial({ color: "#f2e8d8", roughness: 0.9, emissive: new Color("#ffc98f"), emissiveIntensity: 0 }),
      ),
      ceramic: plain("#ebe6de", 0.55),
      slab: plain("#dad4ca", 0.95),
      plinth: plain("#2b2824", 0.8),
    };

    /* ---- Building ------------------------------------------------------- */

    const architecture = new Group();
    const furniture = new Group();
    scene.add(architecture, furniture);

    const pen = new PlanPen(0.03);
    const placed: { object: Object3D; y: number; scaleY: number }[] = [];

    scene.add(box(PLAN.width + 0.4, PLAN.slab, PLAN.depth + 0.4, kit.slab, PLAN.width / 2, -PLAN.slab / 2, PLAN.depth / 2));

    const floor = part(new PlaneGeometry(PLAN.width, PLAN.depth).rotateX(-Math.PI / 2), kit.floor, PLAN.width / 2, 0.002, PLAN.depth / 2);
    floor.castShadow = false;
    scene.add(floor);

    const kitchenFloor = part(new PlaneGeometry(5.6, 4.4).rotateX(-Math.PI / 2), kit.terrazzo, 11.2, 0.004, 2.2);
    kitchenFloor.castShadow = false;
    scene.add(kitchenFloor);

    const catcherMaterial = new ShadowMaterial({ color: "#3a3026", opacity: 0.18 });
    const catcher = new Mesh(new PlaneGeometry(90, 90).rotateX(-Math.PI / 2), catcherMaterial);
    catcher.position.set(PLAN.width / 2, -PLAN.slab - 0.002, PLAN.depth / 2);
    catcher.receiveShadow = true;
    scene.add(catcher);

    for (const spec of WALLS) {
      architecture.add(wall(kit, spec, PLAN.wallHeight));
      pen.wall(spec);
    }
    mergeStatic(architecture);

    const add = (
      object: Object3D,
      x: number,
      z: number,
      rotation = 0,
      y = 0,
      outline?: { w: number; d: number; circle?: boolean },
    ) => {
      if (!object.userData.model) mergeStatic(object);
      const radians = MathUtils.degToRad(rotation);
      object.position.set(x, y, z);
      object.rotation.y = radians;
      object.traverse((child) => {
        const mesh = child as Mesh;
        if (mesh.isMesh) {
          mesh.castShadow = true;
          mesh.receiveShadow = true;
        }
      });
      furniture.add(object);
      placed.push({ object, y, scaleY: object.scale.y });
      if (outline) {
        if (outline.circle) pen.circle(x, z, outline.w / 2);
        else pen.rect(x, z, outline.w, outline.d, radians);
      }
      return object;
    };

    const used = new Set<ModelName>();
    const glow: MeshStandardMaterial[] = [kit.shade];

    const model = (
      name: ModelName,
      x: number,
      z: number,
      rotation = 0,
      opts: { y?: number; scale?: number; outline?: false | "circle" } = {},
    ) => {
      const source = models[name];
      const object = used.has(name) ? source.clone() : source;
      used.add(name);
      object.traverse((child) => {
        const mesh = child as Mesh;
        if (!mesh.isMesh) return;
        for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
          // Picture-frame glazing ships as transmissive glass, which renders as a
          // black pane without a transmission pass. A faint clear pane reads right.
          if (name !== "modern_ceiling_lamp_01" && /glass/i.test(material.name)) {
            material.transparent = true;
            material.opacity = 0.12;
            material.depthWrite = false;
            const physical = material as MeshPhysicalMaterial;
            if (physical.isMeshPhysicalMaterial) physical.transmission = 0;
          }
          applyLook(material, look);
          const standard = material as MeshStandardMaterial;
          if (name === "modern_ceiling_lamp_01" && standard.isMeshStandardMaterial && /glass/i.test(material.name) && !glow.includes(standard)) {
            standard.emissive = new Color("#ffc58c");
            standard.emissiveIntensity = 0;
            glow.push(standard);
          }
        }
      });
      object.userData.model = true;
      object.scale.setScalar(opts.scale ?? 1);
      object.rotation.set(0, 0, 0);
      object.position.set(0, 0, 0);
      object.updateMatrixWorld(true);
      const size = new Box3().setFromObject(object).getSize(new Vector3());
      return add(
        object,
        x,
        z,
        rotation,
        opts.y ?? 0,
        opts.outline === false ? undefined : { w: size.x, d: size.z, circle: opts.outline === "circle" },
      );
    };

    const warm = new Color("#ffbf80");
    const lamps: { light: PointLight; power: number }[] = [];
    const lamp = (x: number, y: number, z: number, power: number, distance = 6) => {
      const light = new PointLight(warm, 0, distance, 2);
      light.position.set(x, y, z);
      scene.add(light);
      lamps.push({ light, power });
    };

    // Living
    add(rug(kit, 3.3, 2.6), 2.65, 6.1, 0, 0, { w: 3.3, d: 2.6 });
    model("modern_wooden_cabinet", 0.37, 6.1, 90);
    add(television(kit), 0.12, 6.1, 90, 1.36);
    model("ceramic_vase_01", 0.37, 5.2, 0, { y: 0.68, outline: false });
    model("ceramic_vase_03", 0.37, 7.0, 0, { y: 0.68, outline: false });
    add(sofa(kit, 2.7, 1.0), 4.35, 6.1, -90, 0, { w: 2.7, d: 1.0 });
    model("coffee_table_round_01", 2.6, 6.1, 0, { scale: 0.78, outline: "circle" });
    model("wooden_bowl_01", 2.6, 6.1, 0, { y: 0.49 * 0.78, outline: false });
    model("mid_century_lounge_chair", 1.45, 4.3, 30);
    model("modern_arm_chair_01", 1.45, 7.9, 150);
    model("potted_plant_02", 0.55, 8.5, 0);
    model("hanging_picture_frame_01", 2.35, 3.468, 0, { y: 1.55, outline: false });
    const floorLamp = arcLamp(kit);
    add(floorLamp.group, 5.1, 7.7, -120, 0, { w: 0.36, d: 0.36, circle: true });
    floorLamp.group.updateMatrixWorld(true);
    const lampHead = floorLamp.light.clone().applyMatrix4(floorLamp.group.matrixWorld);
    lamp(lampHead.x, lampHead.y, lampHead.z, 6, 5);

    // Dining
    add(diningTable(kit, 2.4, 1.0), 10.9, 6.7, 0, 0, { w: 2.4, d: 1.0 });
    for (const dx of [-0.8, 0, 0.8]) {
      add(diningChair(kit), 10.9 + dx, 5.92, 0, 0, { w: 0.48, d: 0.48 });
      add(diningChair(kit), 10.9 + dx, 7.48, 180, 0, { w: 0.48, d: 0.48 });
    }
    model("ceramic_vase_02", 10.55, 6.7, 0, { y: 0.76, outline: false });
    model("ceramic_vase_04", 11.25, 6.62, 0, { y: 0.76, outline: false });
    model("modern_ceiling_lamp_01", 10.45, 6.7, 0, { y: PLAN.wallHeight - 1.17, outline: false });
    model("modern_ceiling_lamp_01", 11.35, 6.7, 0, { y: PLAN.wallHeight - 1.17, outline: false });
    lamp(10.9, 1.3, 6.7, 12, 6.5);

    // Kitchen
    add(tallUnit(kit, 1.3), 9.25, 0.41, 0, 0, { w: 1.3, d: 0.62 });
    add(kitchenRun(kit, 3.9), 11.85, 0.41, 0, 0, { w: 3.9, d: 0.62 });
    add(shelf(kit, 1.0), 13.3, 0.24, 0, 1.6);
    model("potted_plant_04", 13.3, 0.24, 0, { y: 1.62, outline: false });
    add(island(kit, 2.6, 1.0), 11.3, 2.9, 0, 0, { w: 2.6, d: 1.0 });
    for (const x of [10.55, 11.3, 12.05]) add(stool(kit), x, 3.72, 0, 0, { w: 0.4, d: 0.4, circle: true });
    lamp(11.3, 2.0, 2.9, 4, 4);

    // Entrance
    model("wooden_display_shelves_01", 5.36, 1.75, 0);
    model("marble_bust_01", 5.36, 1.75, 90, { y: 1.556, outline: false });
    model("standing_picture_frame_01", 5.36, 1.3, 90, { y: 1.556, outline: false });
    model("wicker_basket_02", 5.55, 2.85, 25);
    add(roundMirror(kit, 0.4), 7.8, 0.115, 0, 1.5);

    // Bedroom
    add(bed(kit, 1.8, 2.1), 2.55, 1.28, 0, 0, { w: 1.8, d: 2.1 });
    for (const x of [0.95, 4.15]) {
      const stand = nightstand(kit);
      add(stand.group, x, 0.38, 0, 0, { w: 0.5, d: 0.42 });
    }
    lamp(2.55, 0.95, 0.55, 4.5, 4.5);
    model("Ottoman_01", 2.55, 2.8, 0, { scale: 0.85 });

    /* ---- Light ----------------------------------------------------------- */

    scene.environment = environment;
    scene.environmentIntensity = 0.9;

    const sun = new DirectionalLight("#fff3e2", 2.4);
    sun.position.set(PLAN.width / 2 + 4, 17, PLAN.depth / 2 + 12);
    sun.target.position.set(PLAN.width / 2, 0, PLAN.depth / 2);
    sun.castShadow = true;
    const shadowSize = high ? 2048 : 1024;
    sun.shadow.mapSize.set(shadowSize, shadowSize);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.updateProjectionMatrix();
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.025;
    sun.shadow.radius = 4;
    scene.add(sun, sun.target);

    const hemisphere = new HemisphereLight("#fffaf1", "#b3a590", 0.45);
    scene.add(hemisphere);

    /* ---- The drawing ---------------------------------------------------- */

    const labels: { text: string; x: number; z: number; kind: "room" | "dimension"; vertical?: boolean }[] = ROOMS.map(
      (room) => ({ text: room.label, x: room.x, z: room.z, kind: "room" as const }),
    );

    pen.dimension(0, 0, PLAN.width, 0, -1.25);
    labels.push({ text: PLAN.width.toFixed(2), x: PLAN.width / 2, z: -1.55, kind: "dimension" });
    DIMENSION_BREAKS.x.slice(0, -1).forEach((x, i) => {
      const next = DIMENSION_BREAKS.x[i + 1];
      pen.dimension(x, 0, next, 0, -0.7);
      labels.push({ text: (next - x).toFixed(2), x: (x + next) / 2, z: -0.95, kind: "dimension" });
    });
    pen.dimension(0, 0, 0, PLAN.depth, 1.25);
    labels.push({ text: PLAN.depth.toFixed(2), x: -1.55, z: PLAN.depth / 2, kind: "dimension", vertical: true });
    DIMENSION_BREAKS.z.slice(0, -1).forEach((z, i) => {
      const next = DIMENSION_BREAKS.z[i + 1];
      pen.dimension(0, z, 0, next, 0.7);
      labels.push({ text: (next - z).toFixed(2), x: -0.95, z: (z + next) / 2, kind: "dimension", vertical: true });
    });

    const lineGeometry = new LineSegmentsGeometry();
    lineGeometry.setPositions(pen.positions);
    const segments = pen.count;
    const lineMaterial = new LineMaterial({
      color: 0xe6edf3,
      linewidth: 1.25,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    });
    lineMaterial.toneMapped = false;
    const lines = new LineSegments2(lineGeometry, lineMaterial);
    lines.frustumCulled = false;
    overlay.add(lines);

    const grid = new GridHelper(44, 44, "#25343f", "#17222b");
    grid.position.set(PLAN.width / 2, -PLAN.slab, PLAN.depth / 2);
    const gridMaterial = grid.material as LineBasicMaterial;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0;
    gridMaterial.depthWrite = false;
    gridMaterial.toneMapped = false;
    overlay.add(grid);

    const labelElements = labels.map((label) => {
      const el = document.createElement("span");
      el.textContent = label.text.toUpperCase();
      el.style.cssText = [
        "position:absolute",
        "left:0",
        "top:0",
        "white-space:nowrap",
        "font-family:var(--font-mono),ui-monospace,monospace",
        label.kind === "room"
          ? "font-size:1em;letter-spacing:.22em;color:rgba(236,241,245,.95)"
          : "font-size:.9em;letter-spacing:.12em;color:rgba(236,241,245,.7)",
        // Masked like CAD annotation: the ground colour hides any line running behind the text.
        "background:var(--ground,#0b0d0f)",
        "padding:.15em .45em",
        "will-change:transform",
      ].join(";");
      labelsRoot.appendChild(el);
      return { el, ...label };
    });

    /* ---- Post-processing -------------------------------------------------- */

    let composer: EffectComposer | null = null;
    let ambientOcclusion: N8AOPass | null = null;
    if (high) {
      composer = new EffectComposer(renderer);
      ambientOcclusion = new N8AOPass(scene, camera, 1, 1);
      ambientOcclusion.configuration.aoRadius = 0.8;
      ambientOcclusion.configuration.distanceFalloff = 1;
      ambientOcclusion.configuration.intensity = 2.4;
      ambientOcclusion.configuration.gammaCorrection = false;
      ambientOcclusion.setQualityMode("Low");
      ambientOcclusion.configuration.halfRes = true;
      composer.addPass(ambientOcclusion);
      composer.addPass(new OutputPass());
      composer.addPass(new SMAAPass());
    }

    /* ---- Camera --------------------------------------------------------- */

    const size = { width: 1, height: 1 };
    const framing: Framing = { top: 0, right: 0, bottom: 0, left: 0, focus: -1 };
    const target = new Vector3();
    const temp = new Vector3();
    const bounds = new Box3(
      new Vector3(-1.8, -PLAN.slab, -1.8),
      new Vector3(PLAN.width + 0.3, PLAN.wallHeight, PLAN.depth + 0.3),
    );
    const corners = Array.from(
      { length: 8 },
      (_, i) =>
        new Vector3(i & 1 ? bounds.max.x : bounds.min.x, i & 2 ? bounds.max.y : bounds.min.y, i & 4 ? bounds.max.z : bounds.min.z),
    );

    /**
     * Orthographic, so the model reads as an architectural axonometric. The whole
     * model is fitted inside the framing margins; `zoom` then pushes in around its centre.
     */
    const placeCamera = (azimuthDeg: number, elevationDeg: number, zoom: number) => {
      const azimuth = MathUtils.degToRad(azimuthDeg);
      const elevation = MathUtils.degToRad(elevationDeg);
      const distance = 60;
      camera.position.set(
        target.x + distance * Math.cos(elevation) * Math.sin(azimuth),
        target.y + distance * Math.sin(elevation),
        target.z + distance * Math.cos(elevation) * Math.cos(azimuth),
      );
      camera.up.set(0, 1, 0);
      camera.lookAt(target);
      camera.updateMatrixWorld();

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const corner of corners) {
        temp.copy(corner).applyMatrix4(camera.matrixWorldInverse);
        minX = Math.min(minX, temp.x);
        maxX = Math.max(maxX, temp.x);
        minY = Math.min(minY, temp.y);
        maxY = Math.max(maxY, temp.y);
      }
      const boxWidth = Math.max(1, size.width - framing.left - framing.right);
      const boxHeight = Math.max(1, size.height - framing.top - framing.bottom);
      const spanX = (maxX - minX) * 1.04;
      const spanY = (maxY - minY) * 1.04;
      // World units per CSS pixel with the whole model inside the margins.
      const fitted = Math.max(spanX / boxWidth, spanY / boxHeight);
      const unit = fitted / zoom;

      // Centred across the margins; vertically it follows the focus only as far as
      // the margins allow, so the model is never cut by the edge of its own area.
      const x = framing.left + boxWidth / 2;
      const half = spanY / fitted / 2;
      const highest = framing.top + half;
      const lowest = size.height - framing.bottom - half;
      const y =
        framing.focus >= 0 && highest < lowest
          ? MathUtils.clamp(framing.focus, highest, lowest)
          : framing.top + boxHeight / 2;

      const halfW = (size.width * unit) / 2;
      const halfH = (size.height * unit) / 2;
      const cx = (minX + maxX) / 2 - (x - size.width / 2) * unit;
      const cy = (minY + maxY) / 2 + (y - size.height / 2) * unit;
      camera.left = cx - halfW;
      camera.right = cx + halfW;
      camera.top = cy + halfH;
      camera.bottom = cy - halfH;
      camera.near = 1;
      camera.far = 160;
      camera.updateProjectionMatrix();
    };

    /* ---- State ---------------------------------------------------------- */

    let progress = 0;
    let evening = 0;
    let eveningTarget = 0;
    let labelsOpacity = 0;
    let lastSquash = -1;
    let degraded = false;
    let lastFrameAt = 0;
    let frameAverage = 16;
    let raf = 0;
    let disposed = false;

    const background = new Color();
    const daylight = new Color("#e8e4dc");
    const dusk = new Color("#1c1916");
    const drawing = new Color("#0b0d0f");
    // Transparent: the page paints the ground behind the model, so the canvas
    // meets the layout around it without a seam in either render path.
    renderer.setClearColor(0x000000, 0);
    let lastBackground = "";

    const update = () => {
      const p = progress;
      const toPlan = smooth(0.2, 0.42, p);
      const fromPlan = smooth(0.56, 0.8, p);
      const dark = smooth(0.24, 0.36, p) * (1 - smooth(0.58, 0.68, p));
      const drawn = smooth(0.3, 0.5, p);
      const lineAlpha = smooth(0.27, 0.34, p) * (1 - smooth(0.56, 0.63, p));
      const flatten = smooth(0.24, 0.38, p) * (1 - smooth(0.6, 0.76, p));
      const clay = 1 - smooth(0.64, 0.8, p);
      const close = smooth(0.82, 1, p);
      const night = evening * smooth(0.62, 0.8, p);

      let azimuth = mix(36, 50, smooth(0, 0.24, p));
      azimuth = mix(azimuth, 0, toPlan);
      azimuth = mix(azimuth, 34, fromPlan);
      azimuth = mix(azimuth, 28, close);
      let elevation = mix(34, 89.4, toPlan);
      elevation = mix(elevation, 32, fromPlan);
      elevation = mix(elevation, 28, close);
      target.set(mix(PLAN.width / 2, 5.6, close), mix(0.5, 0.6, close), mix(PLAN.depth / 2, 5.9, close));

      look.clay.value = clay;
      look.dark.value = dark;
      background.copy(daylight).lerp(dusk, night).lerp(drawing, dark);
      const ground = `#${background.getHexString()}`;
      if (ground !== lastBackground) {
        lastBackground = ground;
        options.onBackground?.(ground);
      }
      catcherMaterial.opacity = 0.18 * (1 - dark) * (1 - night * 0.7);

      sun.intensity = mix(2.4, 0.05, night);
      hemisphere.intensity = mix(0.45, 0.04, night);
      scene.environmentIntensity = mix(0.9, 0.1, night);
      for (const { light, power } of lamps) {
        light.intensity = night * power;
        // Switched off entirely in daylight, so the shaders are not paying for them.
        light.visible = night > 0.002;
      }
      for (const material of glow) material.emissiveIntensity = night * 2.4;

      const squash = mix(1, 0.02, flatten);
      if (Math.abs(squash - lastSquash) > 0.0005) {
        lastSquash = squash;
        renderer.shadowMap.needsUpdate = true;
      }
      architecture.scale.y = squash;
      for (const item of placed) {
        item.object.scale.y = item.scaleY * squash;
        item.object.position.y = item.y * squash;
      }

      lineMaterial.opacity = lineAlpha;
      lineGeometry.instanceCount = Math.max(0, Math.floor(segments * drawn));
      gridMaterial.opacity = dark * dark * 0.55;
      if (ambientOcclusion) ambientOcclusion.configuration.intensity = mix(2.4, 0.2, dark);

      placeCamera(azimuth, elevation, mix(1, 1.5, close));
      labelsOpacity = lineAlpha * smooth(0.4, 0.5, p);
    };

    const render = () => {
      if (composer && !degraded) composer.render();
      else renderer.render(scene, camera);

      if (lineMaterial.opacity > 0.001 || gridMaterial.opacity > 0.001) {
        renderer.autoClear = false;
        renderer.clearDepth();
        renderer.render(overlay, camera);
        renderer.autoClear = true;
      }

      labelsRoot.style.opacity = labelsOpacity.toFixed(3);
      if (labelsOpacity > 0.001) {
        for (const label of labelElements) {
          temp.set(label.x, 0.03, label.z).project(camera);
          const x = (temp.x * 0.5 + 0.5) * size.width;
          const y = (-temp.y * 0.5 + 0.5) * size.height;
          label.el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -50%)${label.vertical ? " rotate(-90deg)" : ""}`;
        }
      }
    };

    const frame = () => {
      raf = 0;
      if (disposed) return;

      // If the machine cannot hold ~30fps while the model is moving (a laptop
      // on battery, say), drop the post-processing and resolution for good.
      const now = performance.now();
      const interval = now - lastFrameAt;
      lastFrameAt = now;
      if (interval < 120) {
        frameAverage = frameAverage * 0.9 + interval * 0.1;
        if (!degraded && frameAverage > 30) {
          degraded = true;
          renderer.setPixelRatio(1);
          resize();
        }
      }
      const gap = eveningTarget - evening;
      if (Math.abs(gap) > 0.002) {
        evening += gap * 0.085;
        raf = requestAnimationFrame(frame);
      } else {
        evening = eveningTarget;
      }
      update();
      render();
    };

    const invalidate = () => {
      if (!raf && !disposed) raf = requestAnimationFrame(frame);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      size.width = Math.max(1, Math.round(rect.width));
      size.height = Math.max(1, Math.round(rect.height));
      renderer.setSize(size.width, size.height, false);
      composer?.setSize(size.width, size.height);
      lineMaterial.resolution.set(size.width, size.height);
      invalidate();
    };

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    update();
    renderer.compile(scene, camera);
    invalidate();

    return {
      setProgress: (value) => {
        progress = MathUtils.clamp(value, 0, 1);
        invalidate();
      },
      setEvening: (on) => {
        eveningTarget = on ? 1 : 0;
        invalidate();
      },
      setFraming: (next) => {
        if (
          Math.abs(next.focus - framing.focus) < 0.5 &&
          next.top === framing.top &&
          next.right === framing.right &&
          next.bottom === framing.bottom &&
          next.left === framing.left
        ) {
          return;
        }
        Object.assign(framing, next);
        invalidate();
      },
      dispose: () => {
        disposed = true;
        cancelAnimationFrame(raf);
        observer.disconnect();
        labelElements.forEach(({ el }) => el.remove());

        const materials = new Set<Material>();
        const textures = new Set<Texture>();
        scene.traverse((child) => {
          const mesh = child as Mesh;
          if (!mesh.isMesh) return;
          mesh.geometry.dispose();
          for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) materials.add(material);
        });
        materials.forEach((material) => {
          for (const value of Object.values(material)) {
            if (value && (value as Texture).isTexture) textures.add(value as Texture);
          }
          material.dispose();
        });
        textures.forEach((texture) => texture.dispose());

        lineGeometry.dispose();
        lineMaterial.dispose();
        grid.geometry.dispose();
        gridMaterial.dispose();
        environment.dispose();
        pmrem.dispose();
        ambientOcclusion?.dispose();
        composer?.dispose();
        renderer.dispose();
        renderer.forceContextLoss();
      },
    };
  }
}
