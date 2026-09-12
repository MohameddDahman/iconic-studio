/**
 * Reads every image under public/media (subfolders included), records its
 * intrinsic size and bakes a 20px LQIP so <Image> can reserve space and blur
 * up. Re-run after adding files:  node scripts/build-media-manifest.mjs
 */
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const OUT = path.join(process.cwd(), "src", "lib", "media-manifest.json");

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const abs = path.join(dir, entry.name);
      return entry.isDirectory() ? walk(abs) : [abs];
    }),
  );
  return files.flat();
}

const files = (await walk(MEDIA_DIR))
  .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
  .sort();

const manifest = {};

for (const abs of files) {
  const { width, height } = await sharp(abs).metadata();
  const lqip = await sharp(abs).resize(20, null, { fit: "inside" }).webp({ quality: 45 }).toBuffer();

  const key = "/media/" + path.relative(MEDIA_DIR, abs).split(path.sep).join("/");
  manifest[key] = {
    src: key,
    width,
    height,
    blurDataURL: `data:image/webp;base64,${lqip.toString("base64")}`,
  };
  process.stdout.write(`${key} ${width}x${height}\n`);
}

await writeFile(OUT, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nwrote ${Object.keys(manifest).length} entries -> ${path.relative(process.cwd(), OUT)}`);
