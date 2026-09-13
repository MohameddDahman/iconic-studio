import type { Media, Project, Spread, StudioSettings } from "./types";

/**
 * Volume I, as a sequence of physical pages.
 *
 * The flipbook needs a flat list of pages, but the content is edited as
 * spreads (at /admin → Monograph) and projects. This turns one into the other
 * the way a book designer would impose it:
 *
 *   cover
 *   contents | foreword
 *   opener   | plate           ← one per spread
 *   plate    | gallery grid    ← only when the linked project has the photographs
 *   colophon | endpaper
 *   back cover
 *
 * Every block adds an even number of pages, so openers always land on a left
 * page and the back cover always lands alone — which is what the flipbook needs
 * to close the volume properly. Folios follow print convention: left pages
 * even, right pages odd.
 */

export interface ContentsEntry {
  number: number;
  title: string;
  kicker: string;
  folio: number;
}

type Interior<T> = T & { id: string; folio: number };

export type BookPage =
  | { kind: "cover"; id: string }
  | Interior<{ kind: "contents"; entries: ContentsEntry[] }>
  | Interior<{ kind: "foreword"; intro: string }>
  | Interior<{ kind: "opener"; number: number; spread: Spread; project?: Project }>
  | Interior<{ kind: "plate"; media: Media; caption?: string; side: "left" | "right" }>
  | Interior<{ kind: "grid"; title: string; images: Media[]; notes: string[] }>
  | Interior<{ kind: "colophon"; name: string }>
  | Interior<{ kind: "endpaper" }>
  | { kind: "back"; id: string };

/** Distinct photographs, in order, leaving out any already on the page. */
function distinct(media: (Media | undefined)[], exclude: Media[]) {
  const seen = new Set(exclude.map((m) => m.src));
  const out: Media[] = [];
  for (const m of media) {
    if (!m || seen.has(m.src)) continue;
    seen.add(m.src);
    out.push(m);
  }
  return out;
}

export function buildBook(
  spreads: Spread[],
  projects: Project[],
  settings: StudioSettings,
): BookPage[] {
  const bySlug = new Map(projects.map((p) => [p.slug, p]));
  const entries: ContentsEntry[] = [];

  // Folios are filled in once the final order is known.
  const pages: BookPage[] = [
    { kind: "cover", id: "cover" },
    { kind: "contents", id: "contents", folio: 0, entries },
    { kind: "foreword", id: "foreword", folio: 0, intro: settings.intro },
  ];

  spreads.forEach((spread, i) => {
    const project = spread.projectSlug ? bySlug.get(spread.projectSlug) : undefined;

    entries.push({
      number: i + 1,
      title: spread.title,
      kicker: spread.kicker,
      folio: pages.length + 1,
    });

    pages.push(
      { kind: "opener", id: `opener-${spread.id}`, folio: 0, number: i + 1, spread, project },
      {
        kind: "plate",
        id: `plate-${spread.id}`,
        folio: 0,
        media: spread.media,
        caption: spread.title,
        side: "right",
      },
    );

    // A second spread only when there is enough photography to fill it well —
    // a gallery spread with one lonely image reads as padding.
    const more = distinct([spread.mediaB, ...(project?.gallery ?? [])], [spread.media]);
    if (more.length >= 2) {
      pages.push(
        {
          kind: "plate",
          id: `plate-b-${spread.id}`,
          folio: 0,
          media: more[0],
          caption: more[0].caption ?? spread.title,
          side: "left",
        },
        {
          kind: "grid",
          id: `grid-${spread.id}`,
          folio: 0,
          title: spread.title,
          images: more.slice(1, 4),
          notes: project?.materials.slice(0, 4) ?? [],
        },
      );
    }
  });

  pages.push(
    { kind: "colophon", id: "colophon", folio: 0, name: settings.name },
    { kind: "endpaper", id: "endpaper", folio: 0 },
    { kind: "back", id: "back" },
  );

  // Interior page n sits at index n-1 after the cover, so its folio is its
  // index + 1: left pages come out even and right pages odd, as in print.
  pages.forEach((page, index) => {
    if (page.kind !== "cover" && page.kind !== "back") page.folio = index + 1;
  });

  return pages;
}

/** The span of project years in the volume, as the cover and colophon print it. */
export function yearsOf(pages: BookPage[]) {
  const all = pages.flatMap((p) => (p.kind === "opener" && p.project ? [p.project.year] : []));
  if (all.length === 0) return "";
  const lo = Math.min(...all);
  const hi = Math.max(...all);
  return lo === hi ? String(lo) : `${lo} — ${hi}`;
}

/** Which spread a page index belongs to, for "Spread 3 of 9" style status. */
export function spreadOf(pageIndex: number, pageCount: number) {
  if (pageIndex <= 0) return 0;
  if (pageIndex >= pageCount - 1) return Math.ceil((pageCount - 2) / 2) + 1;
  return Math.ceil(pageIndex / 2);
}
