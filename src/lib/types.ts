/**
 * The shapes the public site renders. Convex documents are mapped onto these in
 * `src/lib/content.ts`, so every page works identically whether the data came
 * from the database or from the seed set.
 */

/** A second rendering of the same view — same frame, different light. */
export interface MediaVariant {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

export interface Media {
  src: string;
  alt: string;
  width: number;
  height: number;
  blurDataURL?: string;
  caption?: string;
  /**
   * The same room rendered after dark, with only its own lighting on. When it
   * is present the image gets a lamp switch that crossfades between the two.
   */
  night?: MediaVariant;
}

/** Property and space types the studio works on. */
export type Typology =
  | "Apartment"
  | "Villa"
  | "Duplex"
  | "Penthouse"
  | "Chalet"
  | "Office"
  | "Hospitality"
  | "Retail"
  | "Healthcare"
  | "Commercial"
  | "Mosque";

/**
 * Iconic designs and executes, so where a project has got to matters more than
 * a generic "complete".
 */
export type ProjectStage = "Built" | "On site" | "Design stage";

export interface Fact {
  label: string;
  value: string;
}

export interface Project {
  slug: string;
  title: string;
  /** Job reference, e.g. IC-24-017. */
  reference: string;
  year: number;
  location: string;
  typology: Typology;
  stage: ProjectStage;
  /** One line, used on cards and in the index. */
  brief: string;
  /** The case-study body. Paragraphs. */
  statement: string[];
  /** Specified finishes — the part clients actually ask about. */
  materials: string[];
  facts: Fact[];
  cover: Media;
  gallery: Media[];
  featured: boolean;
  order: number;
  /**
   * Built from licensed stock photography to show a project type, not from the
   * studio's own work. Must be replaced or removed before launch.
   */
  placeholder?: boolean;
}

export interface Testimonial {
  id: string;
  quote: string;
  author: string;
  role: string;
  /** Language the review was written in. Arabic is shown as written. */
  lang?: "en" | "ar";
  /** English rendering, shown beneath an Arabic quote. */
  translation?: string;
  /** Where it was left, e.g. "Facebook recommendation". */
  source?: string;
  date?: string;
  projectSlug?: string;
  /** Sample content that must be replaced before launch. */
  placeholder?: boolean;
}

/** One room in the house walkthrough. `id` matches a room in the house plan. */
export interface Threshold {
  id: string;
  room: string;
  /** Finished ceiling height. */
  ceiling: string;
  note: string;
  media: Media;
  /** Legacy plan position (0–100 × 0–64), kept for the studio desk. */
  plan: { x: number; y: number };
}

/** A spread in the bound volume. */
export interface Spread {
  id: string;
  folio: number;
  title: string;
  kicker: string;
  body: string;
  media: Media;
  mediaB?: Media;
  projectSlug?: string;
}

export interface StudioLink {
  label: string;
  url: string;
}

export interface StudioSettings {
  name: string;
  tagline: string;
  intro: string;
  /** Empty when the studio has no public address; the site then leaves it out. */
  email: string;
  phone: string;
  /** The number WhatsApp opens, in full international form. */
  whatsapp: string;
  address: string[];
  instagram: string;
  instagramUrl: string;
  /** A Google Maps link to the studio. */
  mapUrl: string;
  /** Everywhere else the studio is online, in the order shown. */
  links: StudioLink[];
}
