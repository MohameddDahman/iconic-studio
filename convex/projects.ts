import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { internalMutation } from "./_generated/server";
import { projectStage, typology } from "./schema";
import { resolveMediaId, resolveMediaIds } from "./media";
import { clean, now, requireStudio, slugify } from "./lib";

async function shape(ctx: QueryCtx, doc: Doc<"projects">) {
  const [cover, gallery] = await Promise.all([
    resolveMediaId(ctx, doc.coverId),
    resolveMediaIds(ctx, doc.galleryIds),
  ]);
  return {
    _id: doc._id,
    slug: doc.slug,
    title: doc.title,
    reference: doc.reference,
    year: doc.year,
    location: doc.location,
    typology: doc.typology,
    stage: doc.stage,
    brief: doc.brief,
    statement: doc.statement,
    materials: doc.materials,
    facts: doc.facts,
    featured: doc.featured,
    published: doc.published,
    placeholder: doc.placeholder,
    order: doc.order,
    cover,
    gallery,
  };
}

/** Everything the public site is allowed to see. */
export const listPublished = query({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db
      .query("projects")
      .withIndex("by_published_order", (q) => q.eq("published", true))
      .collect();
    docs.sort((a, b) => a.order - b.order);
    return Promise.all(docs.map((d) => shape(ctx, d)));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const doc = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!doc || !doc.published) return null;
    return shape(ctx, doc);
  },
});

/** Drafts included — studio desk only. */
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const docs = await ctx.db.query("projects").withIndex("by_order").collect();
    docs.sort((a, b) => a.order - b.order);
    return Promise.all(docs.map((d) => shape(ctx, d)));
  },
});

export const getById = query({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireStudio(ctx);
    const doc = await ctx.db.get(id);
    return doc ? shape(ctx, doc) : null;
  },
});

/** Titles and slugs, for the project pickers on the other desks. */
export const options = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const docs = await ctx.db.query("projects").withIndex("by_order").collect();
    docs.sort((a, b) => a.order - b.order);
    return docs.map((d) => ({ slug: d.slug, title: d.title, published: d.published }));
  },
});

const projectFields = {
  title: v.string(),
  slug: v.optional(v.string()),
  reference: v.string(),
  year: v.number(),
  location: v.string(),
  typology,
  stage: projectStage,
  brief: v.string(),
  statement: v.array(v.string()),
  materials: v.array(v.string()),
  facts: v.array(v.object({ label: v.string(), value: v.string() })),
  coverId: v.optional(v.id("media")),
  galleryIds: v.array(v.id("media")),
  featured: v.boolean(),
  published: v.boolean(),
  placeholder: v.optional(v.boolean()),
};

interface ProjectText {
  title: string;
  reference: string;
  location: string;
  brief: string;
  statement: string[];
  materials: string[];
  facts: { label: string; value: string }[];
}

/** Trimmed, capped and checked before anything is written. */
function tidy<T extends ProjectText>(args: T): T {
  const title = clean(args.title, 160);
  if (!title) throw new ConvexError("A project needs a title.");
  return {
    ...args,
    title,
    reference: clean(args.reference, 40),
    location: clean(args.location, 120),
    brief: clean(args.brief, 240),
    statement: args.statement.map((paragraph) => clean(paragraph)).filter(Boolean),
    materials: args.materials.map((material) => clean(material, 160)).filter(Boolean),
    facts: args.facts
      .map((fact) => ({ label: clean(fact.label, 40), value: clean(fact.value, 80) }))
      .filter((fact) => fact.label && fact.value),
  };
}

/** Slugs are the public URL, so they have to stay unique. */
async function uniqueSlug(ctx: QueryCtx, desired: string, ignoreId?: string) {
  const base = slugify(desired) || "project";
  let candidate = base;
  let n = 2;
  for (;;) {
    const clash = await ctx.db
      .query("projects")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .unique();
    if (!clash || clash._id === ignoreId) return candidate;
    candidate = base + "-" + n++;
  }
}

export const create = mutation({
  args: projectFields,
  handler: async (ctx, raw) => {
    await requireStudio(ctx);
    const { slug: desired, ...rest } = tidy(raw);
    const last = await ctx.db.query("projects").withIndex("by_order").order("desc").first();
    const slug = await uniqueSlug(ctx, desired || rest.title);
    return await ctx.db.insert("projects", {
      ...rest,
      slug,
      order: (last?.order ?? 0) + 1,
      updatedAt: now(),
    });
  },
});

export const update = mutation({
  args: { id: v.id("projects"), ...projectFields },
  handler: async (ctx, { id, ...raw }) => {
    await requireStudio(ctx);
    if (!(await ctx.db.get(id))) throw new ConvexError("That project no longer exists.");
    const { slug: desired, ...rest } = tidy(raw);
    const slug = await uniqueSlug(ctx, desired || rest.title, id);
    await ctx.db.patch(id, { ...rest, slug, updatedAt: now() });
  },
});

export const setPublished = mutation({
  args: { id: v.id("projects"), published: v.boolean() },
  handler: async (ctx, { id, published }) => {
    await requireStudio(ctx);
    await ctx.db.patch(id, { published, updatedAt: now() });
  },
});

export const remove = mutation({
  args: { id: v.id("projects") },
  handler: async (ctx, { id }) => {
    await requireStudio(ctx);
    await ctx.db.delete(id);
  },
});

/** The register sends the whole new order at once. */
export const reorder = mutation({
  args: { ids: v.array(v.id("projects")) },
  handler: async (ctx, { ids }) => {
    await requireStudio(ctx);
    await Promise.all(
      ids.map((id, index) => ctx.db.patch(id, { order: index + 1, updatedAt: now() })),
    );
  },
});

/**
 * Put every draft that has a photograph on the site.
 *
 * Projects used to be created as drafts, so the first ones the studio
 * uploaded never appeared and the site kept showing the sample content. This
 * clears that in one go. Internal, so only the CLI may run it:
 *   npx convex run projects:publishDrafts --prod
 */
export const publishDrafts = internalMutation({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("projects").collect();
    const published = [];
    const waiting = [];
    for (const row of rows) {
      if (row.published) continue;
      // Without a photograph a project would be on the site and still not
      // show. The site takes the first of the gallery when there is no cover,
      // so that counts here too.
      if (!row.coverId && (row.galleryIds ?? []).length === 0) {
        waiting.push(row.title);
        continue;
      }
      await ctx.db.patch(row._id, { published: true, updatedAt: now() });
      published.push(row.title);
    }
    return { published, needAPhotograph: waiting };
  },
});
