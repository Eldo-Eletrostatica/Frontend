    export type ServiceOrderStatus = "queued" | "inProduction" | "finishing" | "completed";

// Mirrors GET /service-orders. The Backend sends no seller name, only its id.
export interface ServiceOrder {
  orderId: string;
  status: ServiceOrderStatus;
  trackingCode: string;
  scope: string;
  // Date only (YYYY-MM-DD).
  dueDate: string;
  // Set by the Backend when the status becomes "completed".
  completedAt: string | null;
  customer: { name: string; document: string | null };
}