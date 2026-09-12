# Handover — what is real, what needs replacing

Read this before the site is shown publicly.

---

## 1. Where every image, film and model came from

| Source | Where | Status |
|---|---|---|
| **The studio's own renders** | `public/media/client/` | Real work, cut from the Instagram posts the client supplied (1080 px wide). Two are day/evening pairs used by the lamp switch: the boho family living room and the guest bath with the petal pendant. **Ask the studio for the original exports** — they will be sharper everywhere. |
| **Stock photography** | `public/media/stock/` | Unsplash, used under the Unsplash License. Photographers are listed in `src/lib/media-credits.json` and credited at the bottom of `/studio`. |
| Earlier screenshots | `public/media/*.jpg` | From the first Drive folder. No longer referenced by the site; safe to delete once the studio has its originals. |
| **Walkthrough film** | `public/film/landscape`, `public/film/portrait`, `public/film/poster.webp` | From Vecteezy (`vecteezy_modern-open-concept-apartment-interior-design-with-living_72006478.mp4`). **Confirm the licence it was downloaded under allows use on a commercial website, and add attribution if that licence requires it.** |
| **"Shell to styled" clips** | `public/film/bedroom`, `public/film/living` | Downloaded from Instagram (SnapInsta). **The rights to these belong to their creators — get permission or replace them with the studio's own clips before launch.** The living-room clip ended on a promotional caption ("Comment AI RENDER…"); the sequence stops at 5.15 s so it is never shown. |
| **3D house** | `public/house/` | Poly Haven models, textures and HDRI, CC0 (no attribution required). Listed in `public/house/CREDITS.json`. |

Every film on the site is a silent WebP frame sequence — there is no audio anywhere. The walkthrough uses every second frame of its 60 fps source (238 frames at 1600 × 900, plus a 720 × 1280 set for phones). The two build clips use every frame of their 30 fps sources: the bedroom 212 frames at 540 × 960, and the living room 153 frames at 640 × 458, with the clip's thin black border cropped off.

To replace a film with the studio's own:

```bash
node scripts/extract-film-frames.mjs path/to/video.mp4 public/film/walkthrough --fps 30 --width 1600 --portrait 720
```

`--fps` is the video's own frame rate, so every output frame is a distinct source frame (add `--every 2` for 60 fps footage; `--crop top,right,bottom,left` trims a border). The script prints the frame count and size — point the `FilmScroll` / `BuildDuo` props in `src/app/(site)/inside/page.tsx` at the new folder, count and size.

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
| Walkthrough room notes | `SEED_THRESHOLDS` | Illustrative — they describe the rooms of the 3D house |
| Home page figures | `src/app/(site)/page.tsx` | Counted from the content (projects, disciplines, sectors, reviews), so they stay true as content changes |
| Services and FAQ copy | `src/lib/practice.ts`, `src/app/(site)/services/page.tsx` | General, no prices or promises — confirm the wording |
| Email, phone, address | `SEED_SETTINGS` / `/admin` → Settings | Placeholders |

The five reviews are real Facebook recommendations (English verbatim; Arabic shown as written with an English rendering the studio should check).

## 4. Scrolling

Scrolling is the browser's own. There is no smooth-scroll library, nothing changes scroll speed, and nothing scrolls the page by itself. One section holds deliberately: the 3D process at `/inside` is three screens tall and keeps its drawing in view (`position: sticky`) while the model plays its three stages, then releases — the studio asked for that, so the stages are not missed. The page still moves exactly as far as the wheel or the finger asks. The 3D process and the films play while their section passes across the screen — the page keeps moving the whole time — and the project reel on the home page is a strip you swipe, drag or move with its arrows.

The earlier complaints — "sometimes too fast, sometimes too slow" and "I can't move freely" — came from a smooth-scroll library and from sections that held the screen while their animation played (the old walkthrough, the pinned project reel, the sticky film sections). All of them are gone. The header's background blur and a blended grain overlay were also removed, because both cost a full repaint on every scroll frame.

Check it any time with the dev server running:

```bash
node scripts/scroll-test.mjs
```

At handover every page passed: each wheel notch moves the page exactly one notch, the page height never changes while scrolling, and there is zero drift after the wheel stops.

The films follow the scroll without costing it frames. One decoder, shared by all three films, works off the main thread on the frames about to be shown — the current one and a few ahead in the direction of travel — with the film on screen first. Decoded frames sit in a small cache that is freed while the browser is idle, each film paints in the same animation frame as the scroll that moved it, and on a slow scroll neighbouring frames dissolve into each other instead of stepping. Measured at the development laptop's size (1507 × 733 at 125%, Edge on its own GPU), the film sections hold 60 fps — 16.7 ms a frame on average, with no frame over 25 ms — where the previous player dropped roughly one frame in five.

## 5. The 3D house

`src/components/house/` — three.js, loaded only when the section approaches.

- `plan.ts` — the apartment in metres (walls, openings, room labels). It is an illustrative layout, not a client project.
- `engine.ts` — the scene, furniture placement, lighting, the three stages and the lamp.
- `furniture.ts` — procedural sofa, bed, kitchen, island, chairs and architecture.
- `look.ts` — the shared clay / drawing / finished material behaviour.

The words sit in a title block beside the drawing — above it on a phone — so the model never runs under text; within its own area the model drifts toward the part that is on screen. The canvas is transparent and the section paints the ground colour, so the title block and the drawing always match exactly, in daylight, on the dark drawing and in the evening.

It is built to stay light: it renders only when the scroll position or the lamp changes, furniture is merged into a handful of draw calls, shadows are drawn only when the model changes shape, and the evening lights are switched off entirely in daylight. Ambient occlusion (at half resolution) and anti-aliasing run only on a wide screen with the power connected; phones and laptops on battery get a lighter path, and the model drops its post-processing and resolution on its own if frames slow. With reduced motion, or if WebGL is unavailable, a static drawing and the three stage descriptions are shown instead. A still render is saved at `public/house/poster.webp`.

## 6. The studio desk

`/admin`, backed by Convex. Nothing on it is public.

- **Accounts.** Only the addresses in `ADMIN_EMAILS` can use it. The first time, each person chooses **Set up your account** and picks a password of at least 10 characters; after that they sign in. The list is checked on every request, so removing an address locks that person out at once, even mid-session.
- **Overview** shows what each public section is running on — the studio's own records ("Live") or still the seed content — what needs attention (photographs without a description; published projects, spreads or rooms missing the photograph they need), and the latest enquiries.
- **Photographs** is the library everything draws from: search, filters, where each photograph is used, and its **evening version** — the same view rendered after dark, which gives the photograph its lamp switch wherever it appears. Deleting a photograph takes it out of every project, spread and room first.
- **Projects, Reviews, Monograph and Rooms** edit what their pages show, in order. A published project needs at least one photograph, a spread its plate and a room its photograph; until then each stays off the site, and the desk says so.
- **Enquiries** collects the contact form, with waiting and answered views and a reply-by-email link. **Settings** holds the studio's name, contact details and Instagram.

Every save reports whether it worked, and the editors ask before discarding unsaved changes.

**Where it runs.** Convex project `iconic-studio` in Ahmed Fawzy's team. The dev deployment is `brave-toucan-31`; its URLs are in `.env.local`. It has the sign-in keys (`JWT_PRIVATE_KEY`, `JWKS`), `SITE_URL` (`http://localhost:3000`) and `ADMIN_EMAILS`, which for now allows one login address, `desk@iconic-studio.local` — replace it with the studio's addresses. For the live site, run `npx convex deploy` and set the same four variables on the production deployment, with fresh keys and `SITE_URL` as the real domain.

## 7. Before launch

- [ ] Replace or delete the seven placeholder projects
- [ ] Get original exports of the studio's renders and upload them at `/admin`
- [ ] Confirm the Vecteezy licence, and the rights to the two Instagram clips (or replace them)
- [ ] Confirm project titles, descriptions and the services copy
- [ ] Real email, phone and studio address in `/admin` → Settings
- [ ] Point `metadataBase` in `src/app/layout.tsx` at the real domain and add an OG image
- [ ] `npx convex env set ADMIN_EMAILS "…"` with the studio's addresses; each person then opens `/admin` once and chooses **Set up your account**
- [ ] `npx convex deploy`, then set `ADMIN_EMAILS`, `JWT_PRIVATE_KEY`, `JWKS` and `SITE_URL` on the production deployment
- [ ] Run `node scripts/scroll-test.mjs` and `npm run build`

## 8. Getting the content in

The site's seed content — projects, rooms, monograph spreads, reviews and settings — has been imported into Convex, so it is all editable at `/admin`. The photographs were uploaded from `public/media`; the records were rebuilt from `src/lib/seed.ts`.

```bash
node scripts/import-seed.mjs            # into the dev deployment
node scripts/import-seed.mjs --prod     # into production
node scripts/import-seed.mjs --replace  # clear what is there and import again
```

Without `--replace` the import stops rather than writing over rows that already exist. The seven stock-photo projects keep their **Stock placeholder** marker in the desk, so they can still be found and replaced before launch.

## 9. Known limitations

- **`convex/_generated/` is hand-written.** Convex codegen needs an interactive login. The first `npx convex dev` replaces these files with the real ones.
- **The signed-in desk has not had a first run yet.** The functions are deployed to the dev deployment and the public side answers, but saving, uploading and deleting need a signed-in account, which only a person can set up. After setting the password, add a test project with a photograph, give a photograph an evening version, and delete both.
- **Password resets go through the developer.** There is no email provider, so for a forgotten password delete that person's row in `authAccounts` in the Convex dashboard; they then set the account up again at `/admin`.
- **The seed content's evening pairs stay in code.** Photographs uploaded at `/admin` get their evening version there; the seed set's pairs are still declared in `src/lib/seed.ts`.
- **Weight.** The film frames total about 21 MB on disk, but a visitor downloads one walkthrough set — 9.1 MB on a computer, 5.3 MB on a phone — plus 6.7 MB for the two build clips, and only every second frame when the browser asks to save data or the connection is slow. The 3D assets are about 13 MB (including a 1.6 MB lighting HDRI). Both load only when their section comes near, and the films load coarse frames first.
- **No test suite** beyond type-checking, linting, `scripts/scroll-test.mjs` and the screenshot scripts.
