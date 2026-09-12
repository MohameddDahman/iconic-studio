import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { clean, requireStudio } from "./lib";

/** There is only ever one settings row. */
export const get = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("settings").first(),
});

const fields = {
  name: v.string(),
  tagline: v.string(),
  intro: v.string(),
  email: v.string(),
  phone: v.string(),
  address: v.array(v.string()),
  instagram: v.string(),
  instagramUrl: v.string(),
};

export const save = mutation({
  args: fields,
  handler: async (ctx, args) => {
    await requireStudio(ctx);
    const next = {
      name: clean(args.name, 80),
      tagline: clean(args.tagline, 160),
      intro: clean(args.intro, 600),
      email: clean(args.email, 200),
      phone: clean(args.phone, 60),
      address: args.address.map((line) => clean(line, 120)).filter(Boolean),
      instagram: clean(args.instagram, 60).replace(/^@/, ""),
      instagramUrl: clean(args.instagramUrl, 300),
    };
    if (!next.name) throw new ConvexError("The studio needs a name.");
    if (next.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next.email)) {
      throw new ConvexError("That email address does not look right.");
    }
    if (next.instagramUrl && !/^https:\/\//.test(next.instagramUrl)) {
      throw new ConvexError("The Instagram link should start with https://");
    }

    const existing = await ctx.db.query("settings").first();
    if (existing) {
      await ctx.db.patch(existing._id, next);
      return existing._id;
    }
    return await ctx.db.insert("settings", next);
  },
});
