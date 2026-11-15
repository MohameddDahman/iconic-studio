import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { clean, now, requireStudio } from "./lib";

/** The films the site shows, in order. */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("videos")
      .withIndex("by_published_order", (q) => q.eq("published", true))
      .collect();
    return docs
      .sort((a, b) => a.order - b.order)
      .map(({ _id, publicId, title, projectSlug, duration, width, height, compressed }) => ({
        _id,
        publicId,
        title,
        projectSlug,
        duration,
        width,
        height,
        compressed,
      }));
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const docs = await ctx.db.query("videos").withIndex("by_order").collect();
    return docs.sort((a, b) => a.order - b.order);
  },
});

/** Record a clip once Cloudinary has it. New films go on the site straight away. */
export const create = mutation({
  args: {
    publicId: v.string(),
    title: v.string(),
    duration: v.number(),
    width: v.number(),
    height: v.number(),
    bytes: v.number(),
    compressed: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireStudio(ctx);
    const last = await ctx.db.query("videos").withIndex("by_order").order("desc").first();
    return await ctx.db.insert("videos", {
      ...args,
      title: clean(args.title, 120) || "Untitled film",
      published: true,
      order: (last?.order ?? 0) + 1,
      createdAt: now(),
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("videos"),
    title: v.optional(v.string()),
    /** An empty string takes the film off its project. */
    projectSlug: v.optional(v.string()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, { id, title, projectSlug, published }) => {
    await requireStudio(ctx);
    if (!(await ctx.db.get(id))) throw new ConvexError("That film no longer exists.");
    await ctx.db.patch(id, {
      ...(title !== undefined ? { title: clean(title, 120) || "Untitled film" } : {}),
      ...(projectSlug !== undefined ? { projectSlug: projectSlug || undefined } : {}),
      ...(published !== undefined ? { published } : {}),
    });
  },
});

/** The record only: the desk removes the file from Cloudinary first (api/videos/delete). */
export const remove = mutation({
  args: { id: v.id("videos") },
  handler: async (ctx, { id }) => {
    await requireStudio(ctx);
    await ctx.db.delete(id);
  },
});

export const reorder = mutation({
  args: { ids: v.array(v.id("videos")) },
  handler: async (ctx, { ids }) => {
    await requireStudio(ctx);
    for (const [index, id] of ids.entries()) await ctx.db.patch(id, { order: index + 1 });
  },
});
