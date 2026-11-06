import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import ScrollShortcuts from "@/components/public/ScrollShortcuts";

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen" style={{ background: "#12100d" }}>
      <PublicNav />
      <main style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>{children}</main>
      <PublicFooter />
      <ScrollShortcuts />
    </div>
  );
}
