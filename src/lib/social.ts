import type { StudioSettings } from "./types";

export type SocialPlatform =
  | "instagram"
  | "facebook"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "behance"
  | "pinterest"
  | "x"
  | "threads"
  | "snapchat";

export interface SocialProfile {
  platform: SocialPlatform;
  /** The platform's own name, for the link's label. */
  name: string;
  url: string;
}

const PLATFORMS: { platform: SocialPlatform; name: string; host: RegExp }[] = [
  { platform: "instagram", name: "Instagram", host: /(^|\.)instagram\.com$/ },
  { platform: "facebook", name: "Facebook", host: /(^|\.)(facebook\.com|fb\.com|fb\.me)$/ },
  { platform: "tiktok", name: "TikTok", host: /(^|\.)tiktok\.com$/ },
  { platform: "youtube", name: "YouTube", host: /(^|\.)(youtube\.com|youtu\.be)$/ },
  { platform: "linkedin", name: "LinkedIn", host: /(^|\.)linkedin\.com$/ },
  { platform: "behance", name: "Behance", host: /(^|\.)behance\.net$/ },
  { platform: "pinterest", name: "Pinterest", host: /(^|\.)(pinterest\.[a-z.]+|pin\.it)$/ },
  { platform: "x", name: "X", host: /(^|\.)(x\.com|twitter\.com)$/ },
  { platform: "threads", name: "Threads", host: /(^|\.)threads\.(net|com)$/ },
  { platform: "snapchat", name: "Snapchat", host: /(^|\.)snapchat\.com$/ },
];

function platformOf(url: string) {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return PLATFORMS.find((p) => p.host.test(host)) ?? null;
  } catch {
    return null;
  }
}

/**
 * The studio's social profiles, as icons can show them: Instagram first, then
 * the desk's links in the order it lists them, each platform once. Links that
 * are not a profile — the Google review link — stay in the footer and on the
 * contact page.
 */
export function socialProfiles(settings: Pick<StudioSettings, "instagramUrl" | "links">): SocialProfile[] {
  const seen = new Set<SocialPlatform>();
  const profiles: SocialProfile[] = [];
  for (const url of [settings.instagramUrl, ...settings.links.map((link) => link.url)]) {
    const match = url ? platformOf(url) : null;
    if (!match || seen.has(match.platform)) continue;
    seen.add(match.platform);
    profiles.push({ platform: match.platform, name: match.name, url });
  }
  return profiles;
}
