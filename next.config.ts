import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The site's first address. It forwards to the current one, temporarily,
  // because that is itself a stand-in until the studio has its own domain.
  async redirects() {
    return [
      // The house page is retired; its work lives in the portfolio.
      {
        source: "/inside",
        destination: "/projects",
        permanent: false,
      },
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
    // WebP alone: AVIF is a little smaller but far slower to make, and on a
    // small site most visitors arrive before a copy has been cached.
    formats: ["image/webp"],
    // Few widths, so each copy is made once and used often. The photographs
    // themselves are no wider than 2048.
    deviceSizes: [640, 828, 1200, 1600, 2048],
    imageSizes: [128, 256, 384],
    // A file in Convex storage never changes at the same address.
    minimumCacheTTL: 2678400,
    // Next 16 only serves qualities on this list (the default is [75]); any
    // other value is coerced to the nearest one. Three tiers: 70 thumbnails and
    // insets, 80 standard photographs, 85 full-bleed heroes and plates.
    qualities: [70, 80, 85],
  },
};

export default nextConfig;
