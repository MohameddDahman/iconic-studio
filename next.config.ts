import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site's first address. It forwards to the current one, temporarily,
  // because that is itself a stand-in until the studio has its own domain.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "iconic-studio-six.vercel.app" }],
        destination: "https://iconic-architecture.vercel.app/:path*",
        permanent: false,
      },
    ];
  },
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
