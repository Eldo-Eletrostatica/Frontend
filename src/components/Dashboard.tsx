"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertCircle, BarChart3, CheckCircle, FileDown, FileSpreadsheet, FileText, Percent } from "lucide-react";
import type { Role } from "@/lib/auth/AuthProvider";
import { ApiError } from "@/lib/api/ApiError";
import {
  downloadStatisticsReport,
  fetchStatistics,
  type ExportFormat,
  type Statistics,
} from "@/lib/statistics/statisticsApi";
import {
  DEFAULT_PERIOD_PRESET,
  formatDay,
  PERIOD_PRESETS,
  periodOfPreset,
  type PeriodPreset,
  type StatisticsPeriod,
} from "@/lib/statistics/statisticsPeriod";

const GOLD = "#e9b421";
const FALLBACK_ERROR = "Não foi possível carregar os indicadores. Tente novamente.";
const INVALID_PERIOD_MESSAGE = "A data inicial não pode ser depois da data final.";
// Chart labels longer than this are cut; the ranking beside shows the full name.
const MAX_CHART_LABEL_LENGTH = 18;

const PERCENT_FORMAT = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

const EXPORT_LABELS: Record<ExportFormat, string> = { pdf: "PDF", xlsx: "PLANILHA" };

type StatisticsResult =
  | { status: "loaded"; statistics: Statistics }
  | { status: "error"; message: string };

type StatisticsState = { status: "loading" } | StatisticsResult;

// The result remembers the period it answers, so a period changed after the
// request reads as loading without an extra state update.
interface PeriodResult {
  periodKey: string;
  result: StatisticsResult;
}

type ExportState =
  | { status: "idle" }
  | { status: "exporting"; format: ExportFormat }
  | { status: "warning"; message: string };

interface Props { role: Role }

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function isValidPeriod(period: StatisticsPeriod): boolean {
  return Boolean(period.startDate && period.endDate) && period.startDate <= period.endDate;
}

// US11: the indicators of the selected period. US12: the same numbers exported
// as a PDF or a spreadsheet.
export default function Dashboard({ role }: Props) {
  void role;
  const [activePreset, setActivePreset] = useState<PeriodPreset | null>(DEFAULT_PERIOD_PRESET);
  const [period, setPeriod] = useState<StatisticsPeriod>(() => periodOfPreset(DEFAULT_PERIOD_PRESET));
  const [periodResult, setPeriodResult] = useState<PeriodResult | null>(null);
  const [exportState, setExportState] = useState<ExportState>({ status: "idle" });
  const isPeriodValid = isValidPeriod(period);
  const periodKey = `${period.startDate}/${period.endDate}`;
  const state: StatisticsState =
    periodResult?.periodKey === periodKey ? periodResult.result : { status: "loading" };

  useEffect(() => {
    if (!isPeriodValid) return;
    // A slower answer for a period the manager already left must not
    // overwrite the current one.
    let isCurrent = true;
    fetchStatistics(period)
      .then((statistics) => {
        if (isCurrent) setPeriodResult({ periodKey, result: { status: "loaded", statistics } });
      })
      .catch((error: unknown) => {
        if (isCurrent) setPeriodResult({ periodKey, result: { status: "error", message: errorMessageOf(error, FALLBACK_ERROR) } });
      });
    return () => {
      isCurrent = false;
    };
  }, [period, periodKey, isPeriodValid]);

  function selectPreset(preset: PeriodPreset) {
    setActivePreset(preset);
    setPeriod(periodOfPreset(preset));
    setExportState({ status: "idle" });
  }

  function changeDate(field: keyof StatisticsPeriod, value: string) {
    setActivePreset(null);
    setPeriod((current) => ({ ...current, [field]: value }));
    setExportState({ status: "idle" });
  }

  async function exportReport(format: ExportFormat) {
    setExportState({ status: "exporting", format });
    try {
      await downloadStatisticsReport(period, format);
      setExportState({ status: "idle" });
    } catch (error) {
      // The Backend answers 422 with "Não há dados para exportar no período."
      setExportState({ status: "warning", message: errorMessageOf(error, "Não foi possível exportar o relatório.") });
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            ANÁLISE ESTRATÉGICA
          </p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Dashboard
          </h1>
        </div>

        <div className="flex flex-col gap-3 xl:items-end">
          {/* Period presets */}
          <div className="flex flex-wrap gap-1">
            {PERIOD_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => selectPreset(preset.id)}
                aria-pressed={activePreset === preset.id}
                className={`px-4 py-2 text-[12px] tracking-[1px] transition-all ${
                  activePreset === preset.id
                    ? "bg-[#e9b421] text-[#12100d]"
                    : "border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.55)] hover:text-[rgba(245,242,236,0.9)]"
                }`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
              >
                {preset.label.toUpperCase()}
              </button>
            ))}
          </div>
          {/* Custom period */}
          <div className="flex flex-wrap items-center gap-2">
            <DateInput label="DE" value={period.startDate} onChange={(value) => changeDate("startDate", value)} />
            <DateInput label="ATÉ" value={period.endDate} onChange={(value) => changeDate("endDate", value)} />
          </div>
        </div>
      </div>

      {/* Export (US12) */}
      <div className="flex flex-wrap items-center gap-3 mb-6 pb-6 border-b border-[rgba(245,242,236,0.08)]">
        <span className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mr-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          EXPORTAR O PERÍODO
        </span>
        {(["pdf", "xlsx"] as const).map((format) => {
          const isExporting = exportState.status === "exporting" && exportState.format === format;
          return (
            <button
              key={format}
              type="button"
              onClick={() => exportReport(format)}
              disabled={!isPeriodValid || exportState.status === "exporting"}
              className="flex items-center gap-2 px-4 py-2 text-[12px] tracking-[1px] border border-[rgba(233,180,33,0.45)] text-[#e9b421] hover:bg-[rgba(233,180,33,0.08)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
            >
              {format === "pdf" ? <FileDown size={14} /> : <FileSpreadsheet size={14} />}
              {isExporting ? "GERANDO..." : EXPORT_LABELS[format]}
            </button>
          );
        })}
        {exportState.status === "warning" && (
          <p role="alert" className="flex items-center gap-2 text-[13px] text-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            <AlertCircle size={14} /> {exportState.message}
          </p>
        )}
      </div>

      {!isPeriodValid ? (
        <Notice title="Período inválido" description={INVALID_PERIOD_MESSAGE} />
      ) : state.status === "loading" ? (
        <p className="py-16 text-center text-[14px] text-[rgba(245,242,236,0.45)]" aria-live="polite" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Carregando indicadores...
        </p>
      ) : state.status === "error" ? (
        <Notice title="Indicadores indisponíveis" description={state.message} />
      ) : (
        <StatisticsView statistics={state.statistics} />
      )}
    </div>
  );
}

function StatisticsView({ statistics }: { statistics: Statistics }) {
  const periodText = `${formatDay(statistics.startDate)} a ${formatDay(statistics.endDate)}`;

  if (!statistics.hasData) {
    return (
      <Notice
        title="Sem dados neste período"
        description={`Nenhum orçamento ou pedido com tipo de pintura no período de ${periodText}. Escolha outro período para ver os indicadores.`}
      />
    );
  }

  const conversionRate = statistics.conversionRate;
  const chartData = statistics.topPaintTypes.map((paintType) => ({
    name: paintType.name.length > MAX_CHART_LABEL_LENGTH ? `${paintType.name.slice(0, MAX_CHART_LABEL_LENGTH)}…` : paintType.name,
    fullName: paintType.name,
    orderCount: paintType.orderCount,
  }));

  return (
    <>
      <p className="mb-4 text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
        Período: {periodText}
      </p>

      {/* KPI cards */}
      <div className="grid sm:grid-cols-3 gap-px bg-[rgba(245,242,236,0.08)]">
        <KpiCard label="ORÇAMENTOS NO PERÍODO" value={String(statistics.quoteCount)} sub="Pedidos por PDF ou pelo simulador" icon={<FileText size={16} />} />
        <KpiCard label="VIRARAM VENDA" value={String(statistics.convertedQuoteCount)} sub="Dos orçamentos criados no período" icon={<CheckCircle size={16} />} />
        <KpiCard
          label="TAXA DE CONVERSÃO"
          value={conversionRate === null ? "—" : PERCENT_FORMAT.format(conversionRate)}
          sub={conversionRate === null ? "Sem orçamentos no período" : "Orçamentos que viraram venda"}
          icon={<Percent size={16} />}
          progress={conversionRate}
        />
      </div>

      {/* Most requested paint types */}
      <div className="grid lg:grid-cols-3 gap-px bg-[rgba(245,242,236,0.08)] mt-px">
        <div className="lg:col-span-2 bg-[#12100d] p-6">
          <ChartLabel>TIPOS DE PINTURA MAIS PEDIDOS</ChartLabel>
          {chartData.length === 0 ? (
            <p className="mt-6 text-[13px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Nenhum pedido com tipo de pintura no período.
            </p>
          ) : (
            <div className="h-[260px] mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(245,242,236,0.06)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "rgba(245,242,236,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={130} tick={{ fill: "rgba(245,242,236,0.7)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<RankingTooltip />} cursor={{ fill: "rgba(245,242,236,0.04)" }} />
                  <Bar dataKey="orderCount" name="Pedidos" fill={GOLD} radius={[0, 2, 2, 0]} maxBarSize={26} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-[#12100d] p-6">
          <div className="flex items-center gap-3">
            <BarChart3 size={16} className="text-[#e9b421]" />
            <ChartLabel>RANKING</ChartLabel>
          </div>
          <ol className="flex flex-col gap-3 mt-5">
            {statistics.topPaintTypes.map((paintType, index) => (
              <li key={paintType.catalogItemId} className="flex items-center justify-between gap-3">
                <span className="flex items-center gap-3 min-w-0">
                  <span className="text-[12px] text-[#e9b421] w-5 flex-shrink-0" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{index + 1}º</span>
                  <span className="text-[13px] text-[rgba(245,242,236,0.75)] break-words" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{paintType.name}</span>
                </span>
                <span className="text-[13px] text-[#f5f2ec] flex-shrink-0" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
                  {paintType.orderCount} {paintType.orderCount === 1 ? "pedido" : "pedidos"}
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-[11px] text-[rgba(245,242,236,0.35)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Conta os pedidos do período de qualquer origem e etapa, inclusive vendas diretas.
          </p>
        </div>
      </div>
    </>
  );
}

function DateInput({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="flex items-center gap-2">
      <span className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</span>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-[36px] px-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors [color-scheme:dark]"
        style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
      />
    </label>
  );
}

function KpiCard({ label, value, sub, icon, progress }: { label: string; value: string; sub: string; icon: React.ReactNode; progress?: number | null }) {
  return (
    <div className="bg-[#12100d] px-6 py-5">
      <span className="text-[rgba(245,242,236,0.4)]">{icon}</span>
      <p className="text-[32px] text-[#f5f2ec] leading-tight mt-3" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
        {value}
      </p>
      <p className="text-[11px] tracking-[1.8px] text-[rgba(245,242,236,0.4)] mt-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
        {label}
      </p>
      {typeof progress === "number" && (
        <div className="mt-3 h-[3px] bg-[rgba(245,242,236,0.08)]" aria-hidden="true">
          <div className="h-full bg-[#e9b421]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
      )}
      <p className="text-[12px] text-[rgba(245,242,236,0.45)] mt-2" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
        {sub}
      </p>
    </div>
  );
}

function Notice({ title, description }: { title: string; description: string }) {
  return (
    <div className="py-16 px-6 text-center bg-[#12100d] border border-[rgba(245,242,236,0.08)]">
      <p className="text-[18px] text-[#f5f2ec] mb-2" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{title}</p>
      <p className="text-[14px] text-[rgba(245,242,236,0.55)] max-w-[520px] mx-auto" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{description}</p>
    </div>
  );
}

function ChartLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
      {children}
    </p>
  );
}

interface RankingTooltipProps {
  active?: boolean;
  payload?: ReadonlyArray<{ value?: number | string; payload?: { fullName?: string } }>;
}

function RankingTooltip({ active, payload }: RankingTooltipProps) {
  if (!active || !payload?.length) return null;
  const [entry] = payload;
  return (
    <div className="px-3 py-2 border border-[rgba(245,242,236,0.12)]" style={{ background: "#1a1713" }}>
      <p className="text-[13px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
        {entry.payload?.fullName}: {entry.value} {entry.value === 1 ? "pedido" : "pedidos"}
      </p>
    </div>
  );
}
