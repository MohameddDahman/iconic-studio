import type { Metadata } from "next";
import PageHeader from "@/components/site/PageHeader";
import ProjectIndex from "@/components/site/ProjectIndex";
import { getProjects } from "@/lib/content";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Projects",
  description: "Selected interiors by Iconic — homes, workplaces, restaurants, hotels, retail and healthcare.",
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
        lead={`${projects.length} projects across homes, workplaces, restaurants, hotels, retail and healthcare. Filter by sector, or switch to the list.`}
      />

      <section data-surface="day" className="bg-surface pt-12 pb-[var(--spacing-bay-lg)] text-on-surface">
        <div className="sheet">
          <ProjectIndex projects={projects} />
        </div>
      </section>
    </>
  );
}
