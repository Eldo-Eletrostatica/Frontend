import { sendApiRequest } from "@/lib/api/client";

export type CatalogItemType = "paintType" | "partMaterial";

// paintType uses pricePerM2; partMaterial uses priceFactor.
export interface CatalogItem {
  catalogItemId: string;
  type: CatalogItemType;
  name: string;
  pricePerM2: number | null;
  priceFactor: number | null;
  isActive: boolean;
}

// Active items for the sale item picker, available to every authenticated role.
export interface CatalogItemOption {
  catalogItemId: string;
  type: CatalogItemType;
  name: string;
}

export interface CreateCatalogItemInput {
  type: CatalogItemType;
  name: string;
  pricePerM2?: number;
  priceFactor?: number;
  isActive?: boolean;
}

export type UpdateCatalogItemInput = Partial<Omit<CreateCatalogItemInput, "type">>;

export function listCatalogItems(type?: CatalogItemType) {
  const query = type ? `?type=${type}` : "";
  return sendApiRequest<CatalogItem[]>(`/catalog-items${query}`);
}

export function listCatalogOptions() {
  return sendApiRequest<CatalogItemOption[]>("/catalog-items/options");
}

export function createCatalogItem(input: CreateCatalogItemInput) {
  return sendApiRequest<CatalogItem>("/catalog-items", { method: "POST", body: input });
}

export function updateCatalogItem(catalogItemId: string, input: UpdateCatalogItemInput) {
  return sendApiRequest<CatalogItem>(`/catalog-items/${catalogItemId}`, {
    method: "PATCH",
    body: input,
  });
}

export function deleteCatalogItem(catalogItemId: string) {
  return sendApiRequest<void>(`/catalog-items/${catalogItemId}`, { method: "DELETE" });
}
