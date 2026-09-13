import "server-only";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import {
  SEED_PROJECTS,
  SEED_SETTINGS,
  SEED_SPREADS,
  SEED_TESTIMONIALS,
  SEED_THRESHOLDS,
} from "./seed";
import type { Media, Project, Spread, StudioLink, StudioSettings, Testimonial, Threshold } from "./types";

/**
 * The public site reads from Convex on the server, so pages arrive complete
 * with no client-side loading state. If Convex is not configured yet, or a
 * collection is still empty, the seed set stands in — the site is never blank
 * and never half-rendered.
 */

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;
const client = CONVEX_URL ? new ConvexHttpClient(CONVEX_URL) : null;

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
        src: m.src,
        alt: m.alt || fallbackAlt,
        caption: m.caption,
        width: m.width,
        height: m.height,
        blurDataURL: m.blurDataURL,
        // The evening version set in the studio desk gives the photograph its lamp switch.
        ...(m.night
          ? {
              night: {
                src: m.night.src,
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
    console.warn(`[content] Convex query "${label}" failed, using seed content.`, error);
    return null;
  }
}

/* ---- Projects ------------------------------------------------------------ */

export async function getProjects(): Promise<Project[]> {
  const rows = await fromConvex(() => client!.query(api.projects.listPublished, {}), "projects.listPublished");
  if (!rows || rows.length === 0) return SEED_PROJECTS;

  const projects = rows.flatMap((r: Record<string, unknown>): Project[] => {
    const gallery = ((r.gallery ?? []) as RemoteMedia[])
      .map((g) => toMedia(g, String(r.title)))
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
  return projects.length ? projects : SEED_PROJECTS;
}

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

export async function getTestimonials(): Promise<Testimonial[]> {
  const rows = await fromConvex(
    () => client!.query(api.testimonials.listPublished, {}),
    "testimonials.listPublished",
  );
  if (!rows || rows.length === 0) return SEED_TESTIMONIALS;

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

/* ---- Monograph spreads --------------------------------------------------- */

export async function getSpreads(): Promise<Spread[]> {
  const rows = await fromConvex(() => client!.query(api.spreads.listPublished, {}), "spreads.listPublished");
  if (!rows || rows.length === 0) return SEED_SPREADS;

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

/* ---- Walkthrough --------------------------------------------------------- */

export async function getThresholds(): Promise<Threshold[]> {
  const rows = await fromConvex(
    () => client!.query(api.thresholds.listPublished, {}),
    "thresholds.listPublished",
  );
  if (!rows || rows.length === 0) return SEED_THRESHOLDS;

  return rows
    .map((r: Record<string, unknown>): Threshold | null => {
      const media = toMedia(r.media as RemoteMedia, String(r.room));
      if (!media) return null;
      return {
        id: String(r._id),
        room: String(r.room),
        ceiling: String(r.ceiling),
        note: String(r.note),
        media,
        plan: { x: Number(r.planX ?? 50), y: Number(r.planY ?? 32) },
      };
    })
    .filter((t): t is Threshold => Boolean(t));
}

/* ---- Settings ------------------------------------------------------------ */

export async function getSettings(): Promise<StudioSettings> {
  const row = await fromConvex(() => client!.query(api.settings.get, {}), "settings.get");
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
  };
}
