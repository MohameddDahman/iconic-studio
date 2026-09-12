import { Instrument_Serif, Mona_Sans, Geist_Mono, IBM_Plex_Sans_Arabic } from "next/font/google";

/**
 * Display — Instrument Serif.
 * A sharp, slightly condensed display serif. Set large and tight it reads as
 * editorial rather than decorative, and its italic carries the accent words in
 * headlines without needing a second family.
 */
export const display = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-display",
});

/**
 * Text — Mona Sans. A variable grotesk with a real width axis: body copy at
 * the normal width, and the small tracked labels drawn slightly expanded so
 * they read as set type rather than shrunken paragraphs.
 */
export const text = Mona_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-text",
  axes: ["wdth"],
});

/** Technical — dimensions, levels and drawing annotations. */
export const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
});

/**
 * The studio's clients write their reviews in Arabic. Those are shown in the
 * language they were written in, so the site needs a face that sets them
 * properly rather than falling back to whatever the OS supplies.
 */
export const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-arabic",
  weight: ["300", "400", "500"],
});

export const fontClassNames = [display.variable, text.variable, mono.variable, arabic.variable].join(" ");
