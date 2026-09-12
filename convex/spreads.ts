import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { resolveMediaId } from "./media";
import { clean, requireStudio } from "./lib";

async function shape(ctx: QueryCtx, doc: Doc<"spreads">) {
  const [media, mediaB] = await Promise.all([
    resolveMediaId(ctx, doc.mediaId),
    resolveMediaId(ctx, doc.mediaBId),
  ]);
  return {
    _id: doc._id,
    folio: doc.folio,
    kicker: doc.kicker,
    title: doc.title,
    body: doc.body,
    projectSlug: doc.projectSlug,
    published: doc.published,
    order: doc.order,
    media,
    mediaB,
  };
}

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("spreads")
      .withIndex("by_published_order", (q) => q.eq("published", true))
      .collect();
    docs.sort((a, b) => a.order - b.order);
    return Promise.all(docs.map((d) => shape(ctx, d)));
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const docs = await ctx.db.query("spreads").collect();
    docs.sort((a, b) => a.order - b.order);
    return Promise.all(docs.map((d) => shape(ctx, d)));
  },
});

const fields = {
  folio: v.number(),
  kicker: v.string(),
  title: v.string(),
  body: v.string(),
  mediaId: v.optional(v.id("media")),
  mediaBId: v.optional(v.id("media")),
  projectSlug: v.optional(v.string()),
  published: v.boolean(),
};

interface SpreadText {
  folio: number;
  kicker: string;
  title: string;
  body: string;
  projectSlug?: string;
}

/** Trimmed, capped and checked before anything is written. */
function tidy<T extends SpreadText>(args: T): T {
  const title = clean(args.title, 160);
  if (!title) throw new ConvexError("A spread needs a title.");
  return {
    ...args,
    folio: Math.max(1, Math.round(args.folio) || 1),
    kicker: clean(args.kicker, 80),
    title,
    body: clean(args.body, 1200),
    projectSlug: args.projectSlug ? clean(args.projectSlug, 160) || undefined : undefined,
  };
}

export const create = mutation({
  args: fields,
  handler: async (ctx, raw) => {
    await requireStudio(ctx);
    const args = tidy(raw);
    const all = await ctx.db.query("spreads").collect();
    const order = all.reduce((m, d) => Math.max(m, d.order), 0) + 1;
    return await ctx.db.insert("spreads", { ...args, order });
  },
});

export const update = mutation({
  args: { id: v.id("spreads"), ...fields },
  handler: async (ctx, { id, ...raw }) => {
    await requireStudio(ctx);
    await ctx.db.patch(id, tidy(raw));
  },
});

export const remove = mutation({
  args: { id: v.id("spreads") },
  handler: async (ctx, { id }) => {
    await requireStudio(ctx);
    await ctx.db.delete(id);
  },
});

export const reorder = mutation({
  args: { ids: v.array(v.id("spreads")) },
  handler: async (ctx, { ids }) => {
    await requireStudio(ctx);
    await Promise.all(ids.map((id, i) => ctx.db.patch(id, { order: i + 1 })));
  },
});
