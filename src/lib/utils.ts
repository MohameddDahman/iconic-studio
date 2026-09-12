import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Clamp a number into a range. */
export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

/** Map a value from one range to another, clamped. */
export const mapRange = (v: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  outMin + (clamp((v - inMin) / (inMax - inMin)) * (outMax - outMin));

/** `IC-24-017` style drawing numbers, derived from year + index. */
export function drawingNumber(year: number, index: number, prefix = "IC") {
  return `${prefix}-${String(year).slice(-2)}-${String(index).padStart(3, "0")}`;
}

/** `+3.60` style level datums. */
export function datum(metres: number) {
  const sign = metres < 0 ? "−" : "+";
  return `${sign}${Math.abs(metres).toFixed(2)}`;
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['\u2019]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
