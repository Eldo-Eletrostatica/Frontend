import { sendApiRequest } from "@/lib/api/client";
import type { ServiceOrder, ServiceOrderStatus } from "./types";

export function listServiceOrders() {
  return sendApiRequest<ServiceOrder[]>("/service-orders");
}

// US20: due date already passed and the OS is not completed. Admin/manager only.
export function listOverdueServiceOrders() {
  return sendApiRequest<ServiceOrder[]>("/service-orders/overdue");
}

// Free transition: any status can go to any other (US18).
export function updateServiceOrderStatus(orderId: string, status: ServiceOrderStatus) {
  return sendApiRequest<Partial<ServiceOrder>>(`/service-orders/${orderId}/status`, {
    method: "PATCH",
    body: { status },
  });
}