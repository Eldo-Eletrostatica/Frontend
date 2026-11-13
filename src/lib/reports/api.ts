import { downloadApiFile, sendApiRequest } from "@/lib/api/client";
import { saveFile, transcodeCsvToWindows1252 } from "@/lib/files";
import type { PeriodQuery } from "./types";

export type CommissionType = "percentage" | "fixed";

export interface CommissionReportEmployee {
  employeeId: string;
  name: string;
  email: string;
  salesCount: number;
  totalSalesValue: number;
  totalCommission: number;
  commissionType: CommissionType | null;
  commissionValue: number | null;
  isDeleted: boolean;
}

// Mirrors GET /commissions/report.
export interface CommissionReport {
  period: PeriodQuery;
  summary: {
    totalCommission: number;
    totalSalesValue: number;
    totalSalesCount: number;
    sellersCount: number;
  };
  employees: CommissionReportEmployee[];
}

export type RankingOrderBy = "value" | "volume";

export interface SalesRankingEntry {
  position: number;
  employeeId: string;
  name: string;
  email: string;
  salesCount: number;
  totalSalesValue: number;
  averageTicket: number;
}

// Mirrors GET /sales-rankings.
export interface SalesRanking {
  period: PeriodQuery & { orderBy: RankingOrderBy };
  ranking: SalesRankingEntry[];
}

function toQuery(period: PeriodQuery): string {
  return new URLSearchParams({ startDate: period.startDate, endDate: period.endDate }).toString();
}

export function fetchCommissionReport(period: PeriodQuery) {
  return sendApiRequest<CommissionReport>(`/commissions/report?${toQuery(period)}`);
}

export function fetchSalesRanking(period: PeriodQuery, orderBy: RankingOrderBy) {
  return sendApiRequest<SalesRanking>(`/sales-rankings?${toQuery(period)}&orderBy=${orderBy}`);
}

export async function downloadCommissionReport(period: PeriodQuery): Promise<void> {
  const fallback = `relatorio-comissoes-${period.startDate}-a-${period.endDate}.csv`;
  const { content, fileName } = await downloadApiFile(`/commissions/report/export?${toQuery(period)}`, fallback);
  saveFile(await transcodeCsvToWindows1252(content), fileName);
}

export async function downloadSalesRanking(period: PeriodQuery, orderBy: RankingOrderBy): Promise<void> {
  const fallback = `ranking-vendas-${period.startDate}-a-${period.endDate}.csv`;
  const { content, fileName } = await downloadApiFile(
    `/sales-rankings/export?${toQuery(period)}&orderBy=${orderBy}`,
    fallback,
  );
  saveFile(await transcodeCsvToWindows1252(content), fileName);
}
