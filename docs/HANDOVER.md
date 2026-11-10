# Handover — what is real, what needs replacing

Read this before the site is shown publicly.

---

## 1. Where every image, film and model came from

| Source | Where | Status |
|---|---|---|
| **The studio's own renders** | `public/media/client/` | Real work, cut from the Instagram posts the client supplied (1080 px wide). Two are day/evening pairs used by the lamp switch: the boho family living room and the guest bath with the petal pendant. **Ask the studio for the original exports** — they will be sharper everywhere. |
| **Stock photography** | `public/media/stock/` | Unsplash, used under the Unsplash License. Photographers are listed in `src/lib/media-credits.json` and credited at the bottom of `/studio`. |
| Earlier screenshots | `public/media/*.jpg` | From the first Drive folder. No longer referenced by the site; safe to delete once the studio has its originals. |

**The house page is retired.** It showed a 3D apartment, a stock walkthrough film and two clips taken from Instagram — none of it the studio's own work, and the studio did not want it. The page, its parts and 31.5 MB of film and 3D assets were removed (commit history keeps them, so it can all come back). Two licence questions went with it: the Vecteezy film and the rights to the Instagram clips.

If a film is ever wanted again:

```bash
node scripts/extract-film-frames.mjs path/to/video.mp4 public/film/walkthrough --fps 30 --width 1600 --portrait 720
```

`--fps` is the video's own frame rate, so every output frame is a distinct source frame (add `--every 2` for 60 fps footage; `--crop top,right,bottom,left` trims a border). The script prints the frame count and size. The player that drew these films (`useFrameSequence`, with `FilmScroll` and `BuildDuo`) was removed with the page; it is in the history if it is needed again.

## 2. Placeholder projects — must not go live as they are

Seven projects are built from stock photography purely to show the range of spaces the studio designs. Each is marked `placeholder: true` in `src/lib/seed.ts`:

- Villa Obsidian
- Atelier Headquarters
- Maison Noir
- Serein Penthouse
- The Grand Reception
- Serenity Clinic & Spa
- Aurum Boutique

Their titles, locations, areas and statements are invented. **Publishing them as Iconic's work would be misleading.** Before launch, replace each with a real project from the studio desk (`/admin` → Projects) or delete it. As soon as one project is published in Convex, the seed set stops being used entirely.

The four real projects — Modern Boho Residence, Warm Minimal Guest Bath, Stone Bathrooms, Kitchens — use the studio's own renders. Their titles and descriptions were written from the images and need the studio's confirmation.

## 3. Other content to confirm

| What | Where | Status |
|---|---|---|
| Real project titles and statements | `src/lib/seed.ts` | Written from the renders — confirm |
| Home page figures | `src/app/(site)/page.tsx` | Counted from the content (projects, disciplines, sectors, reviews), so they stay true as content changes |
| Services and FAQ copy | `src/lib/practice.ts`, `src/app/(site)/services/page.tsx` | General, no prices or promises — confirm the wording |
| Phone, WhatsApp, address, map and links | `/admin` → Settings | Real — from the studio's Linktree and its Google Maps listing. There is no public email yet: add one in Settings and it appears on the contact page and in the footer |

The five reviews are real Facebook recommendations (English verbatim; Arabic shown as written with an English rendering the studio should check).

## 4. Scrolling

Scrolling is the browser's own. There is no smooth-scroll library, nothing changes scroll speed, nothing scrolls the page by itself, and nothing holds the page any more — the one section that did, the 3D process, went with the house page. The project reel on the home page is a strip you swipe, drag or move with its arrows.

The earlier complaints — "sometimes too fast, sometimes too slow" and "I can't move freely" — came from a smooth-scroll library and from sections that held the screen while their animation played (the old walkthrough, the pinned project reel, the sticky film sections). All of them are gone. The header's background blur and a blended grain overlay were also removed, because both cost a full repaint on every scroll frame.

Check it any time with the dev server running:

```bash
node scripts/scroll-test.mjs
```

At handover every page passed: each wheel notch moves the page exactly one notch, the page height never changes while scrolling, and there is zero drift after the wheel stops.


## 5. The studio desk

`/admin`, backed by Convex. Nothing on it is public.

- **Accounts.** The desk only signs people in; there is no sign-up on the site. Each account is made with `node scripts/create-desk-account.mjs`, which asks for the password at the prompt so it is never typed into a public page, passed as an argument or kept in this repository. Only addresses in `ADMIN_EMAILS` can have one, the list is checked on every request, and removing an address locks that person out at once, even mid-session.
- **Overview** shows what each public section is running on — the studio's own records ("Live") or still sample content — what needs attention (photographs without a description; published projects, spreads or rooms missing the photograph they need), and the latest enquiries.
- **Photographs** is the library everything draws from: search, filters, where each photograph is used, and its **evening version** — the same view rendered after dark, which gives the photograph its lamp switch wherever it appears. Deleting a photograph takes it out of every project, spread and room first.
- **Projects, Reviews and Monograph** edit what their pages show, in order. A project needs at least one photograph and a spread its plate; until then each stays off the site. A saved project goes live straight away; switch it to Draft to keep it off.
- **Settings** holds the studio's name, phone, WhatsApp number, address, Google Maps link, Instagram and other links. The Enquiries and Rooms screens are gone: the contact form and the house page were retired and nothing used them.

Every save reports whether it worked, and the editors ask before discarding unsaved changes.

**Where it runs.** Convex project `iconic-studio` in Ahmed Fawzy's team, with two deployments:

| | Deployment | `SITE_URL` |
|---|---|---|
| Live site | `tremendous-walrus-53` (production) | `https://iconic-architecture.vercel.app` |
| Local | `flippant-hornet-899` (dev, URLs in `.env.local`) | `http://localhost:3000` |

Both carry their own sign-in keys (`JWT_PRIVATE_KEY`, `JWKS`) and their own `ADMIN_EMAILS`, and both hold the full content — the import was run against each.

**Nobody has an account yet.** Creating one means choosing a password, which only a person can do. `ADMIN_EMAILS` currently allows a single placeholder address, `desk@iconic-studio.local`, so the desk can be opened once and looked at; replace it with the studio's real addresses:

```bash
CONVEX_DEPLOYMENT=prod:tremendous-walrus-53 npx convex env set ADMIN_EMAILS "ahmed@…,studio@…"
```

Then make each person an account, with them at the keyboard for the password:

```bash
node scripts/create-desk-account.mjs --prod
```

After that they sign in at <https://iconic-architecture.vercel.app/admin> with that address and password.

## 6. Before launch

- [x] The studio's own projects are on the site, so the seven stock-photo placeholders never show — they only stand in while nothing is published
- [ ] The monograph still runs on the imported sample spreads, so the book shows that stock work. Curate the spreads at `/admin` → Monograph, then print the PDF again (`node scripts/build-monograph-pdf.mjs`)
- [ ] Keep the full-size exports of the studio's renders somewhere safe. The desk uploads a web copy of each (1920px WebP), not the original
- [ ] Confirm project titles, descriptions and the services copy
- [x] Real phone, WhatsApp, address, map and links in `/admin` → Settings — add an email there if the studio wants one on the site
- [ ] Add the studio's domain in Vercel, set `NEXT_PUBLIC_SITE_URL` there and `SITE_URL` on production Convex to match, and add an OG image
- [ ] `ADMIN_EMAILS` with the studio's addresses on the production deployment, then `node scripts/create-desk-account.mjs --prod` for each person
- [ ] Run `node scripts/scroll-test.mjs` and `npm run build`

## 7. Getting the content in

The site's seed content — projects, monograph spreads, reviews and settings — has been imported into Convex, so it is all editable at `/admin`. The photographs were uploaded from `public/media`; the records were rebuilt from `src/lib/seed.ts`.

```bash
node scripts/import-seed.mjs            # into the dev deployment
node scripts/import-seed.mjs --prod     # into production
node scripts/import-seed.mjs --replace  # clear what is there and import again
```

Without `--replace` the import stops rather than writing over rows that already exist. The seven stock-photo projects keep their **Stock placeholder** marker in the desk, so they can still be found and replaced before launch.

## 8. Known limitations

- **Where it is deployed.** The site is on Vercel (project `iconic-studio`, <https://iconic-architecture.vercel.app>), built from <https://github.com/MohameddDahman/iconic-studio>. `npx vercel deploy --prod` publishes again from this folder.
- **Convex free plan: 1 GB of file storage.** Photographs are resized in the browser on upload, to 1920px on the long edge at WebP quality 78, so a photograph is usually 100-400 KB. The desk's Photographs screen lists what each one costs. The desk is tested end to end on a throwaway local Convex backend, never with the live account.
- **Password resets go through the developer.** There is no email provider, so for a forgotten password delete that person's row in `authAccounts` in the Convex dashboard, then run `node scripts/create-desk-account.mjs` for them again.
- **The seed content's evening pairs stay in code.** Photographs uploaded at `/admin` get their evening version there; the seed set's pairs are still declared in `src/lib/seed.ts`.
- **The monograph PDF is a snapshot.** Request a copy on `/monograph` hands out `public/monograph/iconic-volume-i.pdf`, printed from the book's own pages (at `/monograph/print`, which nothing links to) so it matches the site page for page. It does not follow edits by itself: after changing the monograph or its projects at `/admin`, run `node scripts/build-monograph-pdf.mjs` and deploy. For now it includes the seven stock-photo placeholder projects, like the book on the site.
- **Weight.** The heavy assets went with the house page: 31.5 MB of film frames and 3D models. What is left is photography, which Next serves resized and in modern formats, and the 4 MB monograph PDF, which only downloads when a visitor asks for a copy.
- **No test suite** beyond type-checking, linting, `scripts/scroll-test.mjs` and the screenshot scripts.
