import { sendApiRequest } from "@/lib/api/client";
import type { PeriodQuery } from "@/lib/reports/types";

export type CommissionType = "percentage" | "fixed";

export interface CommissionRule {
  employeeId: string;
  commissionType: CommissionType | null;
  commissionValue: number | null;
  updatedAt: string;
}

export interface AccumulatedCommissionSale {
  orderId: string;
  trackingCode: string;
  soldAt: string;
  finalPrice: number;
  commission: number;
  status: string;
}

// Mirrors GET /employees/:employeeId/commissions.
export interface AccumulatedCommissions {
  employeeId: string;
  startDate: string;
  endDate: string;
  totalCommission: number;
  totalSalesValue: number;
  salesCount: number;
  sales: AccumulatedCommissionSale[];
}

export function fetchAccumulatedCommissions(employeeId: string, period: PeriodQuery) {
  const params = new URLSearchParams({ startDate: period.startDate, endDate: period.endDate });
  return sendApiRequest<AccumulatedCommissions>(`/employees/${employeeId}/commissions?${params.toString()}`);
}

export interface UpdateCommissionRuleInput {
  commissionType: CommissionType | null;
  commissionValue: number | null;
}

export function updateCommissionRule(employeeId: string, input: UpdateCommissionRuleInput) {
  return sendApiRequest<CommissionRule>(`/employees/${employeeId}/commission-rule`, {
    method: "PATCH",
    body: input,
  });
}
