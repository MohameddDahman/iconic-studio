"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import { describeError } from "./ui";

export interface UploadItem {
  id: string;
  name: string;
  status: "preparing" | "uploading" | "saving" | "done" | "error";
  error?: string;
  progress: number;
}

/** The longest edge worth keeping: enough for a full-width photograph on a large screen. */
const MAX_EDGE = 1920;
const QUALITY = 0.78;
/** Anything already this small, and no wider than MAX_EDGE, is left exactly as it came. */
const KEEP_BELOW = 150_000;

const encode = (canvas: HTMLCanvasElement, type: string) =>
  new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, QUALITY));

/** WebP where the browser can write it. Safari cannot, and quietly hands back a PNG. */
async function compress(canvas: HTMLCanvasElement) {
  const webp = await encode(canvas, "image/webp");
  return webp?.type === "image/webp" ? webp : encode(canvas, "image/jpeg");
}

/**
 * Get a photograph ready for the site, in the browser. Files straight from a
 * camera or a renderer run to tens of megabytes, far more than any screen can
 * show and enough to fill the studio’s storage, so what is uploaded is a copy
 * no larger than the site needs, along with its size and a 20px blur-up.
 */
async function prepare(file: File) {
  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error("Could not be read — export it as JPEG, PNG or WebP");
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));

  let output: Blob = file;
  let width = bitmap.width;
  let height = bitmap.height;

  if (scale < 1 || file.size >= KEEP_BELOW) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const smaller = await compress(canvas);
      if (smaller && (scale < 1 || smaller.size < file.size)) {
        output = smaller;
        width = canvas.width;
        height = canvas.height;
      }
    }
  }

  const blur = document.createElement("canvas");
  blur.width = 20;
  blur.height = Math.max(1, Math.round((bitmap.height / bitmap.width) * 20));
  const blurCtx = blur.getContext("2d");
  let blurDataURL: string | undefined;
  if (blurCtx) {
    blurCtx.drawImage(bitmap, 0, 0, blur.width, blur.height);
    // Safari without webp encoding returns a png data URL; either is fine.
    blurDataURL = blur.toDataURL("image/webp", 0.5);
  }
  bitmap.close?.();

  return { output, width, height, blurDataURL };
}

/**
 * Convex uploads are a two-step handshake: ask for a signed URL, POST the file
 * straight to it, then record what landed. Preparing it in the browser means the
 * site can reserve the right space for the photograph before it loads, without
 * an image-processing step on the server.
 */
export function useMediaUpload() {
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createMany = useMutation(api.media.createMany);
  const [items, setItems] = useState<UploadItem[]>([]);

  const patch = useCallback((id: string, next: Partial<UploadItem>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...next } : i)));
  }, []);

  const upload = useCallback(
    async (files: FileList | File[], altFallback = ""): Promise<Id<"media">[]> => {
      const all = Array.from(files);
      const isImage = (f: File) => f.type.startsWith("image/");
      const tag = (f: File) => `${f.name}-${f.size}-${Math.random().toString(36).slice(2, 8)}`;
      const list = all.filter(isImage);
      const queued: UploadItem[] = list.map((f) => ({
        id: tag(f),
        name: f.name,
        status: "preparing",
        progress: 0,
      }));
      // Say so, rather than dropping a PDF or a video without a word.
      const skipped: UploadItem[] = all
        .filter((f) => !isImage(f))
        .map((f) => ({ id: tag(f), name: f.name, status: "error", error: "Not an image — skipped", progress: 0 }));
      setItems((prev) => [...queued, ...skipped, ...prev]);

      const ids: Id<"media">[] = [];
      const failed = (id: string, error: unknown) =>
        patch(id, {
          status: "error",
          // A dropped connection reaches fetch as a bare TypeError.
          error: error instanceof TypeError ? "Connection lost — try again" : describeError(error),
        });

      // Files are stored one by one, but recorded a dozen at a time: each record
      // makes every open list of the library read itself again.
      type Pending = { itemId: string; record: Parameters<typeof createMany>[0]["items"][number] };
      let pending: Pending[] = [];
      const flush = async () => {
        if (!pending.length) return;
        const batch = pending;
        pending = [];
        try {
          ids.push(...(await createMany({ items: batch.map((p) => p.record) })));
          for (const p of batch) patch(p.itemId, { status: "done", progress: 1 });
        } catch (error) {
          for (const p of batch) failed(p.itemId, error);
        }
      };

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const item = queued[i];
        try {
          const { output, width, height, blurDataURL } = await prepare(file);
          patch(item.id, { status: "uploading", progress: 0.2 });

          const url = await generateUploadUrl();
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": output.type },
            body: output,
          });
          if (!res.ok) throw new Error("Upload failed — try again");
          const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };

          patch(item.id, { status: "saving", progress: 0.8 });
          pending.push({
            itemId: item.id,
            record: {
              storageId,
              // A filename is a poor alt text, but an empty one is worse. It is
              // editable in the library, and flagged there until it is written.
              alt: altFallback || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
              width,
              height,
              blurDataURL,
              bytes: output.size,
              contentType: output.type,
            },
          });
          if (pending.length >= 12) await flush();
        } catch (error) {
          failed(item.id, error);
        }
      }
      await flush();

      // Clear the finished rows once they have been seen.
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.status !== "done"));
      }, 2500);

      return ids;
    },
    [generateUploadUrl, createMany, patch],
  );

  return { upload, items };
}
