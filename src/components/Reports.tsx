"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, FileSpreadsheet, Trophy } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import type { Role } from "@/lib/auth/AuthProvider";
import {
  downloadCommissionReport,
  downloadSalesRanking,
  fetchCommissionReport,
  fetchSalesRanking,
  type CommissionReport,
  type RankingOrderBy,
  type SalesRanking,
} from "@/lib/reports/api";
import type { PeriodQuery } from "@/lib/reports/types";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const LOAD_ERROR = "Não foi possível carregar os relatórios. Tente novamente.";
const EXPORT_ERROR = "Não foi possível exportar o arquivo. Tente novamente.";

type ReportState<T> =
  | { kind: "loading" }
  | { kind: "loaded"; data: T }
  | { kind: "failed"; message: string };

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function todayAsText(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function firstDayOfMonthAsText(monthOffset = 0): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-01`;
}

function lastDayOfMonthAsText(monthOffset = 0): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth() + monthOffset + 1, 0);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function formatRule(type: string | null, value: number | null): string {
  if (!type || value === null) return "Sem regra";
  return type === "percentage" ? `${value}%` : BRL.format(value);
}

export default function Reports({ role }: { role: Role }) {
  void role;
  const [period, setPeriod] = useState<PeriodQuery>({
    startDate: firstDayOfMonthAsText(),
    endDate: todayAsText(),
  });
  const [orderBy, setOrderBy] = useState<RankingOrderBy>("value");
  const [commissionState, setCommissionState] = useState<ReportState<CommissionReport>>({ kind: "loading" });
  const [rankingState, setRankingState] = useState<ReportState<SalesRanking>>({ kind: "loading" });
  const [exporting, setExporting] = useState<"commission" | "ranking" | null>(null);
  const [exportError, setExportError] = useState("");

  const isPeriodValid = Boolean(period.startDate && period.endDate) && period.startDate <= period.endDate;

  // The loading state belongs to the action that changes the period, not to
  // the effect that fetches it.
  function updatePeriod(next: PeriodQuery) {
    setCommissionState({ kind: "loading" });
    setRankingState({ kind: "loading" });
    setPeriod(next);
  }

  function changeOrderBy(next: RankingOrderBy) {
    setRankingState({ kind: "loading" });
    setOrderBy(next);
  }

  useEffect(() => {
    if (!isPeriodValid) return;
    let isCurrent = true;
    fetchCommissionReport(period)
      .then((data) => {
        if (isCurrent) setCommissionState({ kind: "loaded", data });
      })
      .catch((error: unknown) => {
        if (isCurrent) setCommissionState({ kind: "failed", message: errorMessageOf(error, LOAD_ERROR) });
      });
    fetchSalesRanking(period, orderBy)
      .then((data) => {
        if (isCurrent) setRankingState({ kind: "loaded", data });
      })
      .catch((error: unknown) => {
        if (isCurrent) setRankingState({ kind: "failed", message: errorMessageOf(error, LOAD_ERROR) });
      });
    return () => {
      isCurrent = false;
    };
  }, [period, orderBy, isPeriodValid]);

  const exportCommission = useCallback(async () => {
    setExporting("commission");
    setExportError("");
    try {
      await downloadCommissionReport(period);
    } catch (error) {
      setExportError(errorMessageOf(error, EXPORT_ERROR));
    } finally {
      setExporting(null);
    }
  }, [period]);

  const exportRanking = useCallback(async () => {
    setExporting("ranking");
    setExportError("");
    try {
      await downloadSalesRanking(period, orderBy);
    } catch (error) {
      setExportError(errorMessageOf(error, EXPORT_ERROR));
    } finally {
      setExporting(null);
    }
  }, [period, orderBy]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-site-accent mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            EXPORTAÇÃO DE DADOS
          </p>
          <h1 className="text-[32px] text-site-text leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Relatórios
          </h1>
        </div>
        <div className="flex flex-col gap-3 xl:items-end">
          <div className="flex flex-wrap gap-1">
            <button onClick={() => updatePeriod({ startDate: firstDayOfMonthAsText(), endDate: todayAsText() })}
              className="px-4 py-2 text-[12px] tracking-[1px] bg-site-accent text-site-page" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
              MÊS ATUAL
            </button>
            <button onClick={() => updatePeriod({ startDate: firstDayOfMonthAsText(-1), endDate: lastDayOfMonthAsText(-1) })}
              className="px-4 py-2 text-[12px] tracking-[1px] border border-site-text/18 text-site-text/55 hover:text-site-text/90" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
              MÊS ANTERIOR
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <DateInput label="DE" value={period.startDate} onChange={(startDate) => updatePeriod({ ...period, startDate })} />
            <DateInput label="ATÉ" value={period.endDate} onChange={(endDate) => updatePeriod({ ...period, endDate })} />
          </div>
        </div>
      </div>

      {!isPeriodValid && (
        <p role="alert" className="mb-6 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          A data inicial não pode ser depois da data final.
        </p>
      )}
      {exportError && (
        <p role="alert" className="mb-6 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {exportError}
        </p>
      )}

      {/* Commission report */}
      <section className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] tracking-[2px] text-site-text/50" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>RELATÓRIO DE COMISSÕES</p>
            <p className="text-[13px] text-site-text/45 mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Total por funcionário no período selecionado.</p>
          </div>
          <ExportButton label="EXPORTAR PLANILHA" isExporting={exporting === "commission"} onClick={exportCommission} />
        </div>

        {commissionState.kind === "loading" ? (
          <Loading />
        ) : commissionState.kind === "failed" ? (
          <ErrorBox message={commissionState.message} />
        ) : (
          <>
            <div className="grid sm:grid-cols-4 gap-px bg-site-text/8 mb-px">
              <SummaryCard label="COMISSÃO TOTAL" value={BRL.format(commissionState.data.summary.totalCommission)} highlight />
              <SummaryCard label="VALOR VENDIDO" value={BRL.format(commissionState.data.summary.totalSalesValue)} />
              <SummaryCard label="VENDAS" value={String(commissionState.data.summary.totalSalesCount)} />
              <SummaryCard label="VENDEDORES" value={String(commissionState.data.summary.sellersCount)} />
            </div>
            <div className="border border-site-text/8 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-site-text/10">
                    {["FUNCIONÁRIO", "E-MAIL", "VENDAS", "VALOR VENDIDO", "COMISSÃO", "REGRA ATUAL"].map((header) => (
                      <th key={header} className="px-5 py-4 text-left text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissionState.data.employees.map((employee) => (
                    <tr key={employee.employeeId} className="border-b border-site-text/6">
                      <td className="px-5 py-4 text-[14px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
                        {employee.name}
                        {employee.isDeleted && <span className="ml-2 text-[10px] tracking-[1px] text-site-text/35">EXCLUÍDO</span>}
                      </td>
                      <td className="px-5 py-4 text-[13px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{employee.email}</td>
                      <td className="px-5 py-4 text-[13px] text-site-text/65" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{employee.salesCount}</td>
                      <td className="px-5 py-4 text-[14px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{BRL.format(employee.totalSalesValue)}</td>
                      <td className="px-5 py-4 text-[14px] text-site-accent" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{BRL.format(employee.totalCommission)}</td>
                      <td className="px-5 py-4 text-[12px] text-site-text/50" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{formatRule(employee.commissionType, employee.commissionValue)}</td>
                    </tr>
                  ))}
                  {commissionState.data.employees.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-12 text-center text-[14px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Nenhum funcionário com regra de comissão ou venda no período.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* Sales ranking */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <p className="text-[11px] tracking-[2px] text-site-text/50" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>RANKING DE VENDAS</p>
            <p className="text-[13px] text-site-text/45 mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Funcionários ordenados pelo período selecionado.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex">
              {([["value", "VALOR"], ["volume", "VOLUME"]] as const).map(([value, label]) => (
                <button key={value} onClick={() => changeOrderBy(value)}
                  className={`px-3 py-2 text-[11px] tracking-[1px] border ${orderBy === value ? "border-site-accent bg-site-accent/10 text-site-accent" : "border-site-text/15 text-site-text/50"}`}
                  style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                  {label}
                </button>
              ))}
            </div>
            <ExportButton label="EXPORTAR PLANILHA" isExporting={exporting === "ranking"} onClick={exportRanking} />
          </div>
        </div>

        {rankingState.kind === "loading" ? (
          <Loading />
        ) : rankingState.kind === "failed" ? (
          <ErrorBox message={rankingState.message} />
        ) : rankingState.data.ranking.length === 0 ? (
          <p className="py-12 text-center text-[14px] text-site-text/45 border border-site-text/8" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Nenhuma venda no período selecionado.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-site-text/8">
            {rankingState.data.ranking.map((entry) => (
              <div key={entry.employeeId} className="bg-site-page p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>#{entry.position}</span>
                  {entry.position === 1 && <Trophy size={16} className="text-site-accent" />}
                </div>
                <p className="text-[15px] text-site-text mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{entry.name}</p>
                <p className="text-[26px] text-site-accent leading-tight mb-1" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{BRL.format(entry.totalSalesValue)}</p>
                <p className="text-[12px] text-site-text/40" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  {entry.salesCount} venda(s) · ticket médio {BRL.format(entry.averageTicket)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="mt-8 flex items-start gap-3 border border-site-text/8 px-5 py-4">
        <AlertCircle size={15} className="text-site-text/35 flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-site-text/40 leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          As planilhas de comissões e do ranking são exportadas em CSV, com os mesmos dados exibidos na tela. Para o PDF e a planilha XLSX das estatísticas de orçamentos, use o Dashboard.
        </p>
      </div>
    </div>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[11px] tracking-[2px] text-site-text/45" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</span>
      <input type="date" value={value} onChange={(event) => onChange(event.target.value)}
        className="h-[36px] px-3 bg-site-card border border-site-text/18 text-site-text text-[13px] outline-none focus:border-site-accent [color-scheme:dark]"
        style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
    </label>
  );
}

function SummaryCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-site-page px-6 py-5">
      <p className={`text-[24px] leading-tight mb-1 ${highlight ? "text-site-accent" : "text-site-text"}`} style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{value}</p>
      <p className="text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</p>
    </div>
  );
}

function ExportButton({ label, isExporting, onClick }: { label: string; isExporting: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 text-[12px] tracking-[1px] border border-site-accent/45 text-site-accent hover:bg-site-accent/8 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
      {isExporting ? <Download size={14} className="animate-pulse" /> : <FileSpreadsheet size={14} />}
      {isExporting ? "GERANDO..." : label}
    </button>
  );
}

function Loading() {
  return <p className="py-16 text-center text-[14px] text-site-text/45" aria-live="polite" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Carregando relatório...</p>;
}

function ErrorBox({ message }: { message: string }) {
  return <p role="alert" className="py-10 px-4 border border-red-500/30 text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{message}</p>;
}
