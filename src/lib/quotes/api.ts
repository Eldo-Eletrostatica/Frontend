import { sendApiRequest } from "@/lib/api/client";
import type { Quote, QuoteStatus } from "./types";

export function listQuotes(status?: QuoteStatus) {
  const query = status ? `?status=${status}` : "";
  return sendApiRequest<Quote[]>(`/quotes${query}`);
}

// "sent" records the value sent to the customer (finalPrice is required);
// "approved" and "rejected" record the customer's answer.
export function updateQuoteStatus(orderId: string, status: "sent" | "approved" | "rejected", finalPrice?: number) {
  return sendApiRequest<Quote>(`/quotes/${orderId}/status`, {
    method: "PATCH",
    body: finalPrice === undefined ? { status } : { status, finalPrice },
  });
}
