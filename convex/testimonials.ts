import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { clean, requireStudio } from "./lib";

export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("testimonials")
      .withIndex("by_published_order", (q) => q.eq("published", true))
      .collect();
    return docs.sort((a, b) => a.order - b.order);
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const docs = await ctx.db.query("testimonials").collect();
    return docs.sort((a, b) => a.order - b.order);
  },
});

const fields = {
  quote: v.string(),
  author: v.string(),
  role: v.string(),
  lang: v.optional(v.union(v.literal("en"), v.literal("ar"))),
  translation: v.optional(v.string()),
  source: v.optional(v.string()),
  date: v.optional(v.string()),
  projectSlug: v.optional(v.string()),
  published: v.boolean(),
};

interface ReviewText {
  quote: string;
  author: string;
  role: string;
  translation?: string;
  source?: string;
  date?: string;
  projectSlug?: string;
}

const optional = (value: string | undefined, max: number) => (value ? clean(value, max) || undefined : undefined);

/** Trimmed, capped and checked before anything is written. */
function tidy<T extends ReviewText>(args: T): T {
  const quote = clean(args.quote, 2000);
  const author = clean(args.author, 120);
  if (!quote || !author) {
    throw new ConvexError("A review needs the words and the name of the person who wrote them.");
  }
  return {
    ...args,
    quote,
    author,
    role: clean(args.role, 120),
    translation: optional(args.translation, 2000),
    source: optional(args.source, 120),
    date: optional(args.date, 40),
    projectSlug: optional(args.projectSlug, 160),
  };
}

export const create = mutation({
  args: fields,
  handler: async (ctx, raw) => {
    await requireStudio(ctx);
    const args = tidy(raw);
    const all = await ctx.db.query("testimonials").collect();
    const order = all.reduce((m, d) => Math.max(m, d.order), 0) + 1;
    return await ctx.db.insert("testimonials", { ...args, order });
  },
});

export const update = mutation({
  args: { id: v.id("testimonials"), ...fields },
  handler: async (ctx, { id, ...raw }) => {
    await requireStudio(ctx);
    await ctx.db.patch(id, tidy(raw));
  },
});

export const remove = mutation({
  args: { id: v.id("testimonials") },
  handler: async (ctx, { id }) => {
    await requireStudio(ctx);
    await ctx.db.delete(id);
  },
});

export const reorder = mutation({
  args: { ids: v.array(v.id("testimonials")) },
  handler: async (ctx, { ids }) => {
    await requireStudio(ctx);
    await Promise.all(ids.map((id, i) => ctx.db.patch(id, { order: i + 1 })));
  },
});
