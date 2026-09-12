import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import HouseProcess from "@/components/house/HouseProcess";
import FilmScroll, { type FilmChapter } from "@/components/site/FilmScroll";
import BuildDuo, { type BuildStep } from "@/components/site/BuildDuo";
import RoomsIndex from "@/components/site/RoomsIndex";
import CtaLink from "@/components/site/CtaLink";
import SplitHeading from "@/components/motion/SplitHeading";
import { Reveal } from "@/components/motion/Reveal";
import { getThresholds } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "The House",
  description:
    "Scroll through a home before it exists: a model that turns into its own plan and then into finished rooms, a film through the spaces, and every room by day and after dark.",
};

const WALKTHROUGH = {
  landscape: { base: "/film/landscape", count: 238, width: 1600, height: 900 },
  portrait: { base: "/film/portrait", count: 238, width: 720, height: 1280 },
};

const WALK_CHAPTERS: FilmChapter[] = [
  { at: 0, title: "Arrival", body: "The living room opens straight into the kitchen, with the city beyond the glass." },
  { at: 0.28, title: "Living", body: "Low, deep seating under a flush ceiling; the television wall stays quiet." },
  { at: 0.55, title: "Kitchen", body: "A waterfall island in book-matched stone anchors the open plan." },
  { at: 0.8, title: "Dining", body: "The table sits in the daylight under a single brass pendant." },
];

const BUILD_STEPS: BuildStep[] = [
  { at: 0, title: "The empty shell", body: "Every project starts here — bare walls, a window and a measured survey." },
  { at: 0.08, title: "Floors & joinery", body: "Herringbone oak and timber panelling go in first, set out from the drawings." },
  { at: 0.3, title: "Lighting", body: "Shelf lighting, coves and pendants: the room's evening is designed now." },
  { at: 0.42, title: "Curtains & textiles", body: "Floor-to-ceiling linen, rugs and upholstery soften the architecture." },
  { at: 0.55, title: "Furniture", body: "The bed, the sofa and the table land exactly where they were drawn." },
  { at: 0.78, title: "Styling", body: "Bedding, art, plants and objects — the layer that makes it feel lived in." },
];

export default async function InsidePage() {
  const rooms = await getThresholds();

  return (
    <>
      <PageHeader
        sheet="03"
        eyebrow="The house"
        title={
          <>
            Walk through a home <em>before it exists.</em>
          </>
        }
        lead="This is how we present a project: a white model that becomes its own plan and then its finished materials, a film through the rooms, and every room by daylight and after dark."
      />

      <HouseProcess />

      <FilmScroll
        label="Film 01 — The walkthrough"
        title="Living, kitchen, dining."
        landscape={WALKTHROUGH.landscape}
        portrait={WALKTHROUGH.portrait}
        poster="/film/landscape/f-000.webp"
        chapters={WALK_CHAPTERS}
      />

      <BuildDuo
        label="Film 02 — Shell to styled"
        title="Two rooms finish themselves."
        intro="Scroll and a bedroom and a living room are built in step — floors, joinery, light, textiles, furniture and styling, in the order we deliver them."
        tall={{
          frames: { base: "/film/bedroom", count: 212, width: 540, height: 960 },
          poster: "/film/bedroom/f-000.webp",
          caption: "Bedroom — from shell to styled",
        }}
        wide={{
          frames: { base: "/film/living", count: 153, width: 640, height: 458 },
          poster: "/film/living/f-000.webp",
          caption: "Living room — from shell to furnished",
        }}
        steps={BUILD_STEPS}
      />

      <RoomsIndex rooms={rooms} />

      <section data-surface="day" className="bg-surface py-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet grid gap-12 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="eyebrow mb-8 text-accent">Your project</p>
            <SplitHeading className="inked text-d2 leading-[0.95] tracking-[-0.02em]">
              See your home this way <em>before we build it.</em>
            </SplitHeading>
          </div>
          <Reveal className="flex flex-col items-start gap-8 lg:col-span-4 lg:col-start-9">
            <p className="text-on-surface-muted">
              Every project we take on is modelled, drawn and rendered by day and after dark before
              anything is ordered — so the decisions are made on screen, not on site.
            </p>
            <div className="flex flex-wrap gap-3">
              <CtaLink href="/projects">See the work</CtaLink>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
