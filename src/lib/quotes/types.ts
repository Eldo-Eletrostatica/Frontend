export type QuoteStatus = "requested" | "sent" | "approved" | "rejected";

export type QuoteSource = "estimator" | "pdf";

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  requested: "NOVO",
  sent: "VALOR ENVIADO",
  approved: "APROVADO",
  rejected: "RECUSADO",
};

export interface QuoteItem {
  paintName: string;
  materialName: string;
  areaM2: number;
  quantity: number;
}

// Mirrors GET /quotes.
export interface Quote {
  orderId: string;
  status: QuoteStatus;
  source: QuoteSource;
  customerName: string;
  customerDocument: string | null;
  customerEmail: string;
  customerPhone: string;
  customerMessage: string | null;
  pdfUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  finalPrice: number | null;
  dueDate: string | null;
  sentAt: string | null;
  createdAt: string;
  items: QuoteItem[];
}
