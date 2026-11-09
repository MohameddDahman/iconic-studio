import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/routes";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/monograph/print"] },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
