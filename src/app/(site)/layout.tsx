import PublicFooter from "@/components/public/PublicFooter";
import PublicNav from "@/components/public/PublicNav";
import ScrollShortcuts from "@/components/public/ScrollShortcuts";
import SiteThemeStyle from "@/components/public/SiteThemeStyle";
import { loadVisualSettings } from "./publicData";

// Rendered on each request: next build must not call the API, and the cached
// visual settings are refreshed by tag when the internal area publishes.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const visualSettings = await loadVisualSettings();

  return (
    <div className="min-h-screen bg-site-page">
      <SiteThemeStyle colors={visualSettings.colors} />
      <PublicNav logo={visualSettings.logo} />
      <main style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>{children}</main>
      <PublicFooter logo={visualSettings.logo} />
      <ScrollShortcuts />
    </div>
  );
}
