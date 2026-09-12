import { ConvexError } from "convex/values";
import { auth } from "./auth";
import { isStudioEmail } from "./access";
import type { MutationCtx, QueryCtx } from "./_generated/server";

/**
 * Every read and write from the studio desk goes through this. Being signed in
 * is not enough: the account's address has to still be on ADMIN_EMAILS.
 */
export async function requireStudio(ctx: QueryCtx | MutationCtx) {
  const userId = await auth.getUserId(ctx);
  if (!userId) throw new ConvexError("Not signed in.");
  const user = await ctx.db.get(userId);
  if (!isStudioEmail(user?.email)) {
    throw new ConvexError("This account no longer has access to the studio desk.");
  }
  return userId;
}

export const now = () => Date.now();

/** Trimmed, and capped at a length the site's layouts can hold. */
export const clean = (value: string, max = 4000) => value.trim().slice(0, max);

export function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
