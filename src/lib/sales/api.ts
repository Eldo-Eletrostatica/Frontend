import { sendApiRequest } from "@/lib/api/client";
import type { LaunchedSale, LaunchSaleInput, SaleOrder, Seller } from "./types";

// The OS is born with the sale, so the sold orders are read from the service
// order list (the Backend has no GET /sales).
export function listSaleOrders() {
  return sendApiRequest<SaleOrder[]>("/service-orders");
}

export function launchSale(input: LaunchSaleInput) {
  return sendApiRequest<LaunchedSale>("/sales", { method: "POST", body: input });
}

// Available to any authenticated employee, unlike the admin-only /employees.
export function listSellers() {
  return sendApiRequest<Seller[]>("/employees/sellers");
}
