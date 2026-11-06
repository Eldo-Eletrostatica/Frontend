import { useState } from "react";
import { FileDown, FileText, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import type { Role } from "../App";

interface ReportTemplate {
  id: string;
  title: string;
  description: string;
  formats: ("PDF" | "XLSX")[];
  category: string;
  rows: string;
}

const TEMPLATES: ReportTemplate[] = [
  {
    id: "volume-mensal",
    title: "Volume de orçamentos mensais",
    description: "Quantidade total de orçamentos recebidos, organizados por mês e período selecionado.",
    formats: ["PDF", "XLSX"],
    category: "Orçamentos",
    rows: "~720 linhas / ano",
  },
  {
    id: "taxa-conversao",
    title: "Taxa de conversão por período",
    description: "Relação entre orçamentos enviados e serviços efetivamente contratados.",
    formats: ["PDF", "XLSX"],
    category: "Comercial",
    rows: "~12 linhas / mês",
  },
  {
    id: "servicos-populares",
    title: "Serviços mais solicitados",
    description: "Ranking dos tipos de serviço com maior volume de pedidos no período.",
    formats: ["PDF", "XLSX"],
    category: "Operação",
    rows: "~5–20 categorias",
  },
  {
    id: "tempo-resposta",
    title: "Tempo médio de resposta",
    description: "Análise do tempo entre recebimento do orçamento e retorno ao cliente.",
    formats: ["PDF"],
    category: "Atendimento",
    rows: "~30 linhas / mês",
  },
  {
    id: "clientes-recorrentes",
    title: "Clientes recorrentes",
    description: "Identificação de contatos que solicitaram serviços mais de uma vez no período.",
    formats: ["XLSX"],
    category: "Comercial",
    rows: "Variável",
  },
];

type ExportStatus = "idle" | "loading" | "done" | "error";

interface ExportState {
  id: string;
  format: "PDF" | "XLSX";
  status: ExportStatus;
}

export default function Reports({ role }: { role: Role }) {
  void role;
  const [period, setPeriod] = useState("2025");
  const [exports, setExports] = useState<ExportState[]>([]);
  const [activeCategory, setActiveCategory] = useState("Todos");

  const categories = ["Todos", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];

  const filtered = activeCategory === "Todos"
    ? TEMPLATES
    : TEMPLATES.filter((t) => t.category === activeCategory);

  function triggerExport(id: string, format: "PDF" | "XLSX") {
    const key = `${id}-${format}`;
    setExports((prev) => [
      ...prev.filter((e) => e.id !== key),
      { id: key, format, status: "loading" },
    ]);
    setTimeout(() => {
      setExports((prev) =>
        prev.map((e) => (e.id === key ? { ...e, status: "done" } : e))
      );
    }, 1800);
  }

  function getExportState(id: string, format: "PDF" | "XLSX"): ExportStatus {
    return exports.find((e) => e.id === `${id}-${format}`)?.status ?? "idle";
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            EXPORTAÇÃO DE DADOS
          </p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Relatórios
          </h1>
        </div>
        {/* Period */}
        <div className="flex items-center gap-3">
          <label className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            PERÍODO
          </label>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-[40px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors"
            style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
          >
            <option>2025</option>
            <option>2024</option>
            <option>2023</option>
            <option>Últimos 6 meses</option>
            <option>Último mês</option>
          </select>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-[11px] tracking-[1.5px] transition-all ${
              activeCategory === cat
                ? "bg-[#e9b421] text-[#12100d]"
                : "border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.9)]"
            }`}
            style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Report cards */}
      <div className="grid md:grid-cols-2 gap-px bg-[rgba(245,242,236,0.08)]">
        {filtered.map((tpl) => (
          <div key={tpl.id} className="bg-[#12100d] p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span
                  className="inline-block text-[10px] tracking-[1.8px] text-[rgba(245,242,236,0.4)] border border-[rgba(245,242,236,0.12)] px-2 py-0.5 mb-3"
                  style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}
                >
                  {tpl.category.toUpperCase()}
                </span>
                <h3 className="text-[17px] text-[#f5f2ec] leading-[1.3]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
                  {tpl.title}
                </h3>
              </div>
              <FileText size={20} className="text-[rgba(245,242,236,0.2)] flex-shrink-0 mt-1" />
            </div>

            <p className="text-[13px] text-[rgba(245,242,236,0.55)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              {tpl.description}
            </p>

            <p className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.3)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
              {tpl.rows} · {period}
            </p>

            <div className="flex items-center gap-3 mt-auto pt-2 border-t border-[rgba(245,242,236,0.07)]">
              {tpl.formats.map((fmt) => (
                <ExportButton
                  key={fmt}
                  format={fmt}
                  status={getExportState(tpl.id, fmt)}
                  onClick={() => triggerExport(tpl.id, fmt)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info note */}
      <div className="mt-8 flex items-start gap-3 border border-[rgba(245,242,236,0.08)] px-5 py-4">
        <AlertCircle size={15} className="text-[rgba(245,242,236,0.35)] flex-shrink-0 mt-0.5" />
        <p className="text-[12px] text-[rgba(245,242,236,0.4)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Os arquivos exportados utilizam os dados consolidados do período selecionado. Relatórios em PDF seguem o modelo de apresentação institucional da Eldo. Planilhas incluem todas as colunas brutas para análise avançada.
        </p>
      </div>
    </div>
  );
}

function ExportButton({ format, status, onClick }: { format: "PDF" | "XLSX"; status: ExportStatus; onClick: () => void }) {
  const label = format === "PDF" ? "Exportar PDF" : "Exportar XLSX";

  if (status === "loading") {
    return (
      <button
        disabled
        className="flex items-center gap-2 px-4 py-2 border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.35)] text-[12px]"
        style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
      >
        <Clock size={13} className="animate-spin" />
        Gerando...
      </button>
    );
  }

  if (status === "done") {
    return (
      <button
        className="flex items-center gap-2 px-4 py-2 border border-[rgba(233,180,33,0.35)] text-[#e9b421] text-[12px] hover:bg-[rgba(233,180,33,0.08)] transition-colors"
        style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
        onClick={onClick}
      >
        <CheckCircle2 size={13} />
        {format} pronto
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)] text-[12px] hover:border-[#e9b421] hover:text-[#e9b421] transition-all"
      style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
    >
      <FileDown size={13} />
      {label}
    </button>
  );
}
