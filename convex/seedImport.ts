import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import type { Media } from "../src/lib/types";
import {
  SEED_PROJECTS,
  SEED_SETTINGS,
  SEED_SPREADS,
  SEED_TESTIMONIALS,
} from "../src/lib/seed";
import { now } from "./lib";

/**
 * Move the seed content — the projects, rooms, spreads, reviews and settings the
 * site falls back to — into the database, so the studio desk can edit it.
 *
 * These are internal functions: the CLI may call them, the browser may not.
 * `scripts/import-seed.mjs` drives them, because the photographs live on the
 * developer's disk and have to be uploaded from there.
 */

interface SeedFile {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  blurDataURL?: string;
  /** The after-dark rendering of the same view, where the seed has one. */
  night?: string;
}

/** Every photograph the seed content refers to, once each. */
function seedFiles() {
  const files = new Map<string, SeedFile>();

  const add = (media: Media) => {
    const seen = files.get(media.src);
    files.set(media.src, {
      src: media.src,
      alt: seen?.alt || media.alt,
      caption: seen?.caption ?? media.caption,
      width: media.width,
      height: media.height,
      blurDataURL: media.blurDataURL,
      night: seen?.night ?? media.night?.src,
    });
    if (media.night && !files.has(media.night.src)) {
      files.set(media.night.src, {
        src: media.night.src,
        alt: `${media.alt}, after dark`,
        width: media.night.width,
        height: media.night.height,
        blurDataURL: media.night.blurDataURL,
      });
    }
  };

  for (const project of SEED_PROJECTS) {
    add(project.cover);
    project.gallery.forEach(add);
  }
  for (const spread of SEED_SPREADS) {
    add(spread.media);
    if (spread.mediaB) add(spread.mediaB);
  }
  return [...files.values()];
}

export const neededFiles = internalQuery({
  args: {},
  handler: async () => seedFiles(),
});

/** Upload slots for the importer to post the files to. */
export const uploadUrls = internalMutation({
  args: { count: v.number() },
  handler: async (ctx, { count }) => {
    const urls: string[] = [];
    for (let i = 0; i < Math.min(Math.max(count, 0), 40); i++) {
      urls.push(await ctx.storage.generateUploadUrl());
    }
    return urls;
  },
});

const TABLES = ["projects", "testimonials", "spreads", "media", "settings"] as const;

export const apply = internalMutation({
  args: {
    uploads: v.array(
      v.object({
        src: v.string(),
        storageId: v.id("_storage"),
        bytes: v.optional(v.number()),
        contentType: v.optional(v.string()),
      }),
    ),
    /** Clear what is there first. Without it, an import that would write over existing rows stops. */
    replace: v.optional(v.boolean()),
  },
  handler: async (ctx, { uploads, replace }) => {
    for (const table of TABLES) {
      const existing = await ctx.db.query(table).first();
      if (existing && !replace) {
        throw new Error(`${table} already has rows. Run the import with --replace to clear them first.`);
      }
    }
    if (replace) {
      for (const photo of await ctx.db.query("media").collect()) {
        await ctx.storage.delete(photo.storageId);
      }
      for (const table of TABLES) {
        for (const doc of await ctx.db.query(table).collect()) await ctx.db.delete(doc._id);
      }
    }

    const uploaded = new Map(uploads.map((upload) => [upload.src, upload]));
    const files = seedFiles();
    const mediaBySrc = new Map<string, Id<"media">>();

    for (const file of files) {
      const upload = uploaded.get(file.src);
      if (!upload) continue;
      mediaBySrc.set(
        file.src,
        await ctx.db.insert("media", {
          storageId: upload.storageId,
          alt: file.alt,
          caption: file.caption,
          width: file.width,
          height: file.height,
          blurDataURL: file.blurDataURL,
          bytes: upload.bytes,
          contentType: upload.contentType,
          createdAt: now(),
        }),
      );
    }

    // Day and evening renderings of the same view, paired the way the site expects.
    for (const file of files) {
      const day = mediaBySrc.get(file.src);
      const night = file.night ? mediaBySrc.get(file.night) : undefined;
      if (day && night) await ctx.db.patch(day, { nightId: night });
    }

    for (const [index, project] of SEED_PROJECTS.entries()) {
      await ctx.db.insert("projects", {
        slug: project.slug,
        title: project.title,
        reference: project.reference,
        year: project.year,
        location: project.location,
        typology: project.typology,
        stage: project.stage,
        brief: project.brief,
        statement: project.statement,
        materials: project.materials,
        facts: project.facts,
        coverId: mediaBySrc.get(project.cover.src),
        galleryIds: project.gallery
          .map((photo) => mediaBySrc.get(photo.src))
          .filter((id): id is Id<"media"> => Boolean(id)),
        featured: project.featured,
        published: true,
        placeholder: project.placeholder,
        order: project.order || index + 1,
        updatedAt: now(),
      });
    }

    for (const [index, spread] of SEED_SPREADS.entries()) {
      await ctx.db.insert("spreads", {
        folio: spread.folio,
        kicker: spread.kicker,
        title: spread.title,
        body: spread.body,
        mediaId: mediaBySrc.get(spread.media.src),
        mediaBId: spread.mediaB ? mediaBySrc.get(spread.mediaB.src) : undefined,
        projectSlug: spread.projectSlug,
        published: true,
        order: index + 1,
      });
    }

    for (const [index, review] of SEED_TESTIMONIALS.entries()) {
      await ctx.db.insert("testimonials", {
        quote: review.quote,
        author: review.author,
        role: review.role,
        lang: review.lang,
        translation: review.translation,
        source: review.source,
        date: review.date,
        projectSlug: review.projectSlug,
        published: true,
        order: index + 1,
      });
    }

    // A count the placeholders leave unset is simply absent from the row.
    await ctx.db.insert("settings", { ...SEED_SETTINGS, completedProjects: SEED_SETTINGS.completedProjects ?? undefined });

    return {
      media: mediaBySrc.size,
      projects: SEED_PROJECTS.length,
      spreads: SEED_SPREADS.length,
      reviews: SEED_TESTIMONIALS.length,
      missing: files.filter((file) => !uploaded.has(file.src)).map((file) => file.src),
    };
  },
});
