import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Photographs uploaded from the studio desk are served from Convex storage.
    remotePatterns: [
      { protocol: "https", hostname: "**.convex.cloud" },
      { protocol: "https", hostname: "**.convex.site" },
    ],
    formats: ["image/avif", "image/webp"],
    // Next 16 only serves qualities on this list (the default is [75]); any
    // other value is coerced to the nearest one. Three tiers: 70 thumbnails and
    // insets, 80 standard photographs, 85 full-bleed heroes and plates.
    qualities: [70, 80, 85],
  },
};

export default nextConfig;
