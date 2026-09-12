# Iconic — Design Direction (v3)

**Iconic Architecture Design** — interior design, decor and execution, Cairo.
Principal: Eng. Ahmed Fawzy. Instagram: `iconic_architecture_design`.

The studio designs every kind of interior — apartments, villas, penthouses,
offices, restaurants, hotel lobbies, boutiques and clinics — and builds them
with its own site team.

Audience: people about to hand a shell and a budget to a studio, and the
businesses fitting out a workplace or a venue. The site's single job: **make
Iconic look like the safe, expensive choice — and show the work in a way no
other studio's site does.**

---

## 1. What changed from v2, and why

v2 ("Drawn in light") was built around the reflected ceiling plan, sheet
numbers and drawing-set conventions. The client's feedback was direct: it did
not look professional enough, the images were not good enough, and the effects
were not advanced enough. v3 keeps what worked — warm materials, light as the
subject, real drawings — and changes everything else:

| v2 | v3 |
|---|---|
| Drawing-sheet metaphor everywhere (ID-000, datums) | A calm gallery layout; drawings appear only where they explain something |
| Low-resolution screenshots as the main imagery | Full-resolution photography, plus the studio's own renders where they are strongest |
| Fraunces + Archivo | Instrument Serif + Mona Sans |
| Room-by-room pinned walkthrough | A 3D model, scroll films and a day/evening lamp switch |
| Smooth-scroll library | The browser's own scrolling, untouched |

## 2. The direction — "Gallery"

Dark, cinematic sections carry the photography; warm paper sections carry the
reading. One brass accent, used sparingly. Big serif headlines with an italic
turn; small, tracked grotesk labels; generous space.

The rhythm alternates `data-surface="night"` and `data-surface="day"` sections
so long pages never feel like one colour, and the header takes the colours of
whichever section is beneath it.

## 3. Signature moments

1. **The lamp switch.** The studio renders key rooms twice — by daylight and
   after dark. A drawn pendant-lamp button switches every paired image on the
   page at once; the evening render is revealed through a circle that grows out
   of the room's own light. It is the clearest possible way to show that the
   lighting is designed.
2. **The process model** (`/inside`). An apartment as a white clay model that
   sinks into its own plan — walls, door swings, furniture and dimensions
   drawing themselves — and rises again in real finishes: herringbone oak,
   bouclé, linen, walnut, marble. The lamp switch turns it to evening.
3. **Scroll films.** A walkthrough, and two empty rooms that finish themselves,
   played by the scroll position as their sections pass across the screen.
4. **The monograph.** The work as a real book, turned page by page.

## 4. Palette

| Token | Hex | Use |
|---|---|---|
| `--color-night` | `#0F0E0D` | Base dark surface |
| `--color-umber` | `#181715` | Raised surfaces on dark |
| `--color-plaster` | `#F1EDE6` | Base light surface — warm paper |
| `--color-bone` | `#F7F4EE` | Type on dark, lightest surface |
| `--color-glow` | `#C9A878` | Brass — the accent on dark |
| `--color-ember` | `#7D5F39` | Bronze — the accent on paper (5:1 on plaster) |
| `--color-blueprint` | `#0C2136` | Drawing sheets |

## 5. Typography

| Role | Face | Why |
|---|---|---|
| Display | **Instrument Serif** (roman + italic) | Sharp, slightly condensed; set large and tight it reads editorial rather than decorative. The italic carries the accent words |
| Text / UI | **Mona Sans** (`wght`, `wdth`) | A grotesk with a real width axis: body at normal width, labels slightly expanded so they read as set type |
| Technical | **Geist Mono** | Dimensions, references, counters |
| Arabic | **IBM Plex Sans Arabic** | Reviews written in Arabic are shown in Arabic, right to left, with the English beneath |

## 6. Motion

- **Scrolling is never altered.** No smooth-scroll library, no speed changes,
  and nothing pins or holds the page. Effects tied to scroll play while their
  section crosses the screen; the page keeps moving the whole time.
- **Arrivals play once.** Headlines rise line by line, photographs are
  uncovered from an edge, figures count up — then stay put, costing nothing
  while the page scrolls.
- **Route changes** — two panels rise through the frame carrying the
  destination's name; a clicked project photograph grows into the case study's
  hero instead.
- **Reduced motion** — every timeline lives inside `gsap.matchMedia()`; the
  films become posters and the 3D model becomes a static drawing.

## 7. Performance rules

- The 3D model loads only when its section is near, renders only when something
  changes, merges its furniture into a handful of draw calls, and draws shadows
  only when the model changes shape. It runs a lighter path on phones and on
  battery, and steps down on its own if frames slow.
- Films are WebP frame sequences of distinct source frames, loaded coarse-to-fine.
  One decoder shared by every film works off the main thread on the frames about
  to be shown — the current one and a few ahead in the direction of travel — with
  the film on screen first. Decoded frames sit in a small cache, freed during idle
  time. A film paints in the same animation frame as the scroll that moved it, and
  only when its picture changes.
- No backdrop blur and no blend-mode overlays on anything that sits over a
  scrolling page.

## 8. Route map

| Route | Job |
|---|---|
| `/` | The reel, the studio in one sentence, what we design, day & evening, selected work, the house, process, reviews, the book |
| `/projects` | The portfolio, filterable by sector |
| `/projects/[slug]` | Case study |
| `/services` | Every discipline, the process, questions |
| `/inside` | The house — model, films, rooms by day and after dark |
| `/monograph` | The book |
| `/studio` | Principal, principles, process, reviews, credits |
| `/contact` | Enquiry |
| `/admin` | Studio desk |

## 9. Imagery rules

- The studio's own renders are the real work and are credited as such.
- Stock photography only illustrates project types and is marked as
  placeholder in the seed data — see `docs/HANDOVER.md`. It must not go live
  presented as the studio's work.
- Never pass a render off as a photograph: every project carries its stage.
