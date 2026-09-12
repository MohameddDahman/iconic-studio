import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export const typology = v.union(
  v.literal("Apartment"),
  v.literal("Villa"),
  v.literal("Duplex"),
  v.literal("Penthouse"),
  v.literal("Chalet"),
  v.literal("Office"),
  v.literal("Hospitality"),
  v.literal("Retail"),
  v.literal("Healthcare"),
  v.literal("Commercial"),
);

/** Iconic designs and executes, so a project's stage is real information. */
export const projectStage = v.union(
  v.literal("Built"),
  v.literal("On site"),
  v.literal("Design stage"),
);

export default defineSchema({
  ...authTables,

  /** Every uploaded file, with the intrinsic size the site needs to reserve space. */
  media: defineTable({
    storageId: v.id("_storage"),
    alt: v.string(),
    caption: v.optional(v.string()),
    width: v.number(),
    height: v.number(),
    blurDataURL: v.optional(v.string()),
    bytes: v.optional(v.number()),
    contentType: v.optional(v.string()),
    /**
     * The same view rendered after dark. Wherever the photograph appears, the
     * site adds a lamp switch that reveals this one.
     */
    nightId: v.optional(v.id("media")),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),

  projects: defineTable({
    slug: v.string(),
    title: v.string(),
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
    /** Built from stock photography to show a project type — replace or remove before launch. */
    placeholder: v.optional(v.boolean()),
    order: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["order"])
    .index("by_published_order", ["published", "order"]),

  testimonials: defineTable({
    quote: v.string(),
    author: v.string(),
    role: v.string(),
    /** Arabic reviews are shown as written, with a translation beneath. */
    lang: v.optional(v.union(v.literal("en"), v.literal("ar"))),
    translation: v.optional(v.string()),
    source: v.optional(v.string()),
    date: v.optional(v.string()),
    projectSlug: v.optional(v.string()),
    published: v.boolean(),
    order: v.number(),
  }).index("by_published_order", ["published", "order"]),

  /** Spreads in the bound volume at /monograph. */
  spreads: defineTable({
    folio: v.number(),
    kicker: v.string(),
    title: v.string(),
    body: v.string(),
    mediaId: v.optional(v.id("media")),
    mediaBId: v.optional(v.id("media")),
    projectSlug: v.optional(v.string()),
    published: v.boolean(),
    order: v.number(),
  }).index("by_published_order", ["published", "order"]),

  /** The rooms listed at /inside, in order. */
  thresholds: defineTable({
    room: v.string(),
    ceiling: v.string(),
    note: v.string(),
    mediaId: v.optional(v.id("media")),
    /** Position on the first walkthrough's ceiling plan. No longer edited or shown. */
    planX: v.optional(v.number()),
    planY: v.optional(v.number()),
    published: v.boolean(),
    order: v.number(),
  }).index("by_published_order", ["published", "order"]),

  /** Singleton — there is only ever one row, fetched with .first(). */
  settings: defineTable({
    name: v.string(),
    tagline: v.string(),
    intro: v.string(),
    email: v.string(),
    phone: v.string(),
    address: v.array(v.string()),
    instagram: v.string(),
    instagramUrl: v.string(),
  }),

  inquiries: defineTable({
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    /** The kind of space, picked on the contact form. */
    space: v.optional(v.string()),
    message: v.string(),
    budget: v.optional(v.string()),
    handled: v.boolean(),
    createdAt: v.number(),
  }).index("by_created", ["createdAt"]),
});
