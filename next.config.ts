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
    // Photographs are prepared ahead of time as plain files in three widths, so
    // no image service resizes anything and nothing counts against a quota.
    loader: "custom",
    loaderFile: "./src/lib/image-loader.ts",
    deviceSizes: [640, 828, 1200, 1600, 1920],
    imageSizes: [128, 256, 384],
    qualities: [60, 72, 80],
  },
};

export default nextConfig;
