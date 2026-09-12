import type { Metadata } from "next";
import AdminProviders from "@/components/admin/AdminProviders";
import AdminShell from "@/components/admin/AdminShell";

export const metadata: Metadata = {
  title: "Studio desk",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div data-surface="night" className="min-h-dvh bg-surface text-on-surface">
      <main id="main" className="outline-none">
        <AdminProviders>
          <AdminShell>{children}</AdminShell>
        </AdminProviders>
      </main>
    </div>
  );
}
