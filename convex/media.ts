import { ConvexError, v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { QueryCtx } from "./_generated/server";
import { clean, now, requireStudio } from "./lib";

/** A second rendering of the same view — same frame, different light. */
export interface ResolvedVariant {
  src: string;
  width: number;
  height: number;
  blurDataURL?: string;
}

export interface ResolvedMedia {
  _id: Id<"media">;
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
  blurDataURL?: string;
  night?: ResolvedVariant;
}

/**
 * Turn a media document into the exact shape the site renders, with its evening
 * version when it has one. Returns null if the underlying file has gone, so
 * callers can filter rather than render a broken image.
 */
export async function resolveMedia(
  ctx: QueryCtx,
  doc: Doc<"media"> | null,
): Promise<ResolvedMedia | null> {
  if (!doc) return null;
  const src = await ctx.storage.getUrl(doc.storageId);
  if (!src) return null;
  const media: ResolvedMedia = {
    _id: doc._id,
    src,
    alt: doc.alt,
    caption: doc.caption,
    width: doc.width,
    height: doc.height,
    blurDataURL: doc.blurDataURL,
  };
  if (doc.nightId) {
    const night = await ctx.db.get(doc.nightId);
    const nightSrc = night ? await ctx.storage.getUrl(night.storageId) : null;
    if (night && nightSrc) {
      media.night = { src: nightSrc, width: night.width, height: night.height, blurDataURL: night.blurDataURL };
    }
  }
  return media;
}

export async function resolveMediaId(ctx: QueryCtx, id: Id<"media"> | undefined) {
  if (!id) return null;
  return resolveMedia(ctx, await ctx.db.get(id));
}

export async function resolveMediaIds(ctx: QueryCtx, ids: Id<"media">[]) {
  const out: ResolvedMedia[] = [];
  for (const id of ids) {
    const m = await resolveMediaId(ctx, id);
    if (m) out.push(m);
  }
  return out;
}

/** Step one of an upload: the browser POSTs the file straight to this URL. */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/** Step two: record what was uploaded, with the dimensions measured in the browser. */
export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    alt: v.string(),
    caption: v.optional(v.string()),
    width: v.number(),
    height: v.number(),
    blurDataURL: v.optional(v.string()),
    bytes: v.optional(v.number()),
    contentType: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireStudio(ctx);
    return await ctx.db.insert("media", { ...args, alt: clean(args.alt, 300), createdAt: now() });
  },
});

export const update = mutation({
  args: {
    id: v.id("media"),
    alt: v.optional(v.string()),
    caption: v.optional(v.string()),
    /** The evening rendering of this view, or null to take it away. */
    nightId: v.optional(v.union(v.id("media"), v.null())),
  },
  handler: async (ctx, { id, alt, caption, nightId }) => {
    await requireStudio(ctx);
    if (!(await ctx.db.get(id))) throw new ConvexError("That photograph no longer exists.");

    const patch: Partial<Doc<"media">> = {};
    if (alt !== undefined) patch.alt = clean(alt, 300);
    if (caption !== undefined) patch.caption = clean(caption, 300) || undefined;
    if (nightId !== undefined) {
      if (nightId === id) throw new ConvexError("A photograph cannot be its own evening version.");
      if (nightId && !(await ctx.db.get(nightId))) {
        throw new ConvexError("That evening photograph no longer exists.");
      }
      patch.nightId = nightId ?? undefined;
    }
    await ctx.db.patch(id, patch);
  },
});

/**
 * Delete a photograph and take it out of everything that used it first, so no
 * page is left pointing at a file that has gone.
 */
export const remove = mutation({
  args: { id: v.id("media") },
  handler: async (ctx, { id }) => {
    await requireStudio(ctx);
    const doc = await ctx.db.get(id);
    if (!doc) return;

    for (const project of await ctx.db.query("projects").collect()) {
      if (project.coverId === id || project.galleryIds.includes(id)) {
        await ctx.db.patch(project._id, {
          coverId: project.coverId === id ? undefined : project.coverId,
          galleryIds: project.galleryIds.filter((photo) => photo !== id),
          updatedAt: now(),
        });
      }
    }
    for (const spread of await ctx.db.query("spreads").collect()) {
      if (spread.mediaId === id || spread.mediaBId === id) {
        await ctx.db.patch(spread._id, {
          mediaId: spread.mediaId === id ? undefined : spread.mediaId,
          mediaBId: spread.mediaBId === id ? undefined : spread.mediaBId,
        });
      }
    }
    for (const other of await ctx.db.query("media").collect()) {
      if (other.nightId === id) await ctx.db.patch(other._id, { nightId: undefined });
    }

    await ctx.storage.delete(doc.storageId);
    await ctx.db.delete(id);
  },
});

/**
 * Every photograph and where its file is, for scripts/bake-photos.mjs, which
 * prepares new ones as plain files for the site. Command line only.
 */
export const files = internalQuery({
  args: {},
  handler: async (ctx) =>
    await Promise.all(
      (await ctx.db.query("media").collect()).map(async (m) => ({ id: m._id, url: await ctx.storage.getUrl(m.storageId) })),
    ),
});

/** The whole library, newest first — the picker and the Photographs desk. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const docs = await ctx.db.query("media").withIndex("by_created").order("desc").take(2000);
    const rows = [];
    for (const doc of docs) {
      const media = await resolveMedia(ctx, doc);
      if (media) rows.push({ ...media, nightId: doc.nightId, bytes: doc.bytes, createdAt: doc.createdAt });
    }
    return rows;
  },
});

/** Where each photograph is used, so the desk can say so before anything is deleted. */
export const usage = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const uses = new Map<Id<"media">, string[]>();
    const add = (id: Id<"media"> | undefined, label: string) => {
      if (!id) return;
      uses.set(id, [...(uses.get(id) ?? []), label]);
    };

    for (const project of await ctx.db.query("projects").collect()) {
      add(project.coverId, `${project.title} — cover`);
      for (const photo of project.galleryIds) add(photo, `${project.title} — gallery`);
    }
    for (const spread of await ctx.db.query("spreads").collect()) {
      add(spread.mediaId, `Monograph — ${spread.title}`);
      add(spread.mediaBId, `Monograph — ${spread.title} (inset)`);
    }
    for (const photo of await ctx.db.query("media").collect()) {
      add(photo.nightId, `Evening version of “${photo.alt}”`);
    }

    return [...uses.entries()].map(([id, labels]) => ({ id, uses: labels }));
  },
});
