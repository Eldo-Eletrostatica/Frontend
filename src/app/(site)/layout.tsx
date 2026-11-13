import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import ScrollShortcuts from "@/components/public/ScrollShortcuts";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen bg-site-page">
      <PublicNav />
      <main style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>{children}</main>
      <PublicFooter />
      <ScrollShortcuts />
    </div>
  );
}
