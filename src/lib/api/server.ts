import { readJson } from "./response";

// Server Components call the Backend directly by API_URL, without the /api
// proxy. Only for public data: these requests carry no visitor cookie.
const API_URL = process.env.API_URL ?? "http://localhost:3001";

// Tags of the public data the internal area changes; after a change, the
// internal area revalidates the tag so the site shows it at once.
export const CACHE_TAGS = {
  visualSettings: "visual-settings",
  portfolioProjects: "portfolio-projects",
  companyEvents: "company-events",
  quoteEstimator: "estimator",
  // Alias for backward compatibility.
  estimator: "estimator",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

// Cached until the internal area revalidates the tag. If tag is omitted,
// fetches with no-store. A page that uses this must render on request
// (export const dynamic = "force-dynamic"); otherwise next build would call the
// API and fail when the Backend is not running.
export async function fetchPublicData<T>(path: string, tag?: CacheTag): Promise<T> {
  const options: RequestInit = tag
    ? { cache: "force-cache", next: { tags: [tag] } }
    : { cache: "no-store" };
  const response = await fetch(`${API_URL}${path}`, options);
  return readJson<T>(response);
}
