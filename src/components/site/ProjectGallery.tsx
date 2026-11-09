"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/types";

const two = (n: number) => String(n).padStart(2, "0");

/**
 * The project's photographs as a grid of small squares. Only the squares load
 * with the page; a full-size photograph is fetched when someone opens it, so a
 * project of seventy photographs stays light however long it is.
 */
export default function ProjectGallery({ images }: { images: Media[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section data-surface="night" className="bg-surface py-[var(--spacing-bay)] text-on-surface">
      <div className="sheet">
        <div className="mb-8 flex items-baseline justify-between gap-6 border-b border-rule pb-5">
          <h2 className="eyebrow text-on-surface-faint">Gallery</h2>
          <span className="annotation text-on-surface-faint">{two(images.length)} images</span>
        </div>

        <ul className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:gap-2 lg:grid-cols-6">
          {images.map((media, i) => (
            <li key={media.src}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden bg-umber"
              >
                <Image
                  src={media.src}
                  alt={media.alt}
                  fill
                  sizes="(min-width: 1024px) 16vw, (min-width: 640px) 25vw, 33vw"
                  quality={70}
                  placeholder={media.blurDataURL ? "blur" : "empty"}
                  blurDataURL={media.blurDataURL}
                  className="object-cover transition-transform duration-700 ease-cut group-hover:scale-105"
                />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {open !== null && (
        <PhotoViewer images={images} index={open} onChange={setOpen} onClose={() => setOpen(null)} />
      )}
    </section>
  );
}

const roundButton =
  "flex size-12 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-night/70 text-bone transition-colors duration-300 hover:border-glow hover:text-glow";

function Chevron({ back = false }: { back?: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      className={cn("size-5", back && "rotate-180")}
    >
      <path d="M9 5l7 7-7 7" />
    </svg>
  );
}

/** One photograph at a time, over the whole page, with buttons to the next and the last. */
function PhotoViewer({
  images,
  index,
  onChange,
  onClose,
}: {
  images: Media[];
  index: number;
  onChange: (index: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const swipeFrom = useRef<number | null>(null);
  const count = images.length;
  const current = images[index];
  const go = (delta: number) => onChange((index + delta + count) % count);

  // A real dialog keeps focus inside, closes on Escape, and sits above the header.
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

  // The neighbours load behind the one on show, so the next press is instant.
  const loaded = [...new Set([index, (index + 1) % count, (index - 1 + count) % count])];

  return (
    <dialog
      ref={dialogRef}
      aria-label="Project photographs"
      onClose={onClose}
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft") go(-1);
        if (event.key === "ArrowRight") go(1);
      }}
      className="fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden border-0 bg-night p-0 text-bone"
    >
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between px-4 py-3 md:px-8 md:py-4">
          <p aria-live="polite" className="annotation text-bone/70 tabular-nums">
            {two(index + 1)} / {two(count)}
          </p>
          <button
            type="button"
            aria-label="Close"
            onClick={() => dialogRef.current?.close()}
            className={roundButton}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div
          className="relative min-h-0 flex-1"
          onTouchStart={(event) => {
            swipeFrom.current = event.touches[0].clientX;
          }}
          onTouchEnd={(event) => {
            if (swipeFrom.current === null) return;
            const moved = event.changedTouches[0].clientX - swipeFrom.current;
            swipeFrom.current = null;
            if (Math.abs(moved) > 48) go(moved < 0 ? 1 : -1);
          }}
        >
          <div className="absolute inset-0 md:inset-x-24">
            {loaded.map((i) => {
              const media = images[i];
              return (
                <Image
                  key={media.src}
                  src={media.src}
                  alt={i === index ? media.alt : ""}
                  fill
                  sizes={`min(100vw, ${Math.ceil((media.width / media.height) * 100)}vh)`}
                  quality={80}
                  loading="eager"
                  placeholder={media.blurDataURL ? "blur" : "empty"}
                  blurDataURL={media.blurDataURL}
                  className={cn("object-contain", i !== index && "invisible")}
                />
              );
            })}
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                aria-label="Previous photograph"
                onClick={() => go(-1)}
                className={cn(roundButton, "absolute top-1/2 left-3 -translate-y-1/2 md:left-8")}
              >
                <Chevron back />
              </button>
              <button
                type="button"
                aria-label="Next photograph"
                onClick={() => go(1)}
                className={cn(roundButton, "absolute top-1/2 right-3 -translate-y-1/2 md:right-8")}
              >
                <Chevron />
              </button>
            </>
          )}
        </div>

        <p className="annotation min-h-11 px-4 py-3 text-center text-bone/70">{current.caption}</p>
      </div>
    </dialog>
  );
}
