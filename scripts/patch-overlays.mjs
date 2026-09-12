/**
 * Clone out the Instagram chrome (the "1/7" carousel counter and the mute
 * button) that came along with photos recovered from screenshots.
 *
 * Both sit in the right-hand corners over what is nearly always flat wall or
 * ceiling, so a strip lifted from the same rows a little to the left drops in
 * almost invisibly at web scale. Slight blur hides the seam.
 *
 *   node scripts/patch-overlays.mjs public/media
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const dir = process.argv[2] ?? path.join(process.cwd(), "public", "media");

/** Regions as fractions of the image, [x, y, w, h]. */
const REGIONS = [
  [0.845, 0.008, 0.15, 0.075], // carousel counter / watermark, top right
  [0.845, 0.87, 0.15, 0.105], // mute button, bottom right
];

let patched = 0;

for (const file of fs.readdirSync(dir).sort()) {
  if (!/\.jpe?g$/i.test(file)) continue;
  const abs = path.join(dir, file);
  // Read to a buffer first. On Windows sharp keeps a handle on a file path
  // open, and writing back to the same path mid-pipeline fails with EBUSY.
  const input = fs.readFileSync(abs);
  const { width: W = 0, height: H = 0 } = await sharp(input).metadata();
  if (!W || !H) continue;

  const composites = [];

  for (const [fx, fy, fw, fh] of REGIONS) {
    const w = Math.max(2, Math.round(fw * W));
    const h = Math.max(2, Math.round(fh * H));
    const left = Math.round(fx * W);
    const top = Math.round(fy * H);
    if (left + w > W || top + h > H) continue;

    // Lift the cover strip from the same rows, one region-width further left.
    const srcLeft = Math.max(0, left - w - 4);

    const patch = await sharp(input)
      .extract({ left: srcLeft, top, width: w, height: h })
      .blur(3)
      .toBuffer();

    composites.push({ input: patch, left, top });
  }

  if (composites.length === 0) continue;

  const out = await sharp(input).composite(composites).jpeg({ quality: 90 }).toBuffer();
  fs.writeFileSync(abs, out);
  patched++;
  console.log(`patched ${file}`);
}

console.log(`\n${patched} files patched`);
