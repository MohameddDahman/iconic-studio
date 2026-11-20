import TransitionProvider from "@/components/motion/TransitionProvider";
import SiteHeader from "@/components/chrome/SiteHeader";
import SiteFooter from "@/components/chrome/SiteFooter";
import WhatsAppLink from "@/components/chrome/WhatsAppLink";
import { getSettings, getVideos } from "@/lib/content";
import { socialProfiles } from "@/lib/social";

/**
 * Everything a visitor sees. The studio desk at /admin sits outside this group
 * so it gets none of the site chrome, and the site gets none of the desk's.
 */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [videos, settings] = await Promise.all([getVideos(), getSettings()]);
  // The Videos page joins the menu once there is a film to show.
  const showVideos = videos.length > 0;
  return (
    <TransitionProvider>
      <SiteHeader showVideos={showVideos} socials={socialProfiles(settings)} />
      <main id="main" className="relative outline-none">
        {children}
      </main>
      <SiteFooter showVideos={showVideos} />
      <WhatsAppLink />
    </TransitionProvider>
  );
}
