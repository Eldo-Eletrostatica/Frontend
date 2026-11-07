import { CACHE_TAGS, fetchPublicData } from "@/lib/api/server";
import {
  DEFAULT_VISUAL_SETTINGS,
  type CompanyEvent,
  type PaginatedPortfolioProjects,
  type PortfolioProject,
  type VisualSettings,
} from "@/components/public/publicContent";

// The showcase limits (US27) allow at most 18 projects, so the Backend page
// size cap of 50 brings the whole portfolio in one request.
const PORTFOLIO_PAGE_SIZE = 50;

// The layout and the page both call this; Next dedupes the identical fetch
// within one request. An unreachable API falls back to the default identity
// so the site still renders.
export async function loadVisualSettings(): Promise<VisualSettings> {
  try {
    return await fetchPublicData<VisualSettings>("/site-settings/visual", CACHE_TAGS.visualSettings);
  } catch {
    return DEFAULT_VISUAL_SETTINGS;
  }
}

// null means the API could not be reached, which the page tells apart from an
// empty showcase.
export async function loadPortfolioProjects(): Promise<PortfolioProject[] | null> {
  try {
    const page = await fetchPublicData<PaginatedPortfolioProjects>(
      `/showcase-items/portfolio-projects?limit=${PORTFOLIO_PAGE_SIZE}`,
      CACHE_TAGS.portfolioProjects,
    );
    return page.items;
  } catch {
    return null;
  }
}

export async function loadCompanyEvents(): Promise<CompanyEvent[] | null> {
  try {
    return await fetchPublicData<CompanyEvent[]>("/showcase-items/company-events", CACHE_TAGS.companyEvents);
  } catch {
    return null;
  }
}
