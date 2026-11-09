import TransitionProvider from "@/components/motion/TransitionProvider";
import SiteHeader from "@/components/chrome/SiteHeader";
import SiteFooter from "@/components/chrome/SiteFooter";
import WhatsAppLink from "@/components/chrome/WhatsAppLink";

/**
 * Everything a visitor sees. The studio desk at /admin sits outside this group
 * so it gets none of the site chrome, and the site gets none of the desk's.
 */
export default function SiteLayout({ children }: LayoutProps<"/">) {
  return (
    <TransitionProvider>
      <SiteHeader />
      <main id="main" className="relative outline-none">
        {children}
      </main>
      <SiteFooter />
      <WhatsAppLink />
    </TransitionProvider>
  );
}
