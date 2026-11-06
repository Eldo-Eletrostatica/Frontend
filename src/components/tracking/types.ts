// Mirrors the public lookup of /service-orders/tracking (US19).

export type ServiceOrderStatus = "queued" | "inProduction" | "finishing" | "completed";

// Lookup by tracking code.
export interface ServiceOrderTracking {
  trackingCode: string;
  status: ServiceOrderStatus;
  // AAAA-MM-DD.
  dueDate: string;
}

// Lookup by CNPJ: only the stage and the due date of each open order.
export interface ServiceOrderProgress {
  status: ServiceOrderStatus;
  dueDate: string;
}

export type TrackingLookup =
  | { kind: "trackingCode"; serviceOrder: ServiceOrderTracking }
  | { kind: "cnpj"; cnpj: string; serviceOrders: ServiceOrderProgress[] };

export const SERVICE_ORDER_STEPS: ServiceOrderStatus[] = ["queued", "inProduction", "finishing", "completed"];

export const SERVICE_ORDER_STATUS_LABELS: Record<ServiceOrderStatus, string> = {
  queued: "Em fila",
  inProduction: "Em produção",
  finishing: "Em finalização",
  completed: "Concluído",
};

export const SERVICE_ORDER_STATUS_DESCRIPTIONS: Record<ServiceOrderStatus, string> = {
  queued: "Aguardando início da produção",
  inProduction: "Processo de pintura em andamento",
  finishing: "Acabamento e inspeção de qualidade",
  completed: "Serviço concluído e pronto para entrega",
};
