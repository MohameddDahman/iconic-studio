# Iconic — studio site

Portfolio and studio CMS for **Iconic Architecture Design**, an interior design, decor and execution studio in Alexandria.

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind v4 · Convex · GSAP · three.js

- Design rationale: [`docs/DESIGN-DIRECTION.md`](docs/DESIGN-DIRECTION.md)
- Handover notes, image sources and outstanding items: [`docs/HANDOVER.md`](docs/HANDOVER.md)

---

## Running it

```bash
npm install
npm run dev
```

The site runs immediately with no backend. Until Convex is connected it renders the seed content in `src/lib/seed.ts`, so every page is complete from the first run. Read `docs/HANDOVER.md` before publishing — part of the seed content is placeholder.

## Connecting the backend

The studio desk at `/admin` runs on Convex: project `iconic-studio` in Ahmed Fawzy's team, dev deployment `flippant-hornet-899`. On a new machine, log in to that team and connect:

```bash
npx convex dev
```

That pushes the functions, regenerates `convex/_generated/`, and writes the deployment's URLs into `.env.local`.

The dev deployment already has the sign-in keys (`JWT_PRIVATE_KEY`, `JWKS`), `SITE_URL` and `ADMIN_EMAILS` — the addresses that may sign in to the desk. There is no public sign-up. To change who has access:

```bash
npx convex env set ADMIN_EMAILS "ahmed@example.com,studio@example.com"
```

`/admin` only signs people in — there is no sign-up on the site, so nobody who finds the page can claim an address. Accounts are made from here, and the person types their own password at the prompt:

```bash
node scripts/create-desk-account.mjs            # the dev deployment
node scripts/create-desk-account.mjs --prod     # the live site
```

The address has to be in `ADMIN_EMAILS` already; anything else is refused before a row is written. Taking an address off the list locks it out immediately, even mid-session.

The production deployment is `tremendous-walrus-53`, with its own keys, `ADMIN_EMAILS` and `SITE_URL`. To push the functions to it:

```bash
CONVEX_DEPLOYMENT=prod:tremendous-walrus-53 npx convex deploy
```

## Where it is deployed

| | |
|---|---|
| Repository | <https://github.com/MohameddDahman/iconic-studio> (private) |
| Site | <https://iconic-architecture.vercel.app> — Vercel project `iconic-studio`. The first address, iconic-studio-six.vercel.app, forwards here |
| Backend | Convex `tremendous-walrus-53` (production) and `flippant-hornet-899` (dev) |

Vercel holds `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_CONVEX_SITE_URL` on all three environments; the pages are built against production Convex. Deploy again with:

```bash
npx vercel deploy --prod
```

When the studio has its own domain: add it in Vercel, set `NEXT_PUBLIC_SITE_URL` there (it is what `metadataBase` uses for canonical and social URLs), and set `SITE_URL` on the production Convex deployment to match.

## How the content works

Each collection falls back independently:

| Collection | Falls back to | Stops falling back when |
|---|---|---|
| Projects | `SEED_PROJECTS` | one project is published |
| Reviews | `SEED_TESTIMONIALS` | one review is published |
| Monograph spreads | `SEED_SPREADS` | one spread is published |
| Studio details | `SEED_SETTINGS` | settings are saved once |

Public pages are server-rendered from Convex over HTTP and revalidate every 60 seconds. Only `/admin` uses the reactive client.

## The pages

| Route | What is on it |
|---|---|
| `/` | The studio logo and slogan over a film-title hero reel, studio statement, services index, day/evening lamp showcase, a swipeable project strip, process, monograph |
| `/projects` | Portfolio with sector filters (animated with GSAP Flip) and a grid/list view |
| `/projects/[slug]` | Case study: hero (with the lamp switch when the project has evening renders), facts, statement, a grid of square thumbnails that open a full-screen viewer |
| `/services` | Every discipline in full, process, questions |
| `/monograph` | The work as a book with page-turn animation, and the same book as a PDF to keep |
| `/reviews` | Every client recommendation, Arabic as written with an English reading beneath |
| `/studio`, `/contact` | The studio, principles, process, credits; phone, WhatsApp, address with a map, and every link the studio keeps online |

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build (type-checks as it goes) |
| `node scripts/build-media-manifest.mjs` | Reads every image under `public/media` (subfolders included), records intrinsic sizes and bakes blur placeholders into `src/lib/media-manifest.json`. Run after adding images. |
| `node scripts/scroll-test.mjs [base] [routes…]` | Wheel-scroll test: each notch must move the page exactly one notch, with no height changes and no drift |
| `node scripts/create-desk-account.mjs [--prod]` | Makes a studio desk account for an allowed address, asking for the password at the prompt. The site has no sign-up. |
| `node scripts/build-monograph-pdf.mjs [base]` | Prints the monograph, page for page, into `public/monograph/iconic-volume-i.pdf`, the copy behind the monograph page's Request a copy. Prints from the live site unless given a base URL. Run it after changing the monograph or its projects, then deploy |
| `node scripts/import-seed.mjs [--prod] [--replace]` | Uploads the bundled photographs to Convex and rebuilds the seed projects, spreads, reviews and settings there, so the studio desk can edit them |
| `node scripts/extract-film-frames.mjs <video> <out> [--fps] [--every] [--width] [--end] [--crop] [--portrait]` | Turns a video into a silent WebP frame sequence for a scroll film (decoded by Edge, no ffmpeg needed). Nothing uses it at the moment — the films went with the house page — but it is how a film would be prepared |
| `node scripts/shots.mjs [--mobile] [--full]` | Screenshots every route into `.shots/` |
| `node scripts/shot-scroll.mjs <route> <depths…>` | Screenshots one route at given scroll depths |
| `node scripts/patch-overlays.mjs <dir>` | Clones out Instagram UI overlays from images recovered from screenshots |
| `node scripts/extract-from-screenshots.mjs <in> <out>` | Pulls the photograph out of a phone screenshot |

## Layout of the code

```
convex/              schema, queries, mutations, password auth (allowlisted)
public/
  media/client/      the studio's own renders (incl. day/evening pairs)
  media/stock/       licensed photography (credits in src/lib/media-credits.json)
  brand/             the studio logo, its mark and the word on its own
src/app/
  layout.tsx         html, fonts, scroll sync, route transitions
  (site)/            the public site — header, footer, pages
  admin/             the studio desk — no site chrome
src/components/
  motion/            route transitions, headings, reveals, frame sequences
  chrome/            header, footer
  site/              page sections, lamp switch, films, book
  admin/             the desk
src/lib/             types, content layer, seed content, practice data, lights store
```

## Accessibility and behaviour

- Scrolling is native: no smooth-scroll library, no speed changes, nothing scrolls the page on its own, and nothing pins or holds the page. Scroll-linked effects play while their section crosses the screen.
- Every timeline is authored inside `gsap.matchMedia()`; under `prefers-reduced-motion` the final state is shown instead of the movement.
- The lamp switch is a real `aria-pressed` toggle; the films and the 3D stages carry their chapter text as `sr-only` lists.
- Route changes announce the destination and move focus into `#main`. Links are real anchors.
- The site is complete without JavaScript — a `noscript` rule reveals anything that script would have revealed.
