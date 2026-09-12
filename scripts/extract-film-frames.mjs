/**
 * Turn a video into a silent, scroll-scrubbable WebP frame sequence.
 *
 * Microsoft Edge (through Playwright) decodes the video, so ffmpeg is not
 * needed. The output has no audio by construction.
 *
 *   node scripts/extract-film-frames.mjs <video> <out-dir> [options]
 *
 *   --fps 60         the video's frame rate: sample exact source frames, evenly
 *                    stepped (recommended — no doubled or skipped frames)
 *   --every 2        with --fps, keep every 2nd source frame (default 1)
 *   --count 120      frames to extract (default: all that --fps/--every give,
 *                    or 120 without --fps)
 *   --width 1600     output width (height follows the video's aspect ratio)
 *   --start 0        first second to use
 *   --end 5.15       last second to use (e.g. to cut an end caption)
 *   --crop t,r,b,l   source pixels to trim first (e.g. a black border)
 *   --portrait 720   also write a centre-cropped 9:16 set at this width to <out-dir>/portrait
 *   --quality 0.72   WebP quality, 0–1
 *
 * Writes <out-dir>/f-000.webp …, poster.webp (the last frame) and manifest.json.
 * Point FilmScroll or BuildDuo at <out-dir> with the same count and size.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const [videoArg, outArg, ...rest] = process.argv.slice(2);
if (!videoArg || !outArg) {
  console.error("usage: node scripts/extract-film-frames.mjs <video> <out-dir> [--fps 30] [--width 1600] [--end 5.15]");
  process.exit(1);
}

const text = (name) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const option = (name, fallback) => (text(name) === undefined ? fallback : Number(text(name)));

const fps = option("fps", 0);
const every = Math.max(1, option("every", 1));
const countOption = option("count", NaN);
const width = option("width", 1600);
const start = option("start", 0);
const endOption = option("end", NaN);
const portraitWidth = option("portrait", 0);
const quality = option("quality", 0.72);
const [cropTop, cropRight, cropBottom, cropLeft] = (text("crop") ?? "0,0,0,0").split(",").map(Number);

const video = path.resolve(videoArg);
const out = path.resolve(outArg);
fs.mkdirSync(out, { recursive: true });
if (portraitWidth) fs.mkdirSync(path.join(out, "portrait"), { recursive: true });

// A throwaway page next to the video, so Edge may read it from disk.
const page = path.join(path.dirname(video), `.extract-${Date.now()}.html`);
fs.writeFileSync(
  page,
  `<!doctype html><video id="v" src="${path.basename(video)}" muted playsinline preload="auto"></video><canvas id="a"></canvas><canvas id="b"></canvas>`,
);

const browser = await chromium.launch({ channel: "msedge", args: ["--allow-file-access-from-files"] });

try {
  const tab = await browser.newPage();
  await tab.goto(pathToFileURL(page).href);

  const info = await tab.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const v = document.getElementById("v");
        const done = () => resolve({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
        if (v.readyState >= 2) done();
        else v.addEventListener("loadeddata", done, { once: true });
        v.addEventListener("error", () => reject(new Error("Edge could not decode the video")), { once: true });
      }),
  );

  const end = Math.min(Number.isFinite(endOption) ? endOption : info.duration, info.duration) - 0.05;
  const crop = {
    x: cropLeft,
    y: cropTop,
    w: info.width - cropLeft - cropRight,
    h: info.height - cropTop - cropBottom,
  };
  const height = Math.round((width * crop.h) / crop.w);

  // Sample times: the middle of exact source frames when the frame rate is
  // known, so every output frame is a distinct, evenly spaced source frame.
  let times;
  if (fps) {
    const available = Math.floor((end - start) * fps);
    const count = Number.isFinite(countOption) ? countOption : Math.ceil(available / every);
    times = Array.from({ length: count }, (_, i) => {
      const frame = count > 1 ? Math.round((i * (available - 1)) / (count - 1)) : 0;
      return start + (frame + 0.5) / fps;
    });
  } else {
    const count = Number.isFinite(countOption) ? countOption : 120;
    times = Array.from({ length: count }, (_, i) => start + 0.001 + (i / Math.max(1, count - 1)) * (end - start - 0.001));
  }

  const grab = (time) =>
    tab.evaluate(
      ({ time, width, height, portraitWidth, quality, crop }) =>
        new Promise((resolve) => {
          const v = document.getElementById("v");
          v.addEventListener(
            "seeked",
            () => {
              const a = document.getElementById("a");
              a.width = width;
              a.height = height;
              const actx = a.getContext("2d");
              // Downscale with the good filter, or fine detail shimmers from frame to frame.
              actx.imageSmoothingQuality = "high";
              actx.drawImage(v, crop.x, crop.y, crop.w, crop.h, 0, 0, width, height);
              const result = { frame: a.toDataURL("image/webp", quality) };
              if (portraitWidth) {
                const b = document.getElementById("b");
                const sw = Math.round((crop.h * 9) / 16);
                b.width = portraitWidth;
                b.height = Math.round((portraitWidth * 16) / 9);
                const bctx = b.getContext("2d");
                bctx.imageSmoothingQuality = "high";
                bctx.drawImage(v, crop.x + Math.round((crop.w - sw) / 2), crop.y, sw, crop.h, 0, 0, b.width, b.height);
                result.portrait = b.toDataURL("image/webp", quality);
              }
              resolve(result);
            },
            { once: true },
          );
          v.currentTime = time;
        }),
      { time, width, height, portraitWidth, quality, crop },
    );

  const write = (file, dataUrl) => fs.writeFileSync(file, Buffer.from(dataUrl.split(",")[1], "base64"));
  let bytes = 0;
  let portraitBytes = 0;

  for (let i = 0; i < times.length; i++) {
    const { frame, portrait } = await grab(times[i]);
    const name = `f-${String(i).padStart(3, "0")}.webp`;
    write(path.join(out, name), frame);
    bytes += fs.statSync(path.join(out, name)).size;
    if (portrait) {
      write(path.join(out, "portrait", name), portrait);
      portraitBytes += fs.statSync(path.join(out, "portrait", name)).size;
    }
  }

  const { frame: poster } = await grab(times[times.length - 1]);
  write(path.join(out, "poster.webp"), poster);

  fs.writeFileSync(
    path.join(out, "manifest.json"),
    JSON.stringify(
      {
        count: times.length,
        width,
        height,
        start,
        end,
        fps: fps || undefined,
        every: fps ? every : undefined,
        crop: text("crop"),
        portrait: portraitWidth ? { width: portraitWidth, height: Math.round((portraitWidth * 16) / 9) } : undefined,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${times.length} frames ${width}×${height}, ${(bytes / 1e6).toFixed(1)} MB` +
      (portraitWidth ? ` (+ portrait ${(portraitBytes / 1e6).toFixed(1)} MB)` : "") +
      ` → ${path.relative(process.cwd(), out)}`,
  );
} finally {
  await browser.close();
  fs.rmSync(page, { force: true });
}
