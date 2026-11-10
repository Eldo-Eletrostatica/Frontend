import { sendApiRequest } from "@/lib/api/client";
import type { ServiceOrder, ServiceOrderStatus } from "./types";

export function listServiceOrders() {
  return sendApiRequest<ServiceOrder[]>("/service-orders");
}

// Free transition: any status can go to any other (US18).
export function updateServiceOrderStatus(orderId: string, status: ServiceOrderStatus) {
  return sendApiRequest<Partial<ServiceOrder>>(`/service-orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
  });
}