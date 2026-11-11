export type CustomerType = "individual" | "business";

export type SaleStatus = "queued" | "inProduction" | "finishing" | "completed";

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  queued: "Em fila",
  inProduction: "Em produção",
  finishing: "Finalização",
  completed: "Concluído",
};

export interface SaleCustomerInput {
  type: CustomerType;
  name: string;
  // Required when type is "business"; 11 or 14 digits.
  document?: string;
  email: string;
  phone: string;
}

export interface SaleItemInput {
  paintCatalogItemId: string;
  materialCatalogItemId: string;
  // Positive, at most 3 decimals.
  areaM2: number;
  // Positive integer.
  quantity: number;
}

interface LaunchSaleCommon {
  sellerEmployeeId: string;
  scope: string;
  // YYYY-MM-DD.
  dueDate: string;
}

// Direct sale: customer, items and price go in the same request.
export type LaunchDirectSaleInput = LaunchSaleCommon & {
  customer: SaleCustomerInput;
  items: SaleItemInput[];
  finalPrice: number;
};

// Approved quote: only the order id is needed besides seller/scope/due date.
export type LaunchApprovedSaleInput = LaunchSaleCommon & {
  orderId: string;
};

export type LaunchSaleInput = LaunchDirectSaleInput | LaunchApprovedSaleInput;

// Mirrors POST /sales.
export interface LaunchedSale {
  orderId: string;
  customerId: string;
  sellerEmployeeId: string;
  status: "queued";
  trackingCode: string;
  finalPrice: number;
  commission: number;
  soldAt: string;
  scope: string;
  dueDate: string;
}

// Mirrors the Order returned by GET /service-orders.
export interface SaleOrder {
  orderId: string;
  customerId: string;
  sellerEmployeeId: string | null;
  source: string;
  status: SaleStatus;
  finalPrice: number | null;
  commission: number | null;
  soldAt: string | null;
  trackingCode: string | null;
  scope: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  customer: {
    customerId: string;
    type: CustomerType;
    name: string;
    document: string | null;
    email: string;
    phone: string;
  };
}

// Mirrors GET /employees/sellers.
export interface Seller {
  employeeId: string;
  name: string;
}
