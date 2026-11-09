import type { Metadata, Viewport } from "next";
import { fontClassNames } from "@/lib/fonts";
import { SITE_URL, STUDIO } from "@/lib/routes";
import ScrollSync from "@/components/motion/ScrollSync";
import "./globals.css";

const description =
  "Iconic is an architecture, landscape and interior design studio in Alexandria that also builds what it draws — apartments and villas taken from the empty shell through drawings, joinery, lighting and site to finished rooms.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${STUDIO.name} — ${STUDIO.tagline}`,
    template: `%s — ${STUDIO.name}`,
  },
  description,
  openGraph: {
    type: "website",
    siteName: STUDIO.name,
    title: `${STUDIO.name} — ${STUDIO.tagline}`,
    description,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#16110d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-surface="day" className={fontClassNames}>
      <head>
        {/* If JS never runs, nothing that JS was going to reveal may stay hidden. */}
        <noscript>
          <style>{`.split-heading{visibility:visible !important}`}</style>
        </noscript>
      </head>
      <body>
        <a
          href="#main"
          className="annotation fixed top-3 left-3 z-[300] -translate-y-24 bg-night px-4 py-3 text-bone transition-transform focus-visible:translate-y-0 print:hidden"
        >
          Skip to content
        </a>

        <ScrollSync />

        {children}
      </body>
    </html>
  );
}
