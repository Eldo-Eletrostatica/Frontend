import { useState } from "react";
import { ArrowLeft, Clock, CheckCircle2, Circle, ChevronRight } from "lucide-react";
import type { ServiceOrder, ServiceStatus } from "../lib/servicesContext";
import { STATUS_CONFIG } from "../lib/servicesContext";
import EldoLogo from "./EldoLogo";

interface Props {
  orders: ServiceOrder[];
  clientName: string;
  onBack: () => void;
}

const STEPS: ServiceStatus[] = ["fila", "producao", "finalizacao", "concluido"];

const STEP_INFO: Record<ServiceStatus, { desc: string; icon: string }> = {
  fila:        { desc: "Aguardando início da produção", icon: "⏳" },
  producao:    { desc: "Processo de pintura em andamento", icon: "🔧" },
  finalizacao: { desc: "Acabamento e inspeção de qualidade", icon: "🔍" },
  concluido:   { desc: "Serviço concluído e pronto para entrega", icon: "✅" },
};

function isLate(deadline: string, status: ServiceStatus) {
  return status !== "concluido" && new Date(deadline) < new Date();
}

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function StatusTracker({ status }: { status: ServiceStatus }) {
  const current = STATUS_CONFIG[status].step;
  return (
    <div className="flex items-center gap-0 w-full">
      {STEPS.map((s, i) => {
        const step = STATUS_CONFIG[s].step;
        const done = step < current;
        const active = step === current;
        return (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2 min-w-[80px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "bg-[#e9b421] border-[#e9b421]" :
                active ? "border-[#e9b421] bg-[rgba(233,180,33,0.15)]" :
                "border-[rgba(245,242,236,0.2)] bg-transparent"
              }`}>
                {done ? (
                  <CheckCircle2 size={16} className="text-[#12100d]" />
                ) : active ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e9b421]" />
                ) : (
                  <Circle size={14} className="text-[rgba(245,242,236,0.25)]" />
                )}
              </div>
              <p className={`text-[10px] tracking-[1.5px] text-center leading-tight ${active ? "text-[#e9b421]" : done ? "text-[rgba(245,242,236,0.6)]" : "text-[rgba(245,242,236,0.25)]"}`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                {STATUS_CONFIG[s].label.toUpperCase()}
              </p>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mb-5 mx-1 ${step < current ? "bg-[#e9b421]" : "bg-[rgba(245,242,236,0.1)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order, expanded, onToggle }: { order: ServiceOrder; expanded: boolean; onToggle: () => void }) {
  const late = isLate(order.deadline, order.status);
  const cfg = STATUS_CONFIG[order.status];

  return (
    <div className={`border transition-colors ${expanded ? "border-[rgba(233,180,33,0.3)]" : "border-[rgba(245,242,236,0.1)] hover:border-[rgba(245,242,236,0.2)]"}`}
      style={{ background: expanded ? "rgba(233,180,33,0.03)" : "#171511" }}>
      {/* Header row */}
      <button className="w-full flex items-center justify-between px-6 py-5 text-left" onClick={onToggle}>
        <div className="flex items-center gap-5">
          <div>
            <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)] mb-0.5" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
              {order.code} {order.saleCode && `· ${order.saleCode}`}
            </p>
            <p className="text-[16px] text-[#f5f2ec] leading-tight" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
              {order.scope}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0 ml-4">
          <div className="text-right hidden sm:block">
            {late && (
              <p className="text-[11px] text-red-400 tracking-[1.5px] mb-0.5" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>PRAZO EXPIRADO</p>
            )}
            <p className={`text-[13px] tracking-[1.5px] ${order.status === "concluido" ? "text-emerald-400" : order.status === "producao" ? "text-[#e9b421]" : "text-[rgba(245,242,236,0.55)]"}`}
              style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
              {cfg.label.toUpperCase()}
            </p>
          </div>
          <ChevronRight size={16} className={`text-[rgba(245,242,236,0.3)] transition-transform ${expanded ? "rotate-90" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div className="px-6 pb-8 border-t border-[rgba(245,242,236,0.08)]">
          <div className="pt-8 mb-8 overflow-x-auto">
            <StatusTracker status={order.status} />
          </div>

          <div className="flex items-start gap-3 px-5 py-4 mb-6 border border-[rgba(233,180,33,0.15)]" style={{ background: "rgba(233,180,33,0.04)" }}>
            <span className="text-[18px] mt-0.5">{STEP_INFO[order.status].icon}</span>
            <div>
              <p className="text-[13px] text-[#e9b421] mb-0.5" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                {cfg.label}
              </p>
              <p className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                {STEP_INFO[order.status].desc}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(245,242,236,0.08)]">
            {[
              { label: "ABERTURA",     value: formatDate(order.createdAt) },
              { label: "PRAZO",        value: formatDate(order.deadline), highlight: late },
              { label: "RESPONSÁVEL",  value: order.responsible },
              { label: "CLIENTE",      value: order.client },
            ].map((f) => (
              <div key={f.label} className="bg-[#12100d] px-4 py-4">
                <p className="text-[10px] tracking-[2px] text-[rgba(245,242,236,0.35)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{f.label}</p>
                <p className={`text-[14px] ${f.highlight ? "text-red-400" : "text-[#f5f2ec]"}`} style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{f.value}</p>
              </div>
            ))}
          </div>

          {order.notes && (
            <div className="mt-5 px-4 py-3 border-l-2 border-[rgba(245,242,236,0.2)]">
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.35)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>OBSERVAÇÕES</p>
              <p className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{order.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ClientPortal({ orders, clientName, onBack }: Props) {
  const [expanded, setExpanded] = useState<number | null>(orders[0]?.id ?? null);

  const active = orders.filter((o) => o.status !== "concluido");
  const done = orders.filter((o) => o.status === "concluido");

  return (
    <div className="min-h-screen" style={{ background: "#12100d" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b border-[rgba(245,242,236,0.08)]"
        style={{ background: "rgba(18,16,13,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-[900px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="flex items-center gap-2 text-[rgba(245,242,236,0.4)] hover:text-[rgba(245,242,236,0.8)] transition-colors">
              <ArrowLeft size={16} />
              <span className="text-[11px] tracking-[2px]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SAIR</span>
            </button>
            <div className="w-px h-4 bg-[rgba(245,242,236,0.15)]" />
            <EldoLogo imageClassName="w-[30px] h-[30px]" subtitle="ÁREA DO CLIENTE" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[12px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{clientName}</span>
          </div>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 pt-12 pb-20">
        {/* Welcome */}
        <div className="border-b border-[rgba(245,242,236,0.1)] pb-10 mb-12">
          <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            ELDO PINTURA ELETROSTÁTICA
          </p>
          <h1 className="text-[36px] text-[#f5f2ec] leading-[1.1] tracking-[-0.8px] mb-3" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Olá, {clientName.split(" ")[0]}
          </h1>
          <p className="text-[14px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {orders.length === 1
              ? "Você tem 1 ordem de serviço registrada."
              : `Você tem ${orders.length} ordens de serviço registradas.`}
          </p>
        </div>

        {/* Summary chips */}
        <div className="flex flex-wrap gap-3 mb-10">
          {[
            { label: "EM ANDAMENTO", count: active.length, color: "border-[#e9b421] text-[#e9b421]" },
            { label: "CONCLUÍDAS",   count: done.length,   color: "border-emerald-400 text-emerald-400" },
          ].map((c) => (
            <div key={c.label} className={`flex items-center gap-2 px-4 py-2 border ${c.color}`}>
              <span className="text-[20px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{c.count}</span>
              <span className="text-[10px] tracking-[2px]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>{c.label}</span>
            </div>
          ))}
        </div>

        {/* Active orders */}
        {active.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <Clock size={14} className="text-[#e9b421]" />
              <p className="text-[11px] tracking-[2.5px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                EM ANDAMENTO
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {active.map((o) => (
                <OrderCard key={o.id} order={o} expanded={expanded === o.id} onToggle={() => setExpanded(expanded === o.id ? null : o.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Completed orders */}
        {done.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <p className="text-[11px] tracking-[2.5px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                CONCLUÍDAS
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {done.map((o) => (
                <OrderCard key={o.id} order={o} expanded={expanded === o.id} onToggle={() => setExpanded(expanded === o.id ? null : o.id)} />
              ))}
            </div>
          </section>
        )}

        {/* Contact footer */}
        <div className="mt-14 p-6 border border-[rgba(245,242,236,0.08)]" style={{ background: "#171511" }}>
          <p className="text-[13px] text-[rgba(245,242,236,0.5)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Dúvidas sobre seu pedido? Entre em contato pelo WhatsApp
            {" "}<a href="https://wa.me/5511999999999" className="text-[#e9b421] hover:underline">(11) 99999-9999</a>{" "}
            ou pelo e-mail <a href="mailto:atendimento@eldo.com.br" className="text-[#e9b421] hover:underline">atendimento@eldo.com.br</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
