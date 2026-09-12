import {
  BufferAttribute,
  Color,
  MeshStandardMaterial,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type BufferGeometry,
  type Material,
  type Texture,
  type TextureLoader,
} from "three";

/**
 * The three looks the model moves through — clay, drawing, finished — are not
 * three sets of materials. Every material in the scene shares two uniforms:
 *
 * - uClay  mixes the surface toward a matte white, as in a massing model.
 * - uDark  mixes the lit result toward the drawing's background, so the model
 *          disappears and only the plan lines drawn over it remain.
 *
 * Injected once per material with onBeforeCompile, so imported models get the
 * same behaviour as the procedural furniture without any per-object work.
 */
export interface Look {
  clay: { value: number };
  dark: { value: number };
  clayColor: { value: Color };
  darkColor: { value: Color };
}

export function createLook(): Look {
  return {
    clay: { value: 1 },
    dark: { value: 0 },
    clayColor: { value: new Color("#efebe4") },
    darkColor: { value: new Color("#0b0d0f") },
  };
}

export function applyLook(material: Material, look: Look) {
  const standard = material as MeshStandardMaterial;
  if (!standard.isMeshStandardMaterial || standard.userData.iconicLook) return;
  standard.userData.iconicLook = true;

  standard.onBeforeCompile = (shader) => {
    shader.uniforms.uClay = look.clay;
    shader.uniforms.uDark = look.dark;
    shader.uniforms.uClayColor = look.clayColor;
    shader.uniforms.uDarkColor = look.darkColor;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nuniform float uClay;\nuniform float uDark;\nuniform vec3 uClayColor;\nuniform vec3 uDarkColor;",
      )
      .replace(
        "#include <color_fragment>",
        "#include <color_fragment>\n\tdiffuseColor.rgb = mix( diffuseColor.rgb, uClayColor, uClay );",
      )
      .replace(
        "#include <roughnessmap_fragment>",
        "#include <roughnessmap_fragment>\n\troughnessFactor = mix( roughnessFactor, 0.9, uClay );",
      )
      .replace(
        "#include <metalnessmap_fragment>",
        "#include <metalnessmap_fragment>\n\tmetalnessFactor = mix( metalnessFactor, 0.0, uClay );",
      )
      .replace(
        "#include <opaque_fragment>",
        "outgoingLight = mix( outgoingLight, uDarkColor, uDark );\n\t#include <opaque_fragment>",
      );
  };
  standard.customProgramCacheKey = () => "iconic-look-v1";
  standard.needsUpdate = true;
}

/**
 * Box-projected UVs from vertex positions, in metres ÷ tile size. A texture
 * then keeps its real-world scale on a sofa cushion and on a floor alike,
 * and every material can share one texture with repeat 1.
 */
export function worldUV(geometry: BufferGeometry, tile: number) {
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  if (!position || !normal) return geometry;
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const nz = Math.abs(normal.getZ(i));
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    let u: number;
    let v: number;
    if (ny >= nx && ny >= nz) {
      u = x;
      v = z;
    } else if (nx >= nz) {
      u = z;
      v = y;
    } else {
      u = x;
      v = y;
    }
    uv[i * 2] = u / tile;
    uv[i * 2 + 1] = v / tile;
  }
  geometry.setAttribute("uv", new BufferAttribute(uv, 2));
  return geometry;
}

export interface PBRSet {
  map: Texture;
  normalMap: Texture;
  arm: Texture;
}

/** Poly Haven texture set: diffuse, OpenGL normal, and AO/roughness/metal packed. */
export async function loadSet(loader: TextureLoader, name: string, anisotropy: number): Promise<PBRSet> {
  const url = (suffix: string) => `/house/textures/${name}_${suffix}.webp`;
  const [map, normalMap, arm] = await Promise.all([
    loader.loadAsync(url("diff")),
    loader.loadAsync(url("nor")),
    loader.loadAsync(url("arm")),
  ]);
  map.colorSpace = SRGBColorSpace;
  for (const texture of [map, normalMap, arm]) {
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.anisotropy = anisotropy;
  }
  return { map, normalMap, arm };
}

export function pbr(
  set: PBRSet,
  tile: number,
  params: { color?: string; roughness?: number; metalness?: number; normalScale?: number; withMap?: boolean } = {},
) {
  const material = new MeshStandardMaterial({
    map: params.withMap === false ? null : set.map,
    normalMap: set.normalMap,
    normalScale: new Vector2(params.normalScale ?? 1, params.normalScale ?? 1),
    roughnessMap: set.arm,
    metalnessMap: set.arm,
    aoMap: set.arm,
    color: params.color ?? "#ffffff",
    roughness: params.roughness ?? 1,
    metalness: params.metalness ?? 0,
  });
  material.userData.tile = tile;
  return material;
}
