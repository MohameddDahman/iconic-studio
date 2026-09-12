import { query } from "./_generated/server";
import { auth } from "./auth";
import { isStudioEmail } from "./access";
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

const needsDescription = (alt: string) => !alt.trim() || /\.(jpe?g|png|webp|avif)$/i.test(alt);

/**
 * Everything the overview shows, in one query. "On the site" counts what the
 * public pages actually use: published, and with the photograph each needs.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requireStudio(ctx);
    const [projects, media, reviews, spreads, rooms, enquiries, settings] = await Promise.all([
      ctx.db.query("projects").collect(),
      ctx.db.query("media").collect(),
      ctx.db.query("testimonials").collect(),
      ctx.db.query("spreads").collect(),
      ctx.db.query("thresholds").collect(),
      ctx.db.query("inquiries").withIndex("by_created").order("desc").take(200),
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
      rooms: {
        total: rooms.length,
        onSite: rooms.filter((r) => r.published && r.mediaId).length,
        withoutPhoto: rooms.filter((r) => r.published && !r.mediaId).length,
      },
      enquiries: {
        total: enquiries.length,
        waiting: enquiries.filter((e) => !e.handled).length,
        latest: enquiries.slice(0, 5).map((e) => ({
          _id: e._id,
          name: e.name,
          subject: e.subject,
          space: e.space,
          handled: e.handled,
          createdAt: e.createdAt,
        })),
      },
      settingsSaved: settings !== null,
    };
  },
});
