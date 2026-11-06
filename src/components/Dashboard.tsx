import { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import type { Role } from "../App";
import { TrendingUp, TrendingDown, FileText, CheckCircle, Clock, Wrench } from "lucide-react";

const monthlyData = [
  { mes: "Jan", orcamentos: 38, convertidos: 24 },
  { mes: "Fev", orcamentos: 42, convertidos: 28 },
  { mes: "Mar", orcamentos: 51, convertidos: 34 },
  { mes: "Abr", orcamentos: 46, convertidos: 31 },
  { mes: "Mai", orcamentos: 58, convertidos: 41 },
  { mes: "Jun", orcamentos: 64, convertidos: 47 },
  { mes: "Jul", orcamentos: 59, convertidos: 39 },
  { mes: "Ago", orcamentos: 71, convertidos: 54 },
  { mes: "Set", orcamentos: 68, convertidos: 49 },
  { mes: "Out", orcamentos: 75, convertidos: 57 },
  { mes: "Nov", orcamentos: 82, convertidos: 63 },
  { mes: "Dez", orcamentos: 79, convertidos: 58 },
];

const serviceData = [
  { name: "Estrutura metálica", value: 34 },
  { name: "Portões e grades", value: 27 },
  { name: "Máquinas industriais", value: 19 },
  { name: "Mobiliário", value: 12 },
  { name: "Outros", value: 8 },
];

const GOLD = "#e9b421";
const GOLD_DIM = "rgba(233,180,33,0.4)";
const SERVICE_COLORS = [GOLD, "rgba(233,180,33,0.65)", "rgba(233,180,33,0.45)", "rgba(233,180,33,0.28)", "rgba(245,242,236,0.18)"];

const conversionRate = Math.round((monthlyData.reduce((a, d) => a + d.convertidos, 0) / monthlyData.reduce((a, d) => a + d.orcamentos, 0)) * 100);
const totalOrcamentos = monthlyData.reduce((a, d) => a + d.orcamentos, 0);
const totalConvertidos = monthlyData.reduce((a, d) => a + d.convertidos, 0);

const PERIODS = ["Este mês", "Últimos 6 meses", "Este ano"];

interface Props { role: Role }

export default function Dashboard({ role }: Props) {
  void role;
  const [period, setPeriod] = useState("Este ano");

  const filtered = period === "Este mês"
    ? monthlyData.slice(-1)
    : period === "Últimos 6 meses"
    ? monthlyData.slice(-6)
    : monthlyData;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            ANÁLISE ESTRATÉGICA
          </p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Dashboard
          </h1>
        </div>
        {/* Period selector */}
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-[12px] tracking-[1px] transition-all ${
                period === p
                  ? "bg-[#e9b421] text-[#12100d]"
                  : "border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.55)] hover:text-[rgba(245,242,236,0.9)]"
              }`}
              style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
            >
              {p.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-px bg-[rgba(245,242,236,0.08)]">
        <KpiCard
          label="TOTAL DE ORÇAMENTOS"
          value={totalOrcamentos.toString()}
          sub="+12% vs. período anterior"
          trend="up"
          icon={<FileText size={16} />}
        />
        <KpiCard
          label="ORÇAMENTOS CONVERTIDOS"
          value={totalConvertidos.toString()}
          sub="+18% vs. período anterior"
          trend="up"
          icon={<CheckCircle size={16} />}
        />
        <KpiCard
          label="TAXA DE CONVERSÃO"
          value={`${conversionRate}%`}
          sub="Meta: 70%"
          trend={conversionRate >= 70 ? "up" : "down"}
          icon={<TrendingUp size={16} />}
        />
        <KpiCard
          label="TEMPO MÉDIO RESPOSTA"
          value="4h 20min"
          sub="−35min vs. mês anterior"
          trend="up"
          icon={<Clock size={16} />}
        />
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-px bg-[rgba(245,242,236,0.08)] mt-px mb-px">
        {/* Volume chart — 2 cols */}
        <div className="lg:col-span-2 bg-[#12100d] p-6">
          <ChartLabel>VOLUME DE ORÇAMENTOS × CONVERSÕES</ChartLabel>
          <div className="h-[260px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filtered} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradOrc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.25} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradConv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GOLD} stopOpacity={0.12} />
                    <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(245,242,236,0.06)" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: "rgba(245,242,236,0.4)", fontSize: 11, fontFamily: "'Barlow Condensed:Regular'" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(245,242,236,0.4)", fontSize: 11, fontFamily: "'Barlow Condensed:Regular'" }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="orcamentos" name="Orçamentos" stroke={GOLD} strokeWidth={2} fill="url(#gradOrc)" dot={false} />
                <Area type="monotone" dataKey="convertidos" name="Convertidos" stroke={GOLD_DIM} strokeWidth={1.5} fill="url(#gradConv)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 mt-4">
            <LegendDot color={GOLD} label="Orçamentos" />
            <LegendDot color={GOLD_DIM} label="Convertidos" />
          </div>
        </div>

        {/* Service pie — 1 col */}
        <div className="bg-[#12100d] p-6">
          <ChartLabel>SERVIÇOS MAIS SOLICITADOS</ChartLabel>
          <div className="h-[200px] mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  strokeWidth={0}
                >
                  {serviceData.map((_, i) => (
                    <Cell key={i} fill={SERVICE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col gap-2 mt-2">
            {serviceData.map((s, i) => (
              <div key={s.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: SERVICE_COLORS[i] }} />
                  <span className="text-[12px] text-[rgba(245,242,236,0.6)] truncate" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                    {s.name}
                  </span>
                </div>
                <span className="text-[12px] text-[rgba(245,242,236,0.85)] ml-2 flex-shrink-0" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
                  {s.value}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly bar */}
      <div className="bg-[#12100d] border-t border-[rgba(245,242,236,0.08)] p-6">
        <div className="flex items-center gap-3 mb-6">
          <Wrench size={16} className="text-[#e9b421]" />
          <ChartLabel>ORÇAMENTOS POR MÊS (COMPARAÇÃO)</ChartLabel>
        </div>
        <div className="h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={filtered} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barGap={3}>
              <CartesianGrid stroke="rgba(245,242,236,0.06)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: "rgba(245,242,236,0.4)", fontSize: 11, fontFamily: "'Barlow Condensed:Regular'" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(245,242,236,0.4)", fontSize: 11, fontFamily: "'Barlow Condensed:Regular'" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orcamentos" name="Orçamentos" fill={GOLD} radius={[2, 2, 0, 0]} maxBarSize={28} />
              <Bar dataKey="convertidos" name="Convertidos" fill="rgba(233,180,33,0.35)" radius={[2, 2, 0, 0]} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, trend, icon }: { label: string; value: string; sub: string; trend: "up" | "down"; icon: React.ReactNode }) {
  return (
    <div className="bg-[#12100d] px-6 py-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[rgba(245,242,236,0.4)]">{icon}</span>
        {trend === "up"
          ? <TrendingUp size={14} className="text-[#e9b421]" />
          : <TrendingDown size={14} className="text-[rgba(245,242,236,0.4)]" />
        }
      </div>
      <p className="text-[32px] text-[#f5f2ec] leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
        {value}
      </p>
      <p className="text-[11px] tracking-[1.8px] text-[rgba(245,242,236,0.4)] mt-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
        {label}
      </p>
      <p className="text-[12px] text-[rgba(245,242,236,0.45)] mt-2" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
        {sub}
      </p>
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

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-[12px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
        {label}
      </span>
    </div>
  );
}

interface ChartTooltipPayload { name?: string; value?: number | string; color?: string; }
interface ChartTooltipProps { active?: boolean; payload?: ReadonlyArray<ChartTooltipPayload>; label?: React.ReactNode; }

function CustomTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-4 py-3 border border-[rgba(245,242,236,0.12)]" style={{ background: "#1a1713" }}>
      <p className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.5)] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
        {label}
      </p>
      {payload.map((p) => (
        <p key={p.name} className="text-[13px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
          <span style={{ color: p.color }}>{p.name}: </span>{p.value}
        </p>
      ))}
    </div>
  );
}

function PieTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 border border-[rgba(245,242,236,0.12)]" style={{ background: "#1a1713" }}>
      <p className="text-[13px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
        {payload[0].name}: {payload[0].value}%
      </p>
    </div>
  );
}
