"use client";

import Image from "next/image";
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { useGSAP } from "@gsap/react";
import type { Orientation, PageFlip } from "page-flip";
import TransitionLink from "@/components/motion/TransitionLink";
import { gsap, ScrollTrigger, prefersReducedMotion } from "@/lib/gsap";
import { STUDIO } from "@/lib/routes";
import { cn } from "@/lib/utils";
import { yearsOf, type BookPage } from "@/lib/book";
import type { Media } from "@/lib/types";

/**
 * Page proportion in page-flip's units — 240 × 307 mm, a portfolio page. The
 * book scales to fit its column, so only the ratio matters.
 */
const PAGE_W = 500;
const PAGE_H = 640;

const pad = (n: number, width = 3) => String(n).padStart(width, "0");

const noopSubscribe = () => () => {};
const useIsClient = () =>
  useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

/*
 * Type inside a page is sized in container units, so it scales with the page
 * rather than the window. The minimums are set for a single page on a phone,
 * where the page is the whole reading surface and has to be legible.
 */
const T = {
  micro: "text-[clamp(0.56rem,1.8cqw,0.66rem)]",
  label: "text-[clamp(0.6rem,2cqw,0.72rem)]",
  small: "text-[clamp(0.64rem,2.1cqw,0.76rem)]",
  body: "text-[clamp(0.72rem,2.55cqw,0.9rem)]",
  lead: "text-[clamp(1.05rem,5.2cqw,1.8rem)]",
  title: "text-[clamp(1.5rem,8cqw,2.9rem)]",
  numeral: "text-[clamp(1.9rem,11cqw,3.8rem)]",
};

type Side = "left" | "right";
type Of<K extends BookPage["kind"]> = Extract<BookPage, { kind: K }>;

function folioOf(page?: BookPage) {
  return page && "folio" in page ? page.folio : undefined;
}

function mediaOf(page?: BookPage): Media | undefined {
  if (!page) return undefined;
  if (page.kind === "plate") return page.media;
  if (page.kind === "grid") return page.images[0];
  if (page.kind === "opener") return page.spread.media;
  return undefined;
}

function titleOf(page?: BookPage) {
  if (!page) return undefined;
  switch (page.kind) {
    case "contents":
      return "Contents";
    case "foreword":
      return "Foreword";
    case "opener":
      return page.spread.title;
    case "plate":
      return page.caption;
    case "grid":
      return page.title;
    case "colophon":
      return "Colophon";
    default:
      return undefined;
  }
}

/* ---- Paper, boards, and the furniture every page shares ------------------ */

function Paper({ children }: { children: ReactNode }) {
  return (
    <div className="book-paper @container relative h-full w-full overflow-hidden text-night">
      {children}
      <span aria-hidden="true" className="book-gutter" />
    </div>
  );
}

function Board({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("@container relative h-full w-full overflow-hidden bg-night text-bone", className)}>
      <span
        aria-hidden="true"
        className="book-glow absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(224,177,114,0.2),transparent_70%)]"
      />
      <span aria-hidden="true" className="absolute inset-[5cqw] border border-bone/10" />
      {children}
      <span aria-hidden="true" className="book-gutter" />
    </div>
  );
}

function Folio({ n, side, onDark = false }: { n: number; side: Side; onDark?: boolean }) {
  return (
    <span
      className={cn(
        "annotation absolute bottom-[4.5cqw] z-20 tabular-nums",
        T.micro,
        side === "left" ? "left-[5.5cqw]" : "right-[5.5cqw]",
        onDark ? "text-bone/55" : "text-night/45",
      )}
    >
      {pad(n)}
    </span>
  );
}

function Photo({
  media,
  sizes,
  eager,
  quality = 72,
  className,
}: {
  media: Media;
  sizes: string;
  eager: boolean;
  quality?: 60 | 72 | 80;
  className?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-plaster-2", className)}>
      <Image
        src={media.src}
        alt=""
        fill
        sizes={sizes}
        quality={quality}
        // Hidden pages are display:none, so a lazy image would only start
        // loading as its page is uncovered — mid-turn. Pages near the reader
        // load ahead instead.
        loading={eager ? "eager" : "lazy"}
        placeholder={media.blurDataURL ? "blur" : "empty"}
        blurDataURL={media.blurDataURL}
        className="object-cover"
      />
    </div>
  );
}

/* ---- The pages ------------------------------------------------------------ */

function CoverSheet({ studio, years }: { studio: string; years: string }) {
  return (
    <Board className="book-cover-lift">
      <div className="relative flex h-full flex-col items-center justify-between px-[9cqw] py-[13cqw] text-center">
        <p className={cn("annotation text-glow", T.label)}>Volume I</p>
        <div>
          <p className="book-foil inked pl-[0.3em] text-[clamp(2rem,12.5cqw,4.4rem)] leading-none font-light tracking-[0.3em] uppercase">
            {studio}
          </p>
          <span aria-hidden="true" className="mx-auto mt-[6cqw] block h-px w-[20cqw] bg-glow/70" />
          <p className={cn("condensed mt-[6cqw] tracking-[0.3em] text-bone/75 uppercase", T.body)}>
            Interiors{years ? ` · ${years}` : ""}
          </p>
        </div>
        <p className={cn("annotation text-bone/45", T.micro)}>{STUDIO.legalName} · Alexandria</p>
      </div>
    </Board>
  );
}

function BackSheet({ studio }: { studio: string }) {
  return (
    <Board>
      <div className="relative flex h-full flex-col items-center justify-center gap-[5cqw] px-[9cqw] text-center">
        <p className="book-foil inked pl-[0.3em] text-[clamp(1.2rem,6cqw,2rem)] leading-none font-light tracking-[0.3em] uppercase">
          {studio}
        </p>
        <span aria-hidden="true" className="block h-px w-[12cqw] bg-glow/60" />
        <p className={cn("annotation text-bone/50", T.micro)}>@{STUDIO.instagram}</p>
      </div>
    </Board>
  );
}

function ContentsSheet({ page, side }: { page: Of<"contents">; side: Side }) {
  return (
    <Paper>
      <div className="flex h-full flex-col px-[9cqw] pt-[11cqw] pb-[12cqw]">
        <p className={cn("annotation text-ember", T.label)}>Volume I</p>
        <h3 className={cn("inked mt-[3cqw] leading-none font-light", T.title)}>Contents</h3>
        <ol className="mt-[7cqw] flex flex-col">
          {page.entries.map((entry) => (
            <li
              key={entry.number}
              className="flex items-baseline gap-[2.5cqw] border-b border-night/15 py-[2.4cqw]"
            >
              <span className={cn("annotation text-ember", T.micro)}>{pad(entry.number, 2)}</span>
              <span className="min-w-0 flex-1">
                <span className="inked block text-[clamp(0.95rem,4cqw,1.35rem)] leading-tight font-light">
                  {entry.title}
                </span>
                <span className={cn("annotation mt-[0.9cqw] block text-night/50 @max-sm:hidden", T.micro)}>
                  {entry.kicker}
                </span>
              </span>
              <span className={cn("annotation tabular-nums", T.micro)}>{pad(entry.folio)}</span>
            </li>
          ))}
        </ol>
      </div>
      <Folio n={page.folio} side={side} />
    </Paper>
  );
}

function ForewordSheet({ page, side }: { page: Of<"foreword">; side: Side }) {
  return (
    <Paper>
      <div className="flex h-full flex-col justify-between px-[9cqw] pt-[11cqw] pb-[14cqw]">
        <p className={cn("annotation text-ember", T.label)}>Foreword</p>
        <p className={cn("inked leading-[1.2] font-light text-balance", T.lead)}>{page.intro}</p>
        <div className="border-t border-night/15 pt-[3cqw]">
          <p className={cn("condensed font-medium tracking-wide uppercase", T.body)}>
            {STUDIO.principal}
          </p>
          <p className={cn("annotation mt-[1.2cqw] text-night/50", T.micro)}>Principal</p>
        </div>
      </div>
      <Folio n={page.folio} side={side} />
    </Paper>
  );
}

/** Project opener: a dark index strip on the fore-edge, the text beside it. */
function OpenerSheet({ page, side, eager }: { page: Of<"opener">; side: Side; eager: boolean }) {
  const { spread, project } = page;
  const inset = spread.mediaB ?? project?.gallery[0];
  const facts = project?.facts.slice(0, 3) ?? [];
  const meta: [string, string][] = project
    ? [
        ["Year", String(project.year)],
        ["Type", project.typology],
        ["Location", project.location],
        ["Stage", project.stage],
      ]
    : [];

  return (
    <Paper>
      <div className="grid h-full grid-cols-[25%_1fr]">
        <aside className="relative flex flex-col justify-between gap-[4cqw] bg-night px-[3.2cqw] pt-[8cqw] pb-[12cqw] text-bone">
          <p className={cn("inked leading-none font-extralight text-bone/90", T.numeral)}>
            {pad(page.number, 2)}
          </p>
          {inset && (
            <Photo
              media={inset}
              sizes="160px"
              eager={eager}
              quality={60}
              className="aspect-[3/4] w-full @max-sm:hidden"
            />
          )}
          <div className="flex flex-col gap-[2.2cqw]">
            <p className={cn("annotation text-glow", T.micro)}>Site index</p>
            <dl className="flex flex-col gap-[1.8cqw]">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className={cn("annotation text-bone/45", T.micro)}>{fact.label}</dt>
                  <dd className={cn("mt-[0.6cqw] text-bone/85 tabular-nums", T.small)}>{fact.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>

        <div className="relative flex min-h-0 flex-col px-[6cqw] pt-[8cqw] pb-[12cqw]">
          <p className={cn("annotation text-ember", T.label)}>{spread.kicker}</p>
          <h3 className={cn("inked mt-[2.5cqw] leading-[0.95] font-light", T.title)}>{spread.title}</h3>

          {meta.length > 0 && (
            <dl className="mt-[5cqw] grid grid-cols-[auto_1fr] gap-x-[3.5cqw] gap-y-[1.4cqw] border-y border-night/15 py-[3cqw]">
              {meta.map(([label, value]) => (
                <Fragment key={label}>
                  <dt className={cn("annotation text-night/45", T.micro)}>{label}</dt>
                  <dd className={T.small}>{value}</dd>
                </Fragment>
              ))}
            </dl>
          )}

          <p className={cn("mt-[4cqw] line-clamp-6 leading-[1.6] text-night/75 @sm:line-clamp-8", T.body)}>
            {spread.body}
          </p>

          {project && project.materials.length > 0 && (
            <div className="mt-auto pt-[4cqw] @max-sm:hidden">
              <p className={cn("annotation text-night/45", T.micro)}>Specified</p>
              <ul className="mt-[1.6cqw] grid grid-cols-2 gap-x-[3cqw] gap-y-[0.9cqw]">
                {project.materials.slice(0, 4).map((material) => (
                  <li key={material} className={cn("leading-snug", T.small)}>
                    {material}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      <Folio n={page.folio} side={side} onDark={side === "left"} />
    </Paper>
  );
}

/** A photograph printed to the trim, with the caption in the margin of the image. */
function PlateSheet({ page, eager }: { page: Of<"plate">; eager: boolean }) {
  return (
    <div className="@container relative h-full w-full overflow-hidden bg-umber">
      <Photo
        media={page.media}
        sizes="(min-width: 900px) 600px, 92vw"
        eager={eager}
        quality={80}
        className="absolute inset-0"
      />
      <span
        aria-hidden="true"
        className="book-shade absolute inset-x-0 bottom-0 h-[26%] bg-gradient-to-t from-night/70 to-transparent"
      />
      <div
        className={cn(
          "book-caption absolute inset-x-[5.5cqw] bottom-[4.5cqw] z-20 flex items-end justify-between gap-[3cqw] text-bone",
          page.side === "left" && "flex-row-reverse",
        )}
      >
        <span className={cn("annotation text-bone/80", T.micro)}>{page.caption}</span>
        <span className={cn("annotation tabular-nums", T.micro)}>{pad(page.folio)}</span>
      </div>
      <span aria-hidden="true" className="book-gutter" />
    </div>
  );
}

/** The detail page: a small grid of photographs, a title bar, the specification. */
function GridSheet({ page, side, eager }: { page: Of<"grid">; side: Side; eager: boolean }) {
  const [a, b, c] = page.images;
  return (
    <Paper>
      <div className="flex h-full flex-col gap-[2.6cqw] px-[6cqw] pt-[6.5cqw] pb-[12cqw]">
        {b ? (
          <div className="grid grid-cols-2 gap-[2.2cqw]">
            <Photo media={a} sizes="(min-width: 900px) 300px, 46vw" eager={eager} className="aspect-[4/3]" />
            <Photo media={b} sizes="(min-width: 900px) 300px, 46vw" eager={eager} className="aspect-[4/3]" />
          </div>
        ) : (
          <Photo media={a} sizes="(min-width: 900px) 600px, 92vw" eager={eager} className="aspect-[4/3]" />
        )}

        {c && <Photo media={c} sizes="(min-width: 900px) 600px, 92vw" eager={eager} className="aspect-[2/1]" />}

        <div className="mt-[1.5cqw]">
          <p className={cn("condensed font-semibold tracking-[0.08em] uppercase", T.body)}>
            {page.title} <span className="text-ember">::</span> Details
          </p>
          <span aria-hidden="true" className="mt-[1.4cqw] block h-[0.9cqw] min-h-[2px] w-[42%] bg-night" />
        </div>

        {page.notes.length > 0 && (
          <ul
            className={cn(
              "grid grid-cols-2 gap-x-[4cqw] gap-y-[1cqw] leading-snug text-night/70 @max-sm:hidden",
              T.small,
            )}
          >
            {page.notes.map((note) => (
              <li key={note}>— {note}</li>
            ))}
          </ul>
        )}
      </div>
      <Folio n={page.folio} side={side} />
    </Paper>
  );
}

function ColophonSheet({ page, side, years }: { page: Of<"colophon">; side: Side; years: string }) {
  const rows = [
    ["Published by", `${STUDIO.legalName}, Alexandria`],
    ["Photography", "The studio's own renders and site photographs"],
    ["Typefaces", "Instrument Serif, Mona Sans, Geist Mono"],
    ["Edition", `Volume I — Interiors${years ? `, ${years}` : ""}`],
  ];
  return (
    <Paper>
      <div className="flex h-full flex-col justify-between px-[9cqw] pt-[11cqw] pb-[14cqw]">
        <div>
          <p className={cn("annotation text-ember", T.label)}>Colophon</p>
          <h3 className={cn("inked mt-[3cqw] leading-none font-light", T.title)}>{page.name}</h3>
        </div>
        <dl className="flex flex-col gap-[2.6cqw]">
          {rows.map(([label, value]) => (
            <div key={label} className="border-t border-night/15 pt-[1.6cqw]">
              <dt className={cn("annotation text-night/45", T.micro)}>{label}</dt>
              <dd className={cn("mt-[0.8cqw]", T.small)}>{value}</dd>
            </div>
          ))}
        </dl>
        <p className={cn("leading-[1.6] text-night/65 @max-sm:hidden", T.small)}>
          A short run of the volume is printed each year. Ask the studio and one will be put aside
          for you.
        </p>
      </div>
      <Folio n={page.folio} side={side} />
    </Paper>
  );
}

function EndpaperSheet({ page, side, studio }: { page: Of<"endpaper">; side: Side; studio: string }) {
  return (
    <Paper>
      <div className="flex h-full items-center justify-center">
        <p
          aria-hidden="true"
          className="inked pl-[0.3em] text-[clamp(1.6rem,12cqw,4rem)] leading-none font-light tracking-[0.3em] text-night/[0.07] uppercase"
        >
          {studio}
        </p>
      </div>
      <Folio n={page.folio} side={side} />
    </Paper>
  );
}

/** One page of the volume, whatever its kind. The PDF copy is printed from these too. */
export function SheetContent({
  page,
  side,
  eager,
  studio,
  years,
}: {
  page: BookPage;
  side: Side;
  eager: boolean;
  studio: string;
  years: string;
}) {
  switch (page.kind) {
    case "cover":
      return <CoverSheet studio={studio} years={years} />;
    case "back":
      return <BackSheet studio={studio} />;
    case "contents":
      return <ContentsSheet page={page} side={side} />;
    case "foreword":
      return <ForewordSheet page={page} side={side} />;
    case "opener":
      return <OpenerSheet page={page} side={side} eager={eager} />;
    case "plate":
      return <PlateSheet page={page} eager={eager} />;
    case "grid":
      return <GridSheet page={page} side={side} eager={eager} />;
    case "colophon":
      return <ColophonSheet page={page} side={side} years={years} />;
    case "endpaper":
      return <EndpaperSheet page={page} side={side} studio={studio} />;
  }
}

/** Page-edge stack: one offset hairline per few sheets, alternating paper tones. */
function stackEdges(depth: number, direction: 1 | -1) {
  if (depth <= 0) return "none";
  return Array.from(
    { length: depth },
    (_, i) => `${direction * (i + 1)}px ${i + 1}px 0 ${i % 2 === 0 ? "#e9e1d4" : "#cfc4b2"}`,
  ).join(", ");
}

type BlockPoint = { x: number; y: number };

/** While a scripted turn runs, page-flip must not see the real pointer. */
function lockPointer() {
  const swallow = (event: Event) => event.stopPropagation();
  const types = ["mousemove", "mouseup", "touchmove", "touchend"];
  types.forEach((type) => window.addEventListener(type, swallow, true));
  return () => types.forEach((type) => window.removeEventListener(type, swallow, true));
}

/**
 * Turn a page the way a hand does.
 *
 * page-flip's flipNext() drags the corner along a straight line at a constant
 * speed, which is exactly what makes a scripted turn look mechanical. This
 * drives the library's own drag primitives instead: the corner lifts off the
 * page and sweeps across in one continuous arc, all the way to where the page
 * lies flat. It is only let go once it has landed, so the library has nothing
 * left to animate and there is no hand-off pause at the end of the turn.
 *
 * Coordinates are page-relative (x = 0 at the spine, positive toward the
 * corner being lifted) and converted to page-flip's block coordinates the same
 * way its Render.convertToGlobal does.
 */
function turnByHand(flip: PageFlip, direction: "next" | "prev", onDone: () => void) {
  const rect = flip.getBoundsRect();
  const forward = direction === "next";
  const pageWidth = rect.pageWidth;
  const toBlock = (x: number, y: number): BlockPoint => ({
    x: forward ? x + rect.left + rect.width / 2 : rect.width / 2 - x + rect.left,
    y: y + rect.top,
  });

  const fromX = pageWidth - 2;
  const toX = -pageWidth;
  const baseY = rect.height - 1;
  const lift = rect.height * 0.14;
  const at = (t: number) =>
    toBlock(fromX + (toX - fromX) * t, baseY - Math.sin(Math.PI * t) * lift);

  const release = lockPointer();
  const state = { t: 0 };

  // page-flip ignores a drag until it has moved 5px from where the touch
  // began. Starting the touch just off the page edge means the very first
  // frame already counts as a drag, so the turn starts without a dead beat.
  flip.startUserTouch(toBlock(fromX + 8, baseY));
  flip.userMove(at(0), false);

  gsap.to(state, {
    t: 1,
    duration: 1,
    ease: "power2.inOut",
    onUpdate: () => flip.userMove(at(state.t), false),
    onComplete: () => {
      flip.userStop(at(1));
      release();
      onDone();
    },
  });
}

/* ---- The volume ------------------------------------------------------------ */

/**
 * Volume I, as an object on a desk.
 *
 * The turn itself is page-flip, which bends a real paper curl with moving
 * shadows. It is a plain DOM library, so it is kept at arm's length from React:
 *
 * - It deletes the element it is given when destroyed, so that element is
 *   created here by hand, inside a div React renders but never fills.
 * - It moves page elements into its own container and clones them mid-turn, so
 *   pages are detached elements React renders into through portals. React owns
 *   what is inside a page; page-flip owns where the page is.
 * - It rewrites every page's inline style each frame but only adds and removes
 *   classes, so everything visual is done with classes — including the gutter
 *   shading, keyed off the --left / --right classes it maintains.
 *
 * Around it: the book rises off the desk as it scrolls into view, sits centred
 * while closed and slides open as the cover swings, and lifts its cover to show
 * it opens until the reader has turned a page.
 */
export default function BookVolume({ pages, studio }: { pages: BookPage[]; studio: string }) {
  const isClient = useIsClient();
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLOListElement>(null);
  const flipRef = useRef<PageFlip | null>(null);
  const handRef = useRef(false);

  const [index, setIndex] = useState(0);
  const [orientation, setOrientation] = useState<Orientation>("landscape");
  const [ready, setReady] = useState(false);
  const [turning, setTurning] = useState(false);
  const [peek, setPeek] = useState(false);
  const [touched, setTouched] = useState(false);

  const count = pages.length;

  const sheets = useMemo(() => {
    if (!isClient) return null;
    return pages.map((page) => {
      const el = document.createElement("div");
      el.className = "book-sheet";
      if (page.kind === "cover" || page.kind === "back") el.dataset.density = "hard";
      return el;
    });
  }, [isClient, pages]);

  const years = useMemo(() => yearsOf(pages), [pages]);

  /** One entry per spread, for the filmstrip. Interior spreads pair [odd, even]. */
  const spreads = useMemo(() => {
    const out: { start: number; label: string; title: string; media?: Media; board?: boolean }[] = [
      { start: 0, label: "Cover", title: "Cover", board: true },
    ];
    for (let i = 1; i < count - 1; i += 2) {
      const a = pages[i];
      const b = pages[i + 1];
      out.push({
        start: i,
        label: pad(folioOf(a) ?? i + 1),
        title: titleOf(a) ?? titleOf(b) ?? "",
        media: mediaOf(b) ?? mediaOf(a),
      });
    }
    out.push({ start: count - 1, label: "Back", title: "Back cover", board: true });
    return out;
  }, [pages, count]);

  /* ---- Mount page-flip ------------------------------------------------- */
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || !sheets) return;

    let cancelled = false;
    let flip: PageFlip | null = null;

    const host = document.createElement("div");
    mount.appendChild(host);

    void import("page-flip").then((mod) => {
      if (cancelled) return;
      // The package's entry is a UMD build; depending on interop the class is
      // either a named export or hangs off the default.
      const Ctor =
        mod.PageFlip ?? (mod as unknown as { default: { PageFlip: typeof mod.PageFlip } }).default.PageFlip;
      const reduced = prefersReducedMotion();

      flip = new Ctor(host, {
        width: PAGE_W,
        height: PAGE_H,
        size: "stretch",
        // Below a 720px-wide column the book shows single pages. The inline
        // min-width this also writes is overridden in globals.css.
        minWidth: 360,
        maxWidth: 600,
        minHeight: 300,
        maxHeight: 900,
        showCover: true,
        usePortrait: true,
        autoSize: true,
        drawShadow: true,
        maxShadowOpacity: 0.85,
        flippingTime: reduced ? 260 : 900,
        showPageCorners: !reduced,
        mobileScrollSupport: true,
        useMouseEvents: true,
        clickEventForward: true,
        swipeDistance: 30,
        startPage: 0,
        startZIndex: 0,
        disableFlipByClick: false,
      });

      flip.on("init", (e) => {
        setIndex(e.data.page);
        setOrientation(e.data.mode);
        setReady(true);
      });
      flip.on("flip", (e) => setIndex(e.data));
      flip.on("changeOrientation", (e) => setOrientation(e.data));
      flip.on("changeState", (e) => {
        const busy = e.data === "flipping" || e.data === "user_fold";
        setTurning(busy);
        if (busy) setTouched(true);
      });

      flip.loadFromHTML(sheets);
      flipRef.current = flip;
    });

    return () => {
      cancelled = true;
      flipRef.current = null;
      // destroy() removes `host` itself; if the library never loaded, do it here.
      if (flip) flip.destroy();
      else host.remove();
    };
  }, [sheets]);

  /* ---- The book rises off the desk as it arrives ------------------------- */
  useGSAP(
    () => {
      const stage = stageRef.current;
      const section = sectionRef.current;
      if (!stage || !section) return;

      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          stage,
          { rotateX: 34, yPercent: 10, scale: 0.84, transformPerspective: 1800, transformOrigin: "50% 100%" },
          {
            rotateX: 0,
            yPercent: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: section, start: "top 92%", end: "top 20%", scrub: true },
          },
        );
        ScrollTrigger.create({
          trigger: section,
          start: "top 45%",
          once: true,
          onEnter: () => setPeek(true),
        });
      });
      return () => mm.revert();
    },
    { scope: sectionRef },
  );

  /* ---- Turning ------------------------------------------------------------ */
  const next = useCallback(() => {
    const flip = flipRef.current;
    if (!flip) return;
    setTouched(true);
    if (prefersReducedMotion()) {
      flip.turnToNextPage();
      setIndex(flip.getCurrentPageIndex());
    } else if (handRef.current) {
      return;
    } else if (flip.getState() === "read") {
      handRef.current = true;
      turnByHand(flip, "next", () => {
        handRef.current = false;
      });
    } else {
      flip.flipNext("bottom");
    }
  }, []);

  const prev = useCallback(() => {
    const flip = flipRef.current;
    if (!flip) return;
    setTouched(true);
    if (prefersReducedMotion()) {
      flip.turnToPrevPage();
      setIndex(flip.getCurrentPageIndex());
    } else if (handRef.current) {
      return;
    } else if (flip.getState() === "read") {
      handRef.current = true;
      turnByHand(flip, "prev", () => {
        handRef.current = false;
      });
    } else {
      flip.flipPrev("bottom");
    }
  }, []);

  const goTo = useCallback((pageIndex: number) => {
    const flip = flipRef.current;
    if (!flip) return;
    setTouched(true);
    if (prefersReducedMotion()) {
      flip.turnToPage(pageIndex);
      setIndex(flip.getCurrentPageIndex());
    } else {
      flip.flip(pageIndex, "bottom");
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, prev]);

  /* ---- Where we are --------------------------------------------------------- */
  const atStart = index <= 0;
  const atEnd = index >= count - 1;
  const landscape = orientation === "landscape";
  // Interior spreads pair [odd, even] after the cover, whichever of the two
  // page-flip reports as current.
  const spreadStart = atStart ? 0 : atEnd ? count - 1 : index % 2 === 1 ? index : index - 1;
  const leftPage = pages[spreadStart];
  const rightPage = landscape && !atStart && !atEnd ? pages[spreadStart + 1] : undefined;
  const shownPage = landscape ? leftPage : pages[index];

  const status = atStart
    ? "Cover"
    : atEnd
      ? "Back cover"
      : rightPage
        ? `Pages ${pad(folioOf(leftPage) ?? 0)} — ${pad(folioOf(rightPage) ?? 0)}`
        : (
            <>
              <span className="sr-only">Page </span>
              {pad(folioOf(shownPage) ?? 0)}
              <span aria-hidden="true"> / </span>
              <span className="sr-only"> of </span>
              {pad(count - 2)}
            </>
          );

  // A closed book sits centred on the desk. The shift is released the moment
  // a turn starts, so the volume slides open while the cover is swinging.
  const shiftFront = landscape && atStart && !turning;
  const shiftBack = landscape && atEnd && !turning;
  // The shadow and page block follow the pages actually on the desk, which
  // only change once a turn lands. Widening them as the turn starts would show
  // a blank page under the swinging cover.
  const coverOnly = landscape && atStart;
  const backOnly = landscape && atEnd;
  const leftDepth = Math.round((6 * Math.max(0, index)) / Math.max(1, count - 1));
  const progress = count > 1 ? index / (count - 1) : 0;

  useEffect(() => {
    const strip = stripRef.current;
    const active = strip?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!strip || !active) return;
    strip.scrollTo({
      left: active.offsetLeft - strip.clientWidth / 2 + active.clientWidth / 2,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, [spreadStart]);

  return (
    <section
      ref={sectionRef}
      data-surface="day"
      aria-labelledby="volume-heading"
      className="relative overflow-hidden bg-[radial-gradient(120%_80%_at_50%_28%,#f2ece2_0%,#e3dacb_52%,#d2c7b5_100%)] pt-14 pb-16 text-night md:pt-16 md:pb-20"
    >
      <h2 id="volume-heading" className="sr-only">
        Volume I — {studio}
      </h2>

      {/*
        The book is drawn for the eye and marked aria-hidden. Its contents are
        carried here instead, in reading order, with the links a page cannot hold.
      */}
      <div className="sr-only">
        <p>
          Use the Previous and Next buttons, or the left and right arrow keys, to turn the pages.
          The projects in this volume are listed below.
        </p>
        <ol>
          {pages.map((page) =>
            page.kind === "opener" ? (
              <li key={page.id}>
                <h3>
                  {pad(page.number, 2)}. {page.spread.title}
                </h3>
                <p>{page.spread.kicker}</p>
                <p>{page.spread.body}</p>
                {page.project && (
                  <TransitionLink href={`/projects/${page.project.slug}`}>
                    Open the {page.spread.title} project
                  </TransitionLink>
                )}
              </li>
            ) : null,
          )}
        </ol>
      </div>

      <div className="sheet">
        <div className="book-column relative">
          <div ref={stageRef} className="relative will-change-transform">
            <div
              className={cn(
                "relative transition-transform duration-[1100ms] ease-[cubic-bezier(0.65,0,0.35,1)]",
                shiftFront ? "-translate-x-1/4" : shiftBack ? "translate-x-1/4" : "translate-x-0",
              )}
            >
              {/* The desk: contact shadow, ambient shadow, and the edges of the page block */}
              <div
                aria-hidden="true"
                className={cn(
                  "pointer-events-none absolute inset-y-0 transition-[left,right,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                  coverOnly ? "right-0 left-1/2" : backOnly ? "right-1/2 left-0" : "right-0 left-0",
                  ready ? "opacity-100" : "opacity-0",
                )}
              >
                <span className="absolute inset-x-[6%] -bottom-[4%] h-[10%] rounded-[50%] bg-night/45 blur-2xl" />
                <span className="absolute inset-0 shadow-[0_50px_90px_-40px_rgba(22,17,13,0.65)]" />
                {landscape && !coverOnly && !backOnly ? (
                  <>
                    <span
                      className="absolute inset-y-0 left-0 w-1/2 bg-[#efe8dd]"
                      style={{ boxShadow: stackEdges(leftDepth, -1) }}
                    />
                    <span
                      className="absolute inset-y-0 right-0 w-1/2 bg-[#efe8dd]"
                      style={{ boxShadow: stackEdges(6 - leftDepth, 1) }}
                    />
                  </>
                ) : (
                  <span
                    className="absolute inset-0 bg-[#efe8dd]"
                    style={{ boxShadow: stackEdges(5, backOnly ? -1 : 1) }}
                  />
                )}
              </div>

              <div
                ref={mountRef}
                aria-hidden="true"
                data-peek={peek && ready && atStart && !touched ? "true" : undefined}
                className={cn(
                  "iconic-book relative",
                  !ready && "aspect-[25/32] min-[56.25rem]:aspect-[25/16]",
                )}
              />
            </div>
          </div>

          {!ready && (
            <p
              aria-hidden="true"
              className="annotation absolute inset-0 flex items-center justify-center text-night/40"
            >
              Opening the volume…
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="book-column mt-8">
          <div aria-hidden="true" className="relative h-px bg-night/15">
            <span
              className="absolute inset-0 origin-left bg-ember transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `scaleX(${progress})` }}
            />
          </div>

          <div className="mt-5 grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-6">
            <button
              type="button"
              onClick={prev}
              disabled={!ready || atStart}
              className="group inline-flex min-h-12 cursor-pointer items-center gap-3 px-1 transition-colors duration-300 hover:text-ember disabled:cursor-not-allowed disabled:opacity-30"
            >
              <span
                aria-hidden="true"
                className="block h-px w-6 bg-current transition-all duration-500 group-hover:w-10 sm:w-8"
              />
              <span className="condensed text-label tracking-[0.18em] uppercase">
                Prev<span className="hidden sm:inline">ious</span>
              </span>
            </button>

            <p className="annotation truncate text-center text-night/60 tabular-nums" aria-live="polite">
              {status}
            </p>

            <button
              type="button"
              onClick={next}
              disabled={!ready || atEnd}
              className="group inline-flex min-h-12 cursor-pointer items-center gap-3 bg-night px-4 py-3 text-bone transition-colors duration-300 hover:bg-umber disabled:cursor-not-allowed disabled:opacity-30 sm:gap-4 sm:px-7"
            >
              <span className="condensed text-label tracking-[0.18em] uppercase">
                <span className="sm:hidden">{atStart ? "Open" : atEnd ? "End" : "Next"}</span>
                <span className="hidden sm:inline">
                  {atStart ? "Open the cover" : atEnd ? "End of volume" : "Next page"}
                </span>
              </span>
              <span
                aria-hidden="true"
                className="block h-px w-6 bg-glow transition-all duration-500 group-hover:w-10 sm:w-8"
              />
            </button>
          </div>

          <p className="annotation mt-4 text-center text-night/40">
            <span className="md:hidden">Swipe a page to turn it</span>
            <span className="hidden md:inline">Drag a corner, or use ← → on the keyboard</span>
          </p>

          {/* Filmstrip — every spread, jump anywhere */}
          <ol
            ref={stripRef}
            aria-label="Spreads in this volume"
            className="mt-6 flex snap-x gap-2 overflow-x-auto pb-3"
          >
            {spreads.map((s) => {
              const active = s.start === spreadStart;
              const name = s.board ? s.title : `Pages ${s.label} — ${s.title}`;
              return (
                <li key={s.start} className="shrink-0 snap-start">
                  <button
                    type="button"
                    onClick={() => goTo(s.start)}
                    disabled={!ready}
                    aria-current={active ? "true" : undefined}
                    aria-label={`Go to ${name}`}
                    className={cn(
                      "relative flex h-12 w-20 cursor-pointer items-end overflow-hidden border transition-all duration-500 disabled:cursor-not-allowed sm:h-14 sm:w-24",
                      active
                        ? "border-ember opacity-100 shadow-[0_8px_20px_-10px_rgba(22,17,13,0.6)]"
                        : "border-night/15 opacity-60 hover:opacity-100",
                    )}
                  >
                    {s.board ? (
                      <span aria-hidden="true" className="absolute inset-0 bg-night" />
                    ) : s.media ? (
                      <Image
                        src={s.media.src}
                        alt=""
                        fill
                        sizes="96px"
                        quality={60}
                        className="object-cover"
                      />
                    ) : (
                      <span aria-hidden="true" className="book-paper absolute inset-0" />
                    )}
                    <span
                      aria-hidden="true"
                      className="annotation relative z-10 w-full bg-gradient-to-t from-night/75 to-transparent px-1.5 pt-4 pb-1 text-left text-[0.55rem] text-bone"
                    >
                      {s.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {sheets &&
        pages.map((page, i) =>
          createPortal(
            <SheetContent
              page={page}
              side={i % 2 === 1 ? "left" : "right"}
              eager={Math.abs(i - index) <= 3}
              studio={studio}
              years={years}
            />,
            sheets[i],
            page.id,
          ),
        )}
    </section>
  );
}
