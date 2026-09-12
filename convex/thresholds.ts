import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { resolveMediaId } from "./media";
import { clean, requireStudio } from "./lib";

async function shape(ctx: QueryCtx, doc: Doc<"thresholds">) {
  return {
    _id: doc._id,
    room: doc.room,
    ceiling: doc.ceiling,
    note: doc.note,
    planX: doc.planX,
    planY: doc.planY,
    published: doc.published,
    order: doc.order,
    media: await resolveMediaId(ctx, doc.mediaId),
  };
}

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("thresholds")
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
    const docs = await ctx.db.query("thresholds").collect();
    docs.sort((a, b) => a.order - b.order);
    return Promise.all(docs.map((d) => shape(ctx, d)));
  },
});

const fields = {
  room: v.string(),
  ceiling: v.string(),
  note: v.string(),
  mediaId: v.optional(v.id("media")),
  planX: v.optional(v.number()),
  planY: v.optional(v.number()),
  published: v.boolean(),
};

interface RoomText {
  room: string;
  ceiling: string;
  note: string;
}

/** Trimmed, capped and checked before anything is written. */
function tidy<T extends RoomText>(args: T): T {
  const room = clean(args.room, 80);
  if (!room) throw new ConvexError("A room needs a name.");
  return { ...args, room, ceiling: clean(args.ceiling, 20), note: clean(args.note, 600) };
}

export const create = mutation({
  args: fields,
  handler: async (ctx, raw) => {
    await requireStudio(ctx);
    const args = tidy(raw);
    const all = await ctx.db.query("thresholds").collect();
    const order = all.reduce((m, d) => Math.max(m, d.order), 0) + 1;
    return await ctx.db.insert("thresholds", { ...args, order });
  },
});

export const update = mutation({
  args: { id: v.id("thresholds"), ...fields },
  handler: async (ctx, { id, ...raw }) => {
    await requireStudio(ctx);
    await ctx.db.patch(id, tidy(raw));
  },
});

export const remove = mutation({
  args: { id: v.id("thresholds") },
  handler: async (ctx, { id }) => {
    await requireStudio(ctx);
    await ctx.db.delete(id);
  },
});

export const reorder = mutation({
  args: { ids: v.array(v.id("thresholds")) },
  handler: async (ctx, { ids }) => {
    await requireStudio(ctx);
    await Promise.all(ids.map((id, i) => ctx.db.patch(id, { order: i + 1 })));
  },
});
