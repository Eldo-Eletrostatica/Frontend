import LandingPage from "@/components/public/LandingPage";
import { loadPortfolioProjects, loadVisualSettings } from "./publicData";

// Rendered on each request so next build does not call the API; the data
// itself stays cached by tag.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [visualSettings, portfolioProjects] = await Promise.all([loadVisualSettings(), loadPortfolioProjects()]);
  return <LandingPage visualSettings={visualSettings} portfolioProjects={portfolioProjects} />;
}
