"use client";

import { useEffect } from "react";
import Image from "next/image";
import LampSwitch from "./LampSwitch";
import { lights, useLights } from "@/lib/lights";
import { cn } from "@/lib/utils";
import type { Media } from "@/lib/types";

/**
 * A photograph that may exist twice: once in daylight and once after dark.
 *
 * Without a night variant this is simply a filled <Image>. With one, the
 * evening render sits on top and is revealed through a circle that grows out of
 * the room's own lamp (`lamp` sets where), so switching reads as the light
 * changing inside the room rather than one picture fading into another.
 *
 * Fills its parent, which must be positioned and sized.
 */
export default function PairedImage({
  media,
  sizes,
  className,
  imageClassName,
  quality = 85,
  preload = false,
  lamp = { x: 86, y: 14 },
  showSwitch = true,
  switchClassName,
}: {
  media: Media;
  sizes: string;
  className?: string;
  imageClassName?: string;
  quality?: number;
  preload?: boolean;
  /** Where the light comes from, in percent of the frame. */
  lamp?: { x: number; y: number };
  showSwitch?: boolean;
  switchClassName?: string;
}) {
  const { mode } = useLights();
  const night = media.night;

  useEffect(() => {
    if (!night) return;
    return lights.register();
  }, [night]);

  return (
    <div
      data-lights={night ? mode : undefined}
      className={cn("absolute inset-0 overflow-hidden", className)}
      style={night ? ({ "--lamp-x": `${lamp.x}%`, "--lamp-y": `${lamp.y}%` } as React.CSSProperties) : undefined}
    >
      <Image
        src={media.src}
        alt={media.alt}
        fill
        sizes={sizes}
        quality={quality}
        preload={preload}
        placeholder={media.blurDataURL ? "blur" : "empty"}
        blurDataURL={media.blurDataURL}
        className={cn("object-cover", imageClassName)}
      />

      {night && (
        <>
          <div className="night-layer absolute inset-0" aria-hidden={mode !== "evening"}>
            <Image
              src={night.src}
              alt={`${media.alt}, after dark`}
              fill
              sizes={sizes}
              quality={quality}
              placeholder={night.blurDataURL ? "blur" : "empty"}
              blurDataURL={night.blurDataURL}
              className={cn("object-cover", imageClassName)}
            />
          </div>

          {showSwitch && (
            <div className={cn("absolute right-4 bottom-4 z-10 md:right-6 md:bottom-6", switchClassName)}>
              <LampSwitch tone="glass" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
