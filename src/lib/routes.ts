/**
 * The site map. `sheet` is the two-digit index shown in the navigation, the
 * footer and the page transition.
 */
export type SheetKey =
  | "home"
  | "projects"
  | "services"
  | "inside"
  | "monograph"
  | "studio"
  | "reviews"
  | "contact";

export interface Sheet {
  key: SheetKey;
  href: string;
  label: string;
  sheet: string;
  title: string;
}

export const SHEETS: Sheet[] = [
  { key: "home", href: "/", label: "Home", sheet: "00", title: "Iconic" },
  { key: "projects", href: "/projects", label: "Projects", sheet: "01", title: "Selected projects" },
  { key: "services", href: "/services", label: "Services", sheet: "02", title: "What we design" },
  { key: "inside", href: "/inside", label: "The House", sheet: "03", title: "Walk through the house" },
  { key: "monograph", href: "/monograph", label: "Monograph", sheet: "04", title: "The book" },
  { key: "studio", href: "/studio", label: "Studio", sheet: "05", title: "The studio" },
  { key: "reviews", href: "/reviews", label: "Reviews", sheet: "06", title: "Client reviews" },
  { key: "contact", href: "/contact", label: "Contact", sheet: "07", title: "Start a project" },
];

/** The nav omits home — the wordmark already goes there. */
export const NAV_SHEETS = SHEETS.filter((s) => s.key !== "home");

const byHref = new Map(SHEETS.map((s) => [s.href, s]));

export function sheetForPath(pathname: string): Sheet {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const exact = byHref.get(clean);
  if (exact) return exact;
  if (clean.startsWith("/projects/")) {
    return { key: "projects", href: clean, label: "Project", sheet: "01", title: "Case study" };
  }
  if (clean.startsWith("/admin")) {
    return { key: "studio", href: clean, label: "Studio desk", sheet: "—", title: "Administration" };
  }
  return { key: "home", href: clean, label: "Iconic", sheet: "00", title: "Iconic" };
}

export const STUDIO = {
  name: "Iconic",
  legalName: "Iconic Architecture Design",
  tagline: "Architecture design, landscape and interior",
  principal: "Eng. Ahmed Fawzy",
  instagram: "iconic_architecture_design",
  instagramUrl: "https://instagram.com/iconic_architecture_design",
} as const;
