import type { MetadataRoute } from "next";
import { getProjects } from "@/lib/content";
import { SHEETS, SITE_URL } from "@/lib/routes";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const projects = await getProjects();
  return [
    ...SHEETS.map((sheet) => ({ url: `${SITE_URL}${sheet.href === "/" ? "" : sheet.href}` })),
    ...projects.map((project) => ({ url: `${SITE_URL}/projects/${project.slug}` })),
  ];
}
