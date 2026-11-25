import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/site/PageHeader";
import VideoGallery from "@/components/site/VideoGallery";
import { getProjects, getVideos } from "@/lib/content";

// Content is read from the data cache, refreshed when the desk saves (app/api/refresh); this is only a backstop.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Films",
  description: "Short films of projects by Iconic, an architecture, landscape and interior design studio in Alexandria.",
};

export default async function VideosPage() {
  const [videos, projects] = await Promise.all([getVideos(), getProjects()]);
  // The page joins the menu with the first film; until then it does not exist.
  if (videos.length === 0) notFound();
  const titles = new Map(projects.map((project) => [project.slug, project.title]));

  return (
    <>
      <PageHeader
        sheet="06"
        eyebrow="Videos"
        title={
          <>
            The work, <em>on film.</em>
          </>
        }
        lead={`${videos.length} short ${videos.length === 1 ? "film" : "films"} from the studio\u2019s projects.`}
      />
      <VideoGallery
        videos={videos.map((video) => ({
          ...video,
          projectTitle: video.projectSlug ? titles.get(video.projectSlug) : undefined,
        }))}
      />
    </>
  );
}
