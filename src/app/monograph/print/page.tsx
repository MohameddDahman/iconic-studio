import type { Metadata } from "next";
import { SheetContent } from "@/components/site/BookVolume";
import { buildBook, yearsOf } from "@/lib/book";
import { getProjects, getSettings, getSpreads } from "@/lib/content";
import { STUDIO } from "@/lib/routes";

// Each refresh reads Convex, so five minutes keeps a busy day inside the free allowance.
export const revalidate = 300;

export const metadata: Metadata = {
  // Printed into the PDF as its title.
  title: { absolute: `${STUDIO.name} — Volume I` },
  robots: { index: false, follow: false },
};

/**
 * Every page of the monograph laid flat, in order, at the flipbook's own size.
 * Nothing links here: scripts/build-monograph-pdf.mjs prints it into the PDF
 * copy the monograph page hands out.
 */
export default async function MonographPrintPage() {
  const [spreads, projects, settings] = await Promise.all([getSpreads(), getProjects(), getSettings()]);
  const pages = buildBook(spreads, projects, settings);
  const years = yearsOf(pages);

  return (
    <main id="main" className="book-print">
      {pages.map((page, i) => (
        <div key={page.id} className="book-print-sheet">
          <SheetContent
            page={page}
            side={i % 2 === 1 ? "left" : "right"}
            eager
            studio={settings.name}
            years={years}
          />
        </div>
      ))}
    </main>
  );
}
