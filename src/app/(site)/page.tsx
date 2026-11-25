import HeroCinema, { type HeroSlide } from "@/components/site/HeroCinema";
import IntroStatement from "@/components/site/IntroStatement";
import Disciplines from "@/components/site/Disciplines";
import DayNight from "@/components/site/DayNight";
import FeaturedWork from "@/components/site/FeaturedWork";
import ProcessSteps from "@/components/site/ProcessSteps";
import MonographTeaser from "@/components/site/MonographTeaser";
import { DISCIPLINES, STAGES } from "@/lib/practice";
import { getFeaturedProjects, getProjects, getSettings, getSpreads, getTestimonials } from "@/lib/content";
import { socialProfiles } from "@/lib/social";
import type { Project, Typology } from "@/lib/types";

// Content is read from the data cache, refreshed when the desk saves (app/api/refresh); this is only a backstop.
export const revalidate = 86400;

/** The photographs the reel prefers, when those projects exist. */
const HERO_PREFERENCE = [
  { slug: "villa-obsidian", src: "/media/stock/living-08.jpg" },
  { slug: "serein-penthouse", src: "/media/stock/living-17.jpg" },
  { slug: "maison-noir", src: "/media/stock/hospitality-07.jpg" },
  { slug: "the-grand-reception", src: "/media/stock/lobby-09.jpg" },
  { slug: "atelier-headquarters", src: "/media/stock/office-03.jpg" },
];

const SECTOR: Record<Typology, string> = {
  Apartment: "Residential",
  Villa: "Residential",
  Duplex: "Residential",
  Penthouse: "Residential",
  Chalet: "Residential",
  Office: "Workplace",
  Commercial: "Workplace",
  Hospitality: "Hospitality",
  Retail: "Retail",
  Healthcare: "Healthcare",
  Mosque: "Mosque",
};

const slideFor = (project: Project, src?: string): HeroSlide => ({
  media: [project.cover, ...project.gallery].find((m) => m.src === src) ?? project.cover,
  title: project.title,
  meta: `${project.typology} · ${project.location}`,
  href: `/projects/${project.slug}`,
});

export default async function HomePage() {
  const [projects, featured, testimonials, spreads, settings] = await Promise.all([
    getProjects(),
    getFeaturedProjects(6),
    getTestimonials(),
    getSpreads(),
    getSettings(),
  ]);

  const preferred = HERO_PREFERENCE.flatMap(({ slug, src }) => {
    const project = projects.find((p) => p.slug === slug);
    return project ? [slideFor(project, src)] : [];
  });
  const slides = preferred.length >= 3 ? preferred : featured.slice(0, 5).map((p) => slideFor(p));

  // The studio's own day/evening renders, wherever they are in the portfolio.
  const paired = projects.flatMap((project) =>
    [project.cover, ...project.gallery].filter((m) => m.night).map((media) => ({ media, project })),
  );
  const living = paired.find((x) => x.media.src.includes("living")) ?? paired[0];
  const bath = paired.find((x) => x !== living) ?? null;

  const stats = [
    { value: projects.length, label: "Projects in the portfolio" },
    { value: DISCIPLINES.length, label: "Design disciplines" },
    { value: new Set(projects.map((p) => SECTOR[p.typology])).size, label: "Sectors, homes to hotels" },
    { value: testimonials.length, label: "Client reviews" },
  ];

  return (
    <>
      <HeroCinema
        slides={slides}
        lead="An architecture, landscape and interior design studio in Alexandria — homes, workplaces, restaurants, hotels and clinics, from the first sketch to the final styling."
        completed={settings.completedProjects}
        socials={socialProfiles(settings)}
      />
      <IntroStatement
        statement="We design interiors where the light, the materials and the way you move through a room all agree — then our own team builds them, so the room you approved is exactly the room you walk into."
        stats={stats}
      />
      <Disciplines items={DISCIPLINES} />
      {living && bath && (
        <DayNight
          living={living.media}
          bath={bath.media}
          livingCaption={living.project.title}
          bathCaption={bath.project.title}
        />
      )}
      <FeaturedWork projects={featured} total={projects.length} />
      <ProcessSteps stages={STAGES} />
      <MonographTeaser spreads={spreads} />
    </>
  );
}
