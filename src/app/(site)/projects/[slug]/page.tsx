import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reveal } from "@/components/motion/Reveal";
import PairedImage from "@/components/site/PairedImage";
import ProjectGallery from "@/components/site/ProjectGallery";
import VideoGallery from "@/components/site/VideoGallery";
import NextProject from "@/components/site/NextProject";
import { getProject, getProjects, getVideos } from "@/lib/content";

// Content is read from the data cache, refreshed when the desk saves (app/api/refresh); this is only a backstop.
export const revalidate = 3600;

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProject(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.brief,
    openGraph: {
      title: project.title,
      description: project.brief,
      // A share preview needs a photograph a messenger is willing to fetch.
      images: [
        {
          url: /^\/(media\/live|photo)\//.test(project.cover.src)
            ? project.cover.src.replace(/\.webp$/, ".og.jpg")
            : project.cover.src,
        },
      ],
    },
  };
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, all, videos] = await Promise.all([getProject(slug), getProjects(), getVideos()]);
  if (!project) notFound();
  const films = videos.filter((video) => video.projectSlug === project.slug);

  const index = all.findIndex((p) => p.slug === project.slug);
  const next = all[(index + 1) % all.length];
  const [lead, ...rest] = project.statement;

  return (
    <>
      {/*
        The hero fills the viewport exactly, because that is where the clicked
        photograph is flown to on the way in.
      */}
      <section data-surface="night" className="relative flex min-h-dvh flex-col justify-end overflow-hidden bg-night text-bone">
        <div className="absolute inset-0">
          <PairedImage
            media={project.cover}
            sizes="100vw"
            preload
            lamp={{ x: 50, y: 4 }}
            switchClassName="top-24 bottom-auto md:top-28 md:bottom-auto"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night via-night/40 to-night/25"
          />
        </div>

        <div className="sheet pointer-events-none relative z-10 pt-40 pb-10 md:pb-14">
          <p className="mb-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-bone/80">
            <span className="annotation text-glow">{project.reference}</span>
            <span aria-hidden="true" className="block h-px w-10 bg-current opacity-60" />
            <span className="eyebrow">{project.typology}</span>
            <span aria-hidden="true" className="block h-px w-10 bg-current opacity-60" />
            <span className="eyebrow">{project.location}</span>
          </p>
          <h1 className="inked text-d1 leading-[0.86] tracking-[-0.03em]">{project.title}</h1>
          <div className="mt-10 grid gap-8 border-t border-white/15 pt-6 md:grid-cols-12">
            <p className="text-lead leading-[1.5] text-bone/80 md:col-span-6">{project.brief}</p>
            <dl className="grid grid-cols-2 gap-6 md:col-span-5 md:col-start-8">
              <div>
                <dt className="eyebrow text-bone/55">Year</dt>
                <dd className="mt-2 text-lg">{project.year}</dd>
              </div>
              <div>
                <dt className="eyebrow text-bone/55">Stage</dt>
                <dd className="mt-2 text-lg">{project.stage}</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section data-surface="day" className="bg-surface py-[var(--spacing-bay)] text-on-surface">
        <div className="sheet">
          <Reveal as="dl" stagger className="grid grid-cols-2 gap-x-8 gap-y-8 border-b border-rule pb-12 md:grid-cols-4">
            {project.facts.map((fact) => (
              <div key={fact.label}>
                <dt className="eyebrow text-on-surface-faint">{fact.label}</dt>
                <dd className="inked mt-3 text-[clamp(1.6rem,1.2rem+1vw,2.3rem)] leading-none">{fact.value}</dd>
              </div>
            ))}
          </Reveal>

          <div className="mt-[var(--spacing-bay)] grid gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-7">
              <p className="eyebrow mb-8 text-accent">The project</p>
              <Reveal stagger className="flex flex-col gap-6">
                {lead && <p className="inked text-d4 leading-[1.22] tracking-[-0.01em]">{lead}</p>}
                {rest.map((para, i) => (
                  <p key={i} className="max-w-2xl text-on-surface-muted">
                    {para}
                  </p>
                ))}
              </Reveal>
            </div>

            <Reveal className="lg:col-span-4 lg:col-start-9">
              <h2 className="eyebrow mb-6 border-b border-rule pb-4 text-on-surface-faint">Specified</h2>
              <ul className="flex flex-col">
                {project.materials.map((material) => (
                  <li key={material} className="flex items-center gap-4 border-b border-rule py-4 text-sm">
                    <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-accent" />
                    {material}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>
        </div>
      </section>

      {films.length > 0 && <VideoGallery videos={films} />}

      {project.gallery.length > 0 && <ProjectGallery images={project.gallery} />}

      {next && next.slug !== project.slug && <NextProject project={next} />}
    </>
  );
}
