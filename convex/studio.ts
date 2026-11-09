import { query } from "./_generated/server";
import { auth } from "./auth";
import { isStudioEmail, studioEmails } from "./access";
import { requireStudio } from "./lib";

/**
 * Who is signed in to the desk, and whether their address is still allowed.
 * It never throws, so the desk can explain a lost permission instead of failing.
 */
export const viewer = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) return null;
    const user = await ctx.db.get(userId);
    return { email: user?.email ?? "", allowed: isStudioEmail(user?.email) };
  },
});

/**
 * Whether the desk still has no account at all. While that is true — and only
 * then — /admin offers to set the first password, because there is otherwise no
 * way in. The moment an account exists this turns false for good and the page
 * is sign-in only. The address is returned only while that is true, so the first
 * run can fill it in; afterwards this tells a stranger nothing.
 */
export const firstRun = query({
  args: {},
  handler: async (ctx) => {
    const allowed = studioEmails();
    const existing = await ctx.db.query("users").take(1);
    const needed = existing.length === 0 && allowed.length > 0;
    return { needed, email: needed && allowed.length === 1 ? allowed[0] : "" };
  },
});

const needsDescription = (alt: string) => !/\p{L}/u.test(alt) || /\.(jpe?g|png|webp|avif)$/i.test(alt);

/**
 * Everything the overview shows, in one query. "On the site" counts what the
 * public pages actually use: published, and with the photograph each needs.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const [projects, media, reviews, spreads, settings] = await Promise.all([
      ctx.db.query("projects").collect(),
      ctx.db.query("media").collect(),
      ctx.db.query("testimonials").collect(),
      ctx.db.query("spreads").collect(),
      ctx.db.query("settings").first(),
    ]);

    return {
      projects: {
        total: projects.length,
        onSite: projects.filter((p) => p.published && (p.coverId || p.galleryIds.length > 0)).length,
        drafts: projects.filter((p) => !p.published).length,
        withoutPhotos: projects.filter((p) => p.published && !p.coverId && p.galleryIds.length === 0).length,
      },
      media: {
        total: media.length,
        evening: media.filter((m) => m.nightId).length,
        needsDescription: media.filter((m) => needsDescription(m.alt)).length,
      },
      reviews: {
        total: reviews.length,
        onSite: reviews.filter((r) => r.published).length,
      },
      spreads: {
        total: spreads.length,
        onSite: spreads.filter((s) => s.published && s.mediaId).length,
        withoutPlate: spreads.filter((s) => s.published && !s.mediaId).length,
      },
      settingsSaved: settings !== null,
    };
  },
});
