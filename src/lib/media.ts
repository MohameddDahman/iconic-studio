import manifest from "./media-manifest.json";
import type { Media, MediaVariant } from "./types";

type ManifestEntry = { src: string; width: number; height: number; blurDataURL: string };
const MANIFEST = manifest as Record<string, ManifestEntry>;

const keyFor = (file: string) => (file.startsWith("/media/") ? file : `/media/${file}`);

function lookup(file: string): MediaVariant {
  const key = keyFor(file);
  const entry = MANIFEST[key];
  if (!entry) {
    // Missing files should be loud in development, not silently 0×0.
    if (process.env.NODE_ENV !== "production") {
      console.warn(`[media] ${key} is not in media-manifest.json — run scripts/build-media-manifest.mjs`);
    }
    return { src: key, width: 1600, height: 1067 };
  }
  return { src: entry.src, width: entry.width, height: entry.height, blurDataURL: entry.blurDataURL };
}

/**
 * Resolve a bundled image to a full <Image> payload. Dimensions come from the
 * generated manifest so nothing on the page reserves the wrong amount of space.
 *
 * Pass `night` with the after-dark render of the same frame and the image gets
 * a lamp switch wherever it is shown.
 */
export function img(file: string, alt: string, caption?: string, options: { night?: string } = {}): Media {
  const media: Media = { ...lookup(file), alt, caption };
  if (options.night) media.night = lookup(options.night);
  return media;
}

/** Convex-hosted uploads carry their own dimensions on the document. */
export function remoteMedia(
  url: string,
  alt: string,
  width: number,
  height: number,
  opts: { blurDataURL?: string; caption?: string } = {},
): Media {
  return { src: url, alt, width, height, ...opts };
}

export const aspect = (m: Media) => m.width / m.height;
