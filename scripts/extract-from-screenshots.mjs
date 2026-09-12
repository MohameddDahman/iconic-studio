/**
 * Pull the photograph out of an Instagram screenshot.
 *
 * The app chrome is near-black with sparse text, so its rows have very low
 * horizontal variance. A photograph's rows do not. Find the longest run of
 * high-variance rows and crop it full width.
 */
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const [, , inDir, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });

const MIN_RUN = 380; // a real photo band, not a row of text

for (const file of fs.readdirSync(inDir).sort()) {
  if (!/\.jpe?g$/i.test(file)) continue;
  const abs = path.join(inDir, file);
  const meta = await sharp(abs).metadata();
  const W = meta.width, H = meta.height;

  // Downscale for the scan so this stays fast.
  const scanW = 180;
  const scale = scanW / W;
  const scanH = Math.round(H * scale);
  const { data } = await sharp(abs)
    .resize(scanW, scanH)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rowScore = new Array(scanH).fill(0);
  for (let y = 0; y < scanH; y++) {
    let sum = 0, sum2 = 0;
    for (let x = 0; x < scanW; x++) {
      const v = data[y * scanW + x];
      sum += v; sum2 += v * v;
    }
    const mean = sum / scanW;
    rowScore[y] = Math.sqrt(Math.max(0, sum2 / scanW - mean * mean));
  }

  const THRESH = 16;
  let best = { start: 0, len: 0 };
  let run = 0;
  for (let y = 0; y < scanH; y++) {
    if (rowScore[y] > THRESH) {
      run++;
      if (run > best.len) best = { start: y - run + 1, len: run };
    } else {
      run = 0;
    }
  }

  const top = Math.round(best.start / scale);
  const height = Math.round(best.len / scale);

  if (height < MIN_RUN) {
    console.log(`${file}  SKIP (band ${height}px)`);
    continue;
  }

  const out = path.join(outDir, file.replace(/\.jpe?g$/i, ".jpg"));
  await sharp(abs)
    .extract({ left: 0, top, width: W, height: Math.min(height, H - top) })
    .jpeg({ quality: 92 })
    .toFile(out);
  console.log(`${file}  -> ${W}x${height} @ y=${top}`);
}
