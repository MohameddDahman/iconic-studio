import type { MetadataRoute } from "next";
import { getProjects, getVideos } from "@/lib/content";
import { SHEETS, SITE_URL } from "@/lib/routes";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, videos] = await Promise.all([getProjects(), getVideos()]);
  return [
    ...SHEETS.filter((sheet) => sheet.key !== "videos" || videos.length > 0).map((sheet) => ({
      url: `${SITE_URL}${sheet.href === "/" ? "" : sheet.href}`,
    })),
    ...projects.map((project) => ({ url: `${SITE_URL}/projects/${project.slug}` })),
  ];
}
