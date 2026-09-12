"use client";

import { useEffect, useRef, type RefObject } from "react";

/** A numbered image sequence in /public: `${base}/f-000.webp` … */
export interface FrameSet {
  base: string;
  count: number;
  width: number;
  height: number;
}

export interface FrameSequence {
  /** Show the film at a progress value between 0 and 1. */
  seek: (progress: number) => void;
}

const pad = (i: number) => String(i).padStart(3, "0");

/** Frames downloaded at once, per film. */
const FETCHES = 6;
/** Most decoded frames one film keeps. */
const MAX_CACHE = 64;
/** Frames decoded ahead along the direction of travel while scrolling. */
const LOOKAHEAD = 4;
/** Frames decoded on either side while the film is at rest, so a slow scrub starts at once. */
const NEIGHBOURS = 3;
/** Below this speed (frames per display frame) neighbouring frames cross-fade… */
const BLEND_SPEED = 0.75;
/** …through the middle of the gap between them only, so a still film is one sharp frame. */
const BLEND_FROM = 0.3;
const BLEND_TO = 0.7;

interface DecodeSource {
  priority: () => number;
  take: () => (() => Promise<void>) | null;
}

/**
 * One small decoder shared by every film on the page. A few frames decode at
 * a time and the film on screen goes first, so films never compete with each
 * other — or with the page — for the processor.
 */
const decoder = {
  sources: new Set<DecodeSource>(),
  active: 0,
  limit: 0,
  pump() {
    this.limit ||= Math.max(2, Math.min(3, Math.floor((navigator.hardwareConcurrency || 4) / 4)));
    while (this.active < this.limit) {
      let job: (() => Promise<void>) | null = null;
      for (const source of [...this.sources].sort((a, b) => b.priority() - a.priority())) {
        job = source.take();
        if (job) {
          // Round-robin between films of equal priority.
          this.sources.delete(source);
          this.sources.add(source);
          break;
        }
      }
      if (!job) return;
      this.active += 1;
      void job().finally(() => {
        this.active -= 1;
        this.pump();
      });
    }
  },
};

const idle = (task: (deadline?: IdleDeadline) => void) => {
  if (typeof requestIdleCallback === "function") requestIdleCallback(task, { timeout: 400 });
  else setTimeout(task, 50);
};

/** Free decoded frames a couple at a time when the browser has nothing better to do. */
function closeLater(bitmaps: ImageBitmap[]) {
  if (!bitmaps.length) return;
  idle((deadline) => {
    let closed = 0;
    while (bitmaps.length && (closed++ < 2 || (deadline?.timeRemaining() ?? 0) > 1)) bitmaps.pop()?.close();
    closeLater(bitmaps);
  });
}

/**
 * Coarse to fine: the first and last frames, then every 32nd, 16th, 8th, 4th,
 * 2nd and finally the rest, so the whole film is roughly there early.
 */
function fetchOrder(count: number, stride: number) {
  const order = [0, count - 1];
  const seen = new Set(order);
  for (const step of [32, 16, 8, 4, 2, 1]) {
    if (step < stride) break;
    for (let i = 0; i < count; i += step) {
      if (!seen.has(i)) {
        seen.add(i);
        order.push(i);
      }
    }
  }
  return order;
}

/** Decoded pixels one film may hold at a time. */
function memoryBudget() {
  const { deviceMemory } = navigator as Navigator & { deviceMemory?: number };
  const small = (deviceMemory ?? 8) <= 4 || window.matchMedia("(pointer: coarse)").matches;
  return (small ? 64 : 192) * 1024 * 1024;
}

/** Every frame, or every other one when the visitor saves data or the connection is slow. */
function frameStride() {
  const { connection } = navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } };
  return connection?.saveData || /2g|3g/.test(connection?.effectiveType ?? "") ? 2 : 1;
}

/**
 * Draws a frame sequence onto a canvas, driven by an external progress value.
 *
 * Built so that playing it costs the page as little as possible:
 * - frames are downloaded once and kept as compressed bytes;
 * - they are decoded off the main thread (createImageBitmap) by a decoder shared
 *   with the other films, and only the frames about to be shown: the current
 *   one and a few ahead along the direction of travel;
 * - decoded frames live in a small cache, least recently shown freed first,
 *   during idle time;
 * - `seek` paints straight away, inside the same animation frame as the scroll
 *   update that called it, and only when the picture changes;
 * - the canvas is no larger than the frames can fill.
 *
 * While an exact frame is still on its way the nearest decoded one is shown. A
 * portrait set is swapped in when the canvas is taller than it is wide. The
 * page's scroll is never touched: whatever calls `seek` decides progress.
 */
export function useFrameSequence(
  canvasRef: RefObject<HTMLCanvasElement | null>,
  {
    landscape,
    portrait,
    fit = "cover",
  }: { landscape: FrameSet; portrait?: FrameSet; fit?: "cover" | "contain" },
): RefObject<FrameSequence | null> {
  const api = useRef<FrameSequence | null>(null);
  const landscapeKey = `${landscape.base}:${landscape.count}`;
  const portraitKey = portrait ? `${portrait.base}:${portrait.count}` : "";

  useEffect(() => {
    const canvas = canvasRef.current;
    // Opaque when the frames cover it, so the browser composites a solid layer.
    const ctx = canvas?.getContext("2d", { alpha: fit !== "cover" });
    if (!canvas || !ctx) return;

    const budget = memoryBudget();
    const stride = frameStride();

    let disposed = false;
    let near = false;
    let onScreen = false;
    let set: FrameSet = landscape;

    // Where the film is, and how fast it is moving, in frames per display frame.
    let progress = 0;
    let lastPosition = 0;
    let lastSeek = 0;
    let speed = 0;

    // Downloaded bytes, per set.
    let generation = 0;
    let blobs: (Blob | null)[] = new Array(set.count).fill(null);
    let fetching = new Set<number>();
    let failed = new Set<number>();
    let order = fetchOrder(set.count, stride);
    let cursor = 0;

    // Decoded frames.
    let epoch = 0;
    let bitmaps: (ImageBitmap | null)[] = new Array(set.count).fill(null);
    let usedAt = new Float64Array(set.count);
    let decoding = new Set<number>();
    let decoded = 0;
    let keep = 16;
    let evicting = false;

    let painted = "";
    let shown = false;
    let raf = 0;

    const show = (on: boolean) => {
      if (on === shown) return;
      shown = on;
      canvas.style.visibility = on ? "" : "hidden";
    };
    // Until a frame is painted the canvas stays out of sight and the poster shows.
    canvas.style.visibility = "hidden";

    const position = () => progress * (set.count - 1);
    const velocity = () => (performance.now() - lastSeek < 120 ? speed : 0);
    const snap = (i: number) => Math.max(0, Math.min(set.count - 1, Math.round(i / stride) * stride));

    /** The frames worth having decoded, most urgent first. */
    const wanted = () => {
      const list: number[] = [];
      const add = (i: number) => {
        const index = snap(i);
        if (!list.includes(index)) list.push(index);
      };
      const p = position();
      const v = velocity();
      if (Math.abs(v) < BLEND_SPEED) {
        const a = Math.floor(p / stride) * stride;
        const ahead = v < 0 ? -stride : stride;
        add(a);
        add(a + stride);
        for (let d = 1; d <= NEIGHBOURS; d++) {
          add(a + ahead * (d + (ahead > 0 ? 1 : 0)));
          add(a - ahead * (d + (ahead > 0 ? 0 : 1)));
        }
      } else {
        add(p);
        for (let k = 1; k <= LOOKAHEAD; k++) add(p + v * k);
      }
      return list;
    };

    const releaseAll = () => {
      epoch += 1;
      closeLater(bitmaps.filter((bitmap): bitmap is ImageBitmap => bitmap !== null));
      bitmaps = new Array(set.count).fill(null);
      usedAt = new Float64Array(set.count);
      decoding = new Set();
      decoded = 0;
      painted = "";
    };

    const reset = () => {
      generation += 1;
      releaseAll();
      blobs = new Array(set.count).fill(null);
      fetching = new Set();
      failed = new Set();
      order = fetchOrder(set.count, stride);
      cursor = 0;
      show(false);
    };

    /** Over budget: free the least recently shown frames that are not about to be needed. */
    const evict = () => {
      if (evicting || decoded <= keep) return;
      evicting = true;
      idle((deadline) => {
        evicting = false;
        if (disposed) return;
        const needed = new Set(wanted());
        let freed = 0;
        while (decoded > keep && (freed++ < 2 || (deadline?.timeRemaining() ?? 0) > 1)) {
          let victim = -1;
          for (let i = 0; i < bitmaps.length; i++) {
            if (bitmaps[i] && !needed.has(i) && (victim < 0 || usedAt[i] < usedAt[victim])) victim = i;
          }
          if (victim < 0) break;
          bitmaps[victim]?.close();
          bitmaps[victim] = null;
          decoded -= 1;
        }
        evict();
      });
    };

    const draw = (bitmap: ImageBitmap, alpha: number) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const imageRatio = set.width / set.height;
      const matchHeight = fit === "cover" ? imageRatio > cw / ch : imageRatio < cw / ch;
      const dw = matchHeight ? ch * imageRatio : cw;
      const dh = matchHeight ? ch : cw / imageRatio;
      if (fit !== "cover" && alpha === 1) ctx.clearRect(0, 0, cw, ch);
      ctx.globalAlpha = alpha;
      ctx.drawImage(bitmap, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
      ctx.globalAlpha = 1;
    };

    const nearestDecoded = (index: number) => {
      for (let d = 0; d < bitmaps.length; d++) {
        if (bitmaps[index + d]) return index + d;
        if (bitmaps[index - d]) return index - d;
      }
      return -1;
    };

    const paint = () => {
      if (disposed) return;
      const p = position();
      let a: number;
      let b: number;
      let blend = 0;
      if (Math.abs(velocity()) < BLEND_SPEED) {
        a = Math.min(set.count - 1, Math.floor(p / stride) * stride);
        b = Math.min(set.count - 1, a + stride);
        const t = b > a ? ((p - a) / (b - a) - BLEND_FROM) / (BLEND_TO - BLEND_FROM) : 0;
        // Eased, and quantised so slow scrolling does not repaint for invisible changes.
        blend = t <= 0 ? 0 : t >= 1 ? 1 : Math.round(t * t * (3 - 2 * t) * 24) / 24;
      } else {
        a = b = snap(p);
      }

      let first = blend < 1 ? bitmaps[a] : null;
      let second = blend > 0 ? bitmaps[b] : null;
      let key = `${a}:${b}:${blend}`;
      if ((blend < 1 && !first) || (blend > 0 && !second)) {
        const index = nearestDecoded(Math.round(p));
        if (index < 0) {
          if (!painted) show(false);
          return;
        }
        first = bitmaps[index];
        second = null;
        key = `near:${index}`;
        usedAt[index] = performance.now();
      } else {
        if (first) usedAt[a] = performance.now();
        if (second) usedAt[b] = performance.now();
      }
      if (key === painted) return;
      painted = key;
      if (first) draw(first, 1);
      if (second) draw(second, first ? blend : 1);
      show(true);
    };

    const schedulePaint = () => {
      if (!raf && !disposed) {
        raf = requestAnimationFrame(() => {
          raf = 0;
          paint();
        });
      }
    };

    const source: DecodeSource = {
      priority: () => (!near ? -1 : onScreen ? 2 : 1),
      take: () => {
        if (disposed || !near) return null;
        for (const index of wanted()) {
          const blob = blobs[index];
          if (!blob || bitmaps[index] || decoding.has(index) || failed.has(index)) continue;
          decoding.add(index);
          const run = epoch;
          return async () => {
            let bitmap: ImageBitmap | null = null;
            try {
              bitmap = await createImageBitmap(blob);
            } catch {
              if (run === epoch) failed.add(index);
            }
            if (disposed || run !== epoch) {
              if (bitmap) closeLater([bitmap]);
              return;
            }
            decoding.delete(index);
            if (!bitmap) return;
            bitmaps[index] = bitmap;
            usedAt[index] = performance.now();
            decoded += 1;
            schedulePaint();
            evict();
          };
        }
        return null;
      },
    };
    decoder.sources.add(source);

    const load = async (index: number, run: number) => {
      fetching.add(index);
      try {
        const response = await fetch(`${set.base}/f-${pad(index)}.webp`);
        if (!response.ok) throw new Error(String(response.status));
        const blob = await response.blob();
        if (run === generation) blobs[index] = blob;
      } catch {
        if (run === generation) failed.add(index);
      }
      if (run !== generation || disposed) return;
      fetching.delete(index);
      download();
      decoder.pump();
    };

    /** Download what is about to be shown first, then the rest of the film, coarse to fine. */
    const download = () => {
      if (disposed || !near) return;
      const p = Math.round(position());
      const ahead = velocity() < 0 ? -1 : 1;
      const candidates = wanted();
      for (let d = 1; d <= 16; d++) candidates.push(snap(p + ahead * d * stride), snap(p - ahead * d * stride));
      for (const i of candidates) {
        if (fetching.size >= FETCHES) return;
        if (!blobs[i] && !fetching.has(i) && !failed.has(i)) void load(i, generation);
      }
      while (fetching.size < FETCHES && cursor < order.length) {
        const i = order[cursor++];
        if (!blobs[i] && !fetching.has(i) && !failed.has(i)) void load(i, generation);
      }
    };

    const size = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const next = portrait && rect.height > rect.width * 1.1 ? portrait : landscape;
      if (next !== set) {
        set = next;
        reset();
      }
      keep = Math.max(8, Math.min(MAX_CACHE, set.count, Math.floor(budget / (set.width * set.height * 4))));

      // Give the canvas no more pixels than the frames can fill.
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const scale =
        fit === "cover"
          ? Math.max(rect.width / set.width, rect.height / set.height)
          : Math.min(rect.width / set.width, rect.height / set.height);
      const density = Math.min(dpr, 1 / scale);
      const cw = Math.max(1, Math.round(rect.width * density));
      const ch = Math.max(1, Math.round(rect.height * density));
      if (canvas.width !== cw || canvas.height !== ch) {
        canvas.width = cw;
        canvas.height = ch;
        ctx.imageSmoothingQuality = "high";
        painted = "";
      }

      paint();
      download();
      decoder.pump();
    };

    size();

    const resizeObserver = new ResizeObserver(size);
    resizeObserver.observe(canvas);

    // Near the screen: download and decode. Far away: hand the decoded pixels back, keep the bytes.
    const nearObserver = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting;
        if (near) {
          download();
          decoder.pump();
          paint();
        } else {
          releaseAll();
        }
      },
      { rootMargin: "150% 0px" },
    );
    nearObserver.observe(canvas);

    // On screen: decode before any film that is only nearby.
    const screenObserver = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      decoder.pump();
    });
    screenObserver.observe(canvas);

    api.current = {
      seek: (value) => {
        const next = Math.min(1, Math.max(0, value));
        const now = performance.now();
        const p = next * (set.count - 1);
        const elapsed = now - lastSeek;
        // Smoothed; a pause starts it again from rest.
        speed = elapsed > 0 && elapsed < 120 ? speed * 0.5 + ((p - lastPosition) / elapsed) * (1000 / 60) * 0.5 : 0;
        lastSeek = now;
        lastPosition = p;
        progress = next;
        paint();
        download();
        decoder.pump();
      },
    };

    return () => {
      disposed = true;
      api.current = null;
      decoder.sources.delete(source);
      resizeObserver.disconnect();
      nearObserver.disconnect();
      screenObserver.disconnect();
      cancelAnimationFrame(raf);
      releaseAll();
      blobs = [];
      canvas.style.visibility = "";
    };
    // The sets are compared by their keys; the objects themselves are props.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvasRef, landscapeKey, portraitKey, fit]);

  return api;
}
