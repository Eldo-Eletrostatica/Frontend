// Mirrors the Backend contract of /quotes (US07).

export interface EstimatorOption {
  catalogItemId: string;
  name: string;
}

export interface EstimatorOptions {
  isEnabled: boolean;
  paintTypes: EstimatorOption[];
  partMaterials: EstimatorOption[];
}

export interface QuoteCustomer {
  name: string;
  // 14 digits, without punctuation.
  cnpj: string;
  email: string;
  phone: string;
}

export interface QuoteItem {
  materialCatalogItemId: string;
  paintCatalogItemId: string;
  areaM2: number;
  quantity: number;
}

// Domain alias (GLOSSARY.md: OrderItem)
export type OrderItem = QuoteItem;

export interface CreateEstimatedQuote {
  customer: QuoteCustomer;
  items: QuoteItem[];
  // AAAA-MM-DD.
  dueDate: string;
  message?: string;
}

export interface Quote {
  orderId: string;
  customerId: string;
  source: "estimator" | "pdf";
  status: string;
  // null on a PDF quote.
  minPrice: number | null;
  maxPrice: number | null;
}
