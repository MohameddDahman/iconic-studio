import "server-only";
import { cache } from "react";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import { SEED_SETTINGS } from "./seed";
import snapshot from "./snapshot.json";
import baked from "./baked-photos.json";
import type { Media, Project, Spread, StudioLink, StudioSettings, Testimonial } from "./types";
import type { Video } from "./video";

/**
 * The public site reads from Convex on the server, so pages arrive complete
 * with no client-side loading state. If Convex is not configured yet, or a
 * collection is still empty, the seed set stands in — the site is never blank
 * and never half-rendered.
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
/**
 * Every read is kept in the data cache until the desk says something changed
 * (app/api/refresh), so ordinary visits cost Convex nothing.
 */
const cachedFetch: typeof fetch = (input, init) =>
  fetch(input, { ...init, cache: "force-cache", next: { revalidate: 60 * 60 * 24, tags: ["content"] } });
const client = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL, { fetch: cachedFetch }) : null;

/**
 * The studio's published records as last saved from Convex (scripts/bake-photos.mjs).
 * If Convex cannot be reached, these stand in: the studio's own work, never samples.
 */
type Rows = Record<string, unknown>[];
const SAVED = snapshot as unknown as {
  projects: Rows;
  spreads: Rows;
  testimonials: Rows;
  videos?: Rows;
  settings: Record<string, unknown> | null;
};

/**
 * Photographs prepared as plain files are served from those; any other stored
 * photograph is sized once by /photo/ and cached (see image-loader.ts).
 */
const PREPARED = baked as { uuids: Record<string, string>; shown: string[] };
const SHOWN = new Set(PREPARED.shown);
const prepared = (src: string) => {
  const uuid = src.match(/\/api\/storage\/([0-9a-f-]{36})/)?.[1];
  if (!uuid) return src;
  const id = PREPARED.uuids[uuid];
  return id && SHOWN.has(id) ? `/media/live/${id}.webp` : `/photo/${uuid}.webp`;
};

export const isConvexConfigured = Boolean(CONVEX_URL);

type RemoteMedia = {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  blurDataURL?: string;
  night?: { src: string; width: number; height: number; blurDataURL?: string };
} | null;

const toMedia = (m: RemoteMedia, fallbackAlt = ""): Media | null =>
  m
    ? {
        src: prepared(m.src),
        // A file called 16.jpg leaves its number as the description; that helps nobody.
        alt: /\p{L}/u.test(m.alt) ? m.alt : fallbackAlt,
        caption: m.caption,
        width: m.width,
        height: m.height,
        blurDataURL: m.blurDataURL,
        // The evening version set in the studio desk gives the photograph its lamp switch.
        ...(m.night
          ? {
              night: {
                src: prepared(m.night.src),
                width: m.night.width,
                height: m.night.height,
                blurDataURL: m.night.blurDataURL,
              },
            }
          : {}),
      }
    : null;

async function fromConvex<T>(run: () => Promise<T>, label: string): Promise<T | null> {
  if (!client) return null;
  try {
    return await run();
  } catch (error) {
    console.warn(`[content] Convex query "${label}" failed, using the saved copy.`, error);
    return null;
  }
}

/* ---- Projects ------------------------------------------------------------ */

async function loadProjects(): Promise<Project[]> {
  const rows = ((await fromConvex(() => client!.query(api.projects.listPublished, {}), "projects.listPublished")) ??
    SAVED.projects) as Rows;

  const projects = rows.flatMap((r: Record<string, unknown>): Project[] => {
    const gallery = ((r.gallery ?? []) as RemoteMedia[])
      .map((g, i) => toMedia(g, `${r.title}, photograph ${i + 1}`))
      .filter((m): m is Media => Boolean(m));
    // Without a single photograph a project would leave a hole in every layout,
    // so it stays off the site until it has one.
    const cover = toMedia(r.cover as RemoteMedia, String(r.title)) ?? gallery[0];
    if (!cover) return [];

    return [{
      slug: String(r.slug),
      title: String(r.title),
      reference: String(r.reference),
      year: Number(r.year),
      location: String(r.location),
      typology: r.typology as Project["typology"],
      stage: r.stage as Project["stage"],
      brief: String(r.brief),
      statement: (r.statement ?? []) as string[],
      materials: (r.materials ?? []) as string[],
      facts: (r.facts ?? []) as Project["facts"],
      cover,
      gallery,
      featured: Boolean(r.featured),
      placeholder: Boolean(r.placeholder),
      order: Number(r.order ?? 0),
    } satisfies Project];
  });
  return projects;
}

/** Read once per page, however many parts of the page ask. */
export const getProjects = cache(loadProjects);

export async function getProject(slug: string): Promise<Project | null> {
  const all = await getProjects();
  return all.find((p) => p.slug === slug) ?? null;
}

export async function getFeaturedProjects(limit = 3): Promise<Project[]> {
  const all = await getProjects();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
}

/* ---- Testimonials -------------------------------------------------------- */

async function loadTestimonials(): Promise<Testimonial[]> {
  const rows = ((await fromConvex(
    () => client!.query(api.testimonials.listPublished, {}),
    "testimonials.listPublished",
  )) ?? SAVED.testimonials) as Rows;

  return rows.map((r: Record<string, unknown>) => ({
    id: String(r._id),
    quote: String(r.quote),
    author: String(r.author),
    role: String(r.role),
    lang: (r.lang as "en" | "ar" | undefined) ?? "en",
    translation: r.translation ? String(r.translation) : undefined,
    source: r.source ? String(r.source) : undefined,
    date: r.date ? String(r.date) : undefined,
    projectSlug: r.projectSlug ? String(r.projectSlug) : undefined,
  }));
}

export const getTestimonials = cache(loadTestimonials);

/* ---- Monograph spreads --------------------------------------------------- */

async function loadSpreads(): Promise<Spread[]> {
  const rows = ((await fromConvex(() => client!.query(api.spreads.listPublished, {}), "spreads.listPublished")) ??
    SAVED.spreads) as Rows;

  return rows
    .map((r: Record<string, unknown>): Spread | null => {
      const media = toMedia(r.media as RemoteMedia, String(r.title));
      if (!media) return null;
      return {
        id: String(r._id),
        folio: Number(r.folio),
        kicker: String(r.kicker),
        title: String(r.title),
        body: String(r.body),
        media,
        mediaB: toMedia(r.mediaB as RemoteMedia, String(r.title)) ?? undefined,
        projectSlug: r.projectSlug ? String(r.projectSlug) : undefined,
      };
    })
    .filter((s): s is Spread => Boolean(s));
}

export const getSpreads = cache(loadSpreads);

/* ---- Films --------------------------------------------------------------- */

async function loadVideos(): Promise<Video[]> {
  const rows = ((await fromConvex(() => client!.query(api.videos.listPublished, {}), "videos.listPublished")) ??
    SAVED.videos ??
    []) as Rows;
  return rows.map((r) => ({
    id: String(r._id),
    publicId: String(r.publicId),
    title: String(r.title),
    projectSlug: r.projectSlug ? String(r.projectSlug) : undefined,
    duration: Number(r.duration ?? 0),
    width: Number(r.width ?? 0),
    height: Number(r.height ?? 0),
    compressed: Boolean(r.compressed),
  }));
}

export const getVideos = cache(loadVideos);

/* ---- Settings ------------------------------------------------------------ */

async function loadSettings(): Promise<StudioSettings> {
  const row = (await fromConvex(() => client!.query(api.settings.get, {}), "settings.get")) ?? SAVED.settings;
  if (!row) return SEED_SETTINGS;
  const r = row as Record<string, unknown>;
  return {
    name: String(r.name),
    tagline: String(r.tagline),
    intro: String(r.intro),
    email: String(r.email),
    phone: String(r.phone),
    whatsapp: String(r.whatsapp ?? ""),
    address: (r.address ?? []) as string[],
    instagram: String(r.instagram),
    instagramUrl: String(r.instagramUrl),
    mapUrl: String(r.mapUrl ?? ""),
    links: (r.links ?? []) as StudioLink[],
    completedProjects:
      typeof r.completedProjects === "number" && r.completedProjects > 0 ? r.completedProjects : null,
  };
}

export const getSettings = cache(loadSettings);
