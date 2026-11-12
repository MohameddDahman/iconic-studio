import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import ProjectIndex from "@/components/site/ProjectIndex";
import { getProjects } from "@/lib/content";

// Content is read from the data cache, refreshed when the desk saves (app/api/refresh); this is only a backstop.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected projects by Iconic, an architecture, landscape and interior design studio in Alexandria.",
};

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <PageHeader
        sheet="01"
        eyebrow="Projects"
        title={
          <>
            Selected <em>work.</em>
          </>
        }
        lead={`${projects.length} projects from the studio. Filter by type, or switch to the list.`}
      />

      <section data-surface="day" className="bg-surface pt-12 pb-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet">
          <ProjectIndex projects={projects} />
        </div>
      </section>
    </>
  );
}
