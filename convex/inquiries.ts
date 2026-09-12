import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireStudio, now } from "./lib";

const MAX = { name: 120, email: 200, subject: 160, space: 80, message: 4000, budget: 60 };

const trimTo = (s: string, n: number) => s.trim().slice(0, n);

/** Public — the contact form writes here. */
export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.string(),
    space: v.optional(v.string()),
    message: v.string(),
    budget: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = trimTo(args.name, MAX.name);
    const email = trimTo(args.email, MAX.email);
    const message = trimTo(args.message, MAX.message);

    if (!name || !message) throw new Error("Name and message are required.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("That email address is not valid.");

    await ctx.db.insert("inquiries", {
      name,
      email,
      subject: trimTo(args.subject, MAX.subject) || "Enquiry",
      space: args.space ? trimTo(args.space, MAX.space) || undefined : undefined,
      message,
      budget: args.budget ? trimTo(args.budget, MAX.budget) : undefined,
      handled: false,
      createdAt: now(),
    });
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    return await ctx.db.query("inquiries").withIndex("by_created").order("desc").take(200);
  },
});

/** How many enquiries are still waiting for a reply — the badge in the desk's menu. */
export const waiting = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const recent = await ctx.db.query("inquiries").withIndex("by_created").order("desc").take(200);
    return recent.filter((enquiry) => !enquiry.handled).length;
  },
});

export const setHandled = mutation({
  args: { id: v.id("inquiries"), handled: v.boolean() },
  handler: async (ctx, { id, handled }) => {
    await requireStudio(ctx);
    await ctx.db.patch(id, { handled });
  },
});

export const remove = mutation({
  args: { id: v.id("inquiries") },
  handler: async (ctx, { id }) => {
    await requireStudio(ctx);
    await ctx.db.delete(id);
  },
});
