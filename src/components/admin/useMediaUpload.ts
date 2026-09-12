"use client";

import { useCallback, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

export interface UploadItem {
  id: string;
  name: string;
  status: "measuring" | "uploading" | "saving" | "done" | "error";
  error?: string;
  progress: number;
}

/** Read the real pixel size, and bake a 20px blur-up in the browser. */
async function inspect(file: File) {
  const bitmap = await createImageBitmap(file);
  const { width, height } = bitmap;

  const w = 20;
  const h = Math.max(1, Math.round((height / width) * w));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");

  let blurDataURL: string | undefined;
  if (ctx) {
    ctx.drawImage(bitmap, 0, 0, w, h);
    blurDataURL = canvas.toDataURL("image/webp", 0.5);
    // Safari without webp encoding returns a png data URL; either is fine.
  }
  bitmap.close?.();

  return { width, height, blurDataURL };
}

/**
 * Convex uploads are a two-step handshake: ask for a signed URL, POST the file
 * straight to it, then record what landed. Measuring in the browser means the
 * site can reserve the right space for the photograph before it loads, without
 * an image-processing step on the server.
 */
export function useMediaUpload() {
  const generateUploadUrl = useMutation(api.media.generateUploadUrl);
  const createMedia = useMutation(api.media.create);
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
        status: "measuring",
        progress: 0,
      }));
      // Say so, rather than dropping a PDF or a video without a word.
      const skipped: UploadItem[] = all
        .filter((f) => !isImage(f))
        .map((f) => ({ id: tag(f), name: f.name, status: "error", error: "Not an image — skipped", progress: 0 }));
      setItems((prev) => [...queued, ...skipped, ...prev]);

      const ids: Id<"media">[] = [];

      for (let i = 0; i < list.length; i++) {
        const file = list[i];
        const item = queued[i];
        try {
          const { width, height, blurDataURL } = await inspect(file);
          patch(item.id, { status: "uploading", progress: 0.2 });

          const url = await generateUploadUrl();
          const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": file.type },
            body: file,
          });
          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
          const { storageId } = (await res.json()) as { storageId: Id<"_storage"> };

          patch(item.id, { status: "saving", progress: 0.8 });

          const id = await createMedia({
            storageId,
            // A filename is a poor alt text, but an empty one is worse. It is
            // editable in the library, and flagged there until it is written.
            alt: altFallback || file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "),
            width,
            height,
            blurDataURL,
            bytes: file.size,
            contentType: file.type,
          });

          ids.push(id);
          patch(item.id, { status: "done", progress: 1 });
        } catch (error) {
          patch(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed",
          });
        }
      }

      // Clear the finished rows once they have been seen.
      setTimeout(() => {
        setItems((prev) => prev.filter((i) => i.status !== "done"));
      }, 2500);

      return ids;
    },
    [generateUploadUrl, createMedia, patch],
  );

  return { upload, items };
}
