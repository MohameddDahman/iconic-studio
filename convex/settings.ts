import { ConvexError, v, type ObjectType } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { clean, requireStudio } from "./lib";

/** There is only ever one settings row. */
export const get = query({
  args: {},
  handler: async (ctx) => await ctx.db.query("settings").first(),
});

const contactFields = {
  email: v.string(),
  phone: v.string(),
  whatsapp: v.optional(v.string()),
  address: v.array(v.string()),
  instagram: v.string(),
  instagramUrl: v.string(),
  mapUrl: v.optional(v.string()),
  links: v.optional(v.array(v.object({ label: v.string(), url: v.string() }))),
};

const secure = (url: string) => /^https:\/\//.test(url);

/** How the studio is reached, tidied and checked the same way wherever it is saved from. */
function contact(args: ObjectType<typeof contactFields>) {
  const next = {
    email: clean(args.email, 200),
    phone: clean(args.phone, 60),
    whatsapp: clean(args.whatsapp ?? "", 60),
    address: args.address.map((line) => clean(line, 120)).filter(Boolean),
    instagram: clean(args.instagram, 60).replace(/^@/, ""),
    instagramUrl: clean(args.instagramUrl, 300),
    mapUrl: clean(args.mapUrl ?? "", 500),
    links: (args.links ?? [])
      .map((link) => ({ label: clean(link.label, 60), url: clean(link.url, 500) }))
      .filter((link) => link.label || link.url),
  };

  if (next.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(next.email)) {
    throw new ConvexError("That email address does not look right.");
  }
  const digits = next.whatsapp.replace(/\D/g, "").length;
  if (next.whatsapp && (digits < 8 || digits > 15)) {
    throw new ConvexError("Give the WhatsApp number in full, with the country code — like +20 155 913 0844.");
  }
  if (next.instagramUrl && !secure(next.instagramUrl)) {
    throw new ConvexError("The Instagram link should start with https://");
  }
  if (next.mapUrl && !secure(next.mapUrl)) {
    throw new ConvexError("The map link should start with https://");
  }
  for (const link of next.links) {
    if (!link.label) throw new ConvexError("Every link needs a name, like Facebook.");
    if (!secure(link.url)) throw new ConvexError(`The ${link.label} link should start with https://`);
  }
  return next;
}

export const save = mutation({
  args: { name: v.string(), tagline: v.string(), intro: v.string(), ...contactFields },
  handler: async (ctx, { name, tagline, intro, ...rest }) => {
    await requireStudio(ctx);
    const next = {
      name: clean(name, 80),
      tagline: clean(tagline, 160),
      intro: clean(intro, 600),
      ...contact(rest),
    };
    if (!next.name) throw new ConvexError("The studio needs a name.");

    const existing = await ctx.db.query("settings").first();
    if (existing) {
      await ctx.db.patch(existing._id, next);
      return existing._id;
    }
    return await ctx.db.insert("settings", next);
  },
});

/**
 * Only how the studio is reached — the name, tagline and introduction are left
 * alone. Internal, so only the CLI can call it:
 *   npx convex run settings:setContact '{ … }' [--prod]
 */
export const setContact = internalMutation({
  args: contactFields,
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("settings").first();
    if (!existing) throw new ConvexError("There are no settings yet. Save them once from the desk first.");
    await ctx.db.patch(existing._id, contact(args));
    return existing._id;
  },
});
