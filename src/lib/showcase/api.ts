import { sendApiRequest } from "@/lib/api/client";
import type { CompanyEvent, PortfolioProject } from "@/components/public/publicContent";

export interface PortfolioProjectInput {
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  serviceType: string;
  materials: string;
  beforeUrl?: string | null;
  afterUrl?: string | null;
}

export interface CompanyEventInput {
  title: string;
  description: string;
  imageUrl: string;
  // YYYY-MM-DD.
  eventDate: string;
}

// Admin list: newest first, so a just-created item is at the top (US27).
export async function listAdminPortfolioProjects(): Promise<PortfolioProject[]> {
  const page = await sendApiRequest<{ items: PortfolioProject[] }>(
    "/showcase-items/portfolio-projects?limit=50",
  );
  return page.items;
}

export function listPortfolioCategories() {
  return sendApiRequest<string[]>("/showcase-items/portfolio-projects/categories");
}

export function createPortfolioProject(input: PortfolioProjectInput) {
  return sendApiRequest<PortfolioProject>("/showcase-items/portfolio-projects", {
    method: "POST",
    body: input,
  });
}

export function updatePortfolioProject(showcaseItemId: string, input: Partial<PortfolioProjectInput>) {
  return sendApiRequest<PortfolioProject>(`/showcase-items/portfolio-projects/${showcaseItemId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deletePortfolioProject(showcaseItemId: string) {
  return sendApiRequest<void>(`/showcase-items/portfolio-projects/${showcaseItemId}`, {
    method: "DELETE",
  });
}

export function renamePortfolioCategory(category: string, name: string) {
  return sendApiRequest<string[]>(
    `/showcase-items/portfolio-projects/categories/${encodeURIComponent(category)}`,
    { method: "PATCH", body: { name } },
  );
}

export function deletePortfolioCategory(category: string) {
  return sendApiRequest<void>(
    `/showcase-items/portfolio-projects/categories/${encodeURIComponent(category)}`,
    { method: "DELETE" },
  );
}

// The admin list also orders by createdAt, which puts new events first.
export function listCompanyEvents() {
  return sendApiRequest<CompanyEvent[]>("/showcase-items/company-events?orderBy=createdAt");
}

export function createCompanyEvent(input: CompanyEventInput) {
  return sendApiRequest<CompanyEvent>("/showcase-items/company-events", {
    method: "POST",
    body: input,
  });
}

export function updateCompanyEvent(showcaseItemId: string, input: Partial<CompanyEventInput>) {
  return sendApiRequest<CompanyEvent>(`/showcase-items/company-events/${showcaseItemId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteCompanyEvent(showcaseItemId: string) {
  return sendApiRequest<void>(`/showcase-items/company-events/${showcaseItemId}`, {
    method: "DELETE",
  });
}

export async function uploadShowcaseImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { url } = await sendApiRequest<{ url: string }>("/showcase-items/images", {
    method: "POST",
    formData,
  });
  return url;
}
