"use client";

import { lights, useLights } from "@/lib/lights";
import { cn } from "@/lib/utils";

/**
 * The lamp. Pressing it turns the evening renders on across the page.
 * The icon is drawn, not borrowed: a pendant whose bulb and light cone come on
 * with the switch, so the control shows its own state before any label does.
 */
export default function LampSwitch({
  className,
  label = true,
  tone = "auto",
}: {
  className?: string;
  /** Show the text label beside the icon. */
  label?: boolean;
  /** "glass" sits over photography; "auto" follows the surface it is on. */
  tone?: "auto" | "glass";
}) {
  const { mode } = useLights();
  const on = mode === "evening";

  return (
    <button
      type="button"
      onClick={() => lights.toggle()}
      aria-pressed={on}
      aria-label={on ? "Switch the rooms back to daylight" : "Switch the rooms to evening light"}
      title={on ? "Daylight" : "Evening light"}
      className={cn(
        "group relative inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-full transition-colors duration-500",
        label ? "py-1.5 pr-5 pl-1.5" : "p-1.5",
        tone === "glass"
          ? "border border-white/20 bg-black/35 text-bone backdrop-blur-md hover:border-white/40"
          : "border border-rule-strong text-on-surface hover:border-accent",
        className,
      )}
    >
      <span
        className={cn(
          "relative grid size-8 place-items-center rounded-full transition-colors duration-700",
          on ? "bg-glow text-night" : "bg-transparent",
        )}
      >
        {/* halo */}
        <span
          aria-hidden="true"
          className={cn(
            "absolute -inset-2 rounded-full bg-glow/40 blur-md transition-opacity duration-700",
            on ? "opacity-100" : "opacity-0",
          )}
        />
        <svg viewBox="0 0 24 24" aria-hidden="true" className="relative size-[1.15rem]" fill="none">
          <path d="M12 1.5V6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          <path
            d="M5.2 12.6C5.2 8.9 8.2 6 12 6s6.8 2.9 6.8 6.6H5.2Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
            fill={on ? "currentColor" : "none"}
            className="transition-[fill] duration-500"
          />
          <circle
            cx="12"
            cy="14.6"
            r="1.7"
            stroke="currentColor"
            strokeWidth="1.3"
            fill={on ? "currentColor" : "none"}
          />
          <g
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinecap="round"
            className={cn(
              "origin-[12px_15px] transition-[opacity,transform] duration-500",
              on ? "scale-100 opacity-100" : "scale-50 opacity-0",
            )}
          >
            <path d="M12 18.2v3" />
            <path d="M8.2 17.2 6.6 19.6" />
            <path d="M15.8 17.2l1.6 2.4" />
          </g>
        </svg>
      </span>

      {label && (
        <span className="eyebrow relative grid">
          {/* Both labels occupy the same cell so the button never changes width. */}
          <span className={cn("col-start-1 row-start-1 transition-opacity duration-500", on && "opacity-0")}>
            Daylight
          </span>
          <span
            className={cn("col-start-1 row-start-1 transition-opacity duration-500", !on && "opacity-0")}
          >
            Evening
          </span>
        </span>
      )}
    </button>
  );
}
