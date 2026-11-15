"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { isPhone, phoneVideoUrl, posterUrl, runtime, videoUrl, type Video } from "@/lib/video";

const two = (n: number) => String(n).padStart(2, "0");

/**
 * Films as cover pictures with a play mark. Nothing but the posters loads with
 * the page; a film is fetched only when someone opens it, and plays full screen
 * with buttons to the next and the last.
 */
export default function VideoGallery({
  videos,
  heading = "Films",
}: {
  videos: (Video & { projectTitle?: string })[];
  heading?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section data-surface="night" className="bg-surface py-[var(--spacing-bay)] text-on-surface">
      <div className="sheet">
        <div className="mb-8 flex items-baseline justify-between gap-6 border-b border-rule pb-5">
          <h2 className="eyebrow text-on-surface-faint">{heading}</h2>
          <span className="annotation text-on-surface-faint">
            {two(videos.length)} {videos.length === 1 ? "film" : "films"}
          </span>
        </div>

        <ul className="grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((video, i) => (
            <li key={video.id}>
              <button type="button" onClick={() => setOpen(i)} className="group block w-full cursor-pointer text-left">
                <span className="relative block aspect-video overflow-hidden bg-umber">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={posterUrl(video.publicId)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-cut group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex size-14 items-center justify-center rounded-full border border-white/40 bg-night/50 text-bone backdrop-blur-sm transition-colors duration-300 group-hover:border-glow group-hover:text-glow">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="ml-0.5 size-5" fill="currentColor">
                        <path d="M8 5.5v13l10.5-6.5z" />
                      </svg>
                    </span>
                  </span>
                  <span className="annotation absolute right-3 bottom-3 bg-night/70 px-2 py-1 text-bone tabular-nums">
                    {runtime(video.duration)}
                  </span>
                </span>
                <span className="mt-4 block text-lg leading-snug">{video.title}</span>
                {video.projectTitle && (
                  <span className="annotation mt-1 block text-on-surface-faint">{video.projectTitle}</span>
                )}
                <span className="sr-only">Play the film</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open !== null && (
        <FilmViewer videos={videos} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}

const roundButton =
  "flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-night/70 text-bone transition-colors duration-300 hover:border-glow hover:text-glow";

function FilmViewer({
  videos,
  index,
  onChange,
  onClose,
}: {
  videos: Video[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Phones get the 480p copy: about half the data, and sharp enough on a small screen.
  const [phone] = useState(isPhone);
  const count = videos.length;
  const current = videos[index];
  const go = (delta: number) => onChange((index + delta + count) % count);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    const root = document.documentElement;
    const before = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      root.style.overflow = before;
    };
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label="Films"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLVideoElement) return;
        if (event.key === "ArrowLeft") go(-1);
        if (event.key === "ArrowRight") go(1);
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-night p-0 text-bone"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between gap-4 px-4 py-3 md:px-8 md:py-4">
          <p aria-live="polite" className="annotation min-w-0 truncate text-bone/70">
            <span className="tabular-nums">
              {two(index + 1)} / {two(count)}
            </span>
            <span className="ml-4">{current.title}</span>
          </p>
          <button type="button" aria-label="Close" onClick={() => dialogRef.current?.close()} className={roundButton}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className="relative min-h-0 flex-1 md:px-24">
          <video
            key={current.publicId}
            src={phone ? phoneVideoUrl(current.publicId) : videoUrl(current.publicId, current.compressed)}
            poster={posterUrl(current.publicId)}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="h-full w-full bg-night object-contain"
          />
          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous film"
                onClick={() => go(-1)}
                className={cn(roundButton, "absolute top-1/2 left-3 -translate-y-1/2 md:left-8")}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5 rotate-180">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                aria-label="Next film"
                onClick={() => go(1)}
                className={cn(roundButton, "absolute top-1/2 right-3 -translate-y-1/2 md:right-8")}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
                  <path d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
        <div className="h-6 md:h-8" />
      </div>
    </dialog>
  );
}
