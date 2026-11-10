"use client";

import { downloadApiFile, sendApiRequest } from "@/lib/api/client";
import type { StatisticsPeriod } from "./statisticsPeriod";

// Same shape as GET /statistics (US11).
export interface PaintTypeRanking {
  catalogItemId: string;
  name: string;
  // Orders of the period that asked for this paint, of any source and status.
  orderCount: number;
}

export interface Statistics {
  startDate: string;
  endDate: string;
  // False when the period has no quotes and no order with a paint type.
  hasData: boolean;
  quoteCount: number;
  convertedQuoteCount: number;
  // From 0 to 1; null when the period has no quotes.
  conversionRate: number | null;
  topPaintTypes: PaintTypeRanking[];
}

export type ExportFormat = "pdf" | "xlsx";

function toQuery(period: StatisticsPeriod): string {
  return new URLSearchParams({ startDate: period.startDate, endDate: period.endDate }).toString();
}

export function fetchStatistics(period: StatisticsPeriod): Promise<Statistics> {
  return sendApiRequest<Statistics>(`/statistics?${toQuery(period)}`);
}

// US12: the same numbers as the dashboard, as a PDF or a spreadsheet. The
// Backend answers 422 when the period has no data.
export async function downloadStatisticsReport(period: StatisticsPeriod, format: ExportFormat): Promise<void> {
  const fallbackFileName = `relatorio-estatisticas-${period.startDate}-a-${period.endDate}.${format}`;
  const { content, fileName } = await downloadApiFile(
    `/statistics/export?${toQuery(period)}&format=${format}`,
    fallbackFileName,
  );
  saveFile(content, fileName);
}

function saveFile(content: Blob, fileName: string): void {
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  // Released on the next tick: revoking right away can cancel the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
