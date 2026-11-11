"use client";

import { ArrowLeft, CheckCircle2, Circle, Clock, Hourglass, PackageCheck, ScanSearch, Wrench, type LucideIcon } from "lucide-react";
import {
  SERVICE_ORDER_STATUS_DESCRIPTIONS,
  SERVICE_ORDER_STATUS_LABELS,
  SERVICE_ORDER_STEPS,
  type ServiceOrderStatus,
  type TrackingLookup,
} from "./tracking/types";
import EldoLogo from "./EldoLogo";
import ReviewInvite from "./tracking/ReviewInvite";

interface Props {
  lookup: TrackingLookup;
  onBack: () => void;
}

interface ServiceOrderView {
  trackingCode?: string;
  status: ServiceOrderStatus;
  dueDate: string;
}

const STATUS_ICONS: Record<ServiceOrderStatus, LucideIcon> = {
  queued: Hourglass,
  inProduction: Wrench,
  finishing: ScanSearch,
  completed: PackageCheck,
};

const CNPJ_FORMAT = /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/;

function formatCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "").replace(CNPJ_FORMAT, "$1.$2.$3/$4-$5");
}

function getTodayDateOnly(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

// Both dates are AAAA-MM-DD, so the text comparison follows the calendar.
function isLate(dueDate: string, status: ServiceOrderStatus): boolean {
  return status !== "completed" && dueDate < getTodayDateOnly();
}

// Noon keeps the date-only value on the same day in any time zone.
function formatDate(dateOnly: string): string {
  return new Date(`${dateOnly}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

function toServiceOrderViews(lookup: TrackingLookup): ServiceOrderView[] {
  return lookup.kind === "trackingCode" ? [lookup.serviceOrder] : lookup.serviceOrders;
}

function StatusTracker({ status }: { status: ServiceOrderStatus }) {
  const currentStep = SERVICE_ORDER_STEPS.indexOf(status);
  return (
    <div className="flex items-center gap-0 w-full">
      {SERVICE_ORDER_STEPS.map((stepStatus, step) => {
        const isDone = step < currentStep;
        const isActive = step === currentStep;
        return (
          <div key={stepStatus} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2 min-w-[80px]">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                isDone ? "bg-[#e9b421] border-[#e9b421]" :
                isActive ? "border-[#e9b421] bg-[rgba(233,180,33,0.15)]" :
                "border-[rgba(245,242,236,0.2)] bg-transparent"
              }`}>
                {isDone ? (
                  <CheckCircle2 size={16} className="text-[#12100d]" />
                ) : isActive ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#e9b421]" />
                ) : (
                  <Circle size={14} className="text-[rgba(245,242,236,0.25)]" />
                )}
              </div>
              <p className={`text-[10px] tracking-[1.5px] text-center leading-tight ${isActive ? "text-[#e9b421]" : isDone ? "text-[rgba(245,242,236,0.6)]" : "text-[rgba(245,242,236,0.25)]"}`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                {SERVICE_ORDER_STATUS_LABELS[stepStatus].toUpperCase()}
              </p>
            </div>
            {step < SERVICE_ORDER_STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mb-5 mx-1 ${step < currentStep ? "bg-[#e9b421]" : "bg-[rgba(245,242,236,0.1)]"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function ServiceOrderCard({ serviceOrder, position }: { serviceOrder: ServiceOrderView; position: number }) {
  const isServiceOrderLate = isLate(serviceOrder.dueDate, serviceOrder.status);
  const StatusIcon = STATUS_ICONS[serviceOrder.status];
  const label = SERVICE_ORDER_STATUS_LABELS[serviceOrder.status];

  return (
    <article className="border border-[rgba(233,180,33,0.3)]" style={{ background: "rgba(233,180,33,0.03)" }} data-testid="service-order">
      <div className="flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)] mb-0.5" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            {serviceOrder.trackingCode ? "PROTOCOLO" : "ORDEM DE SERVIÇO"}
          </p>
          <p className="text-[18px] text-[#f5f2ec] leading-tight tracking-[1px]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            {serviceOrder.trackingCode ?? `OS ${position}`}
          </p>
        </div>
        <div className="text-right">
          {isServiceOrderLate && (
            <p className="text-[11px] text-red-400 tracking-[1.5px] mb-0.5" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>PRAZO EXPIRADO</p>
          )}
          <p className={`text-[13px] tracking-[1.5px] ${serviceOrder.status === "completed" ? "text-emerald-400" : "text-[#e9b421]"}`}
            style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
            {label.toUpperCase()}
          </p>
        </div>
      </div>

      <div className="px-6 pb-8 border-t border-[rgba(245,242,236,0.08)]">
        <div className="pt-8 mb-8 overflow-x-auto">
          <StatusTracker status={serviceOrder.status} />
        </div>

        <div className="flex items-start gap-3 px-5 py-4 mb-6 border border-[rgba(233,180,33,0.15)]" style={{ background: "rgba(233,180,33,0.04)" }}>
          <StatusIcon size={18} className="text-[#e9b421] mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[13px] text-[#e9b421] mb-0.5" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{label}</p>
            <p className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              {SERVICE_ORDER_STATUS_DESCRIPTIONS[serviceOrder.status]}
            </p>
          </div>
        </div>

        <div className="bg-[#12100d] px-4 py-4 border border-[rgba(245,242,236,0.08)]">
          <p className="text-[10px] tracking-[2px] text-[rgba(245,242,236,0.35)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PRAZO</p>
          <p className={`text-[14px] ${isServiceOrderLate ? "text-red-400" : "text-[#f5f2ec]"}`} style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{formatDate(serviceOrder.dueDate)}</p>
        </div>

        {serviceOrder.status === "completed" && <ReviewInvite />}
      </div>
    </article>
  );
}

export default function TrackingResult({ lookup, onBack }: Props) {
  const serviceOrders = toServiceOrderViews(lookup);
  const searchedBy = lookup.kind === "trackingCode" ? `Protocolo ${lookup.serviceOrder.trackingCode}` : `CNPJ ${formatCnpj(lookup.cnpj)}`;

  return (
    <div className="min-h-screen" style={{ background: "#12100d" }}>
      <header className="sticky top-0 z-20 border-b border-[rgba(245,242,236,0.08)]"
        style={{ background: "rgba(18,16,13,0.97)", backdropFilter: "blur(12px)" }}>
        <div className="max-w-[900px] mx-auto px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button type="button" onClick={onBack} className="flex items-center gap-2 text-[rgba(245,242,236,0.4)] hover:text-[rgba(245,242,236,0.8)] transition-colors">
              <ArrowLeft size={16} />
              <span className="text-[11px] tracking-[2px]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>NOVA CONSULTA</span>
            </button>
            <div className="w-px h-4 bg-[rgba(245,242,236,0.15)]" />
            <EldoLogo imageClassName="w-[30px] h-[30px]" subtitle="ACOMPANHAR SERVIÇO" />
          </div>
          <span className="hidden sm:block text-[12px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{searchedBy}</span>
        </div>
      </header>

      <main className="max-w-[900px] mx-auto px-6 pt-12 pb-20">
        <div className="border-b border-[rgba(245,242,236,0.1)] pb-10 mb-12">
          <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            ELDO PINTURA ELETROSTÁTICA
          </p>
          <h1 className="text-[36px] text-[#f5f2ec] leading-[1.1] tracking-[-0.8px] mb-3" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Acompanhamento do serviço
          </h1>
          <p className="text-[14px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {lookup.kind === "trackingCode"
              ? `Consulta pelo protocolo ${lookup.serviceOrder.trackingCode}.`
              : serviceOrders.length === 1
                ? `1 ordem de serviço em andamento para o CNPJ ${formatCnpj(lookup.cnpj)}.`
                : `${serviceOrders.length} ordens de serviço em andamento para o CNPJ ${formatCnpj(lookup.cnpj)}.`}
          </p>
        </div>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Clock size={14} className="text-[#e9b421]" />
            <p className="text-[11px] tracking-[2.5px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
              {lookup.kind === "trackingCode" ? "STATUS DA ORDEM DE SERVIÇO" : "EM ANDAMENTO"}
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {serviceOrders.map((serviceOrder, index) => (
              <ServiceOrderCard key={serviceOrder.trackingCode ?? index} serviceOrder={serviceOrder} position={index + 1} />
            ))}
          </div>
        </section>

        <div className="mt-14 p-6 border border-[rgba(245,242,236,0.08)]" style={{ background: "#171511" }}>
          <p className="text-[13px] text-[rgba(245,242,236,0.5)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Dúvidas sobre seu pedido? Entre em contato pelo WhatsApp
            {" "}<a href="https://wa.me/5561999999999" className="text-[#e9b421] hover:underline">(61) 99999-9999</a>{" "}
            ou pelo e-mail <a href="mailto:atendimento@eldo.com.br" className="text-[#e9b421] hover:underline">atendimento@eldo.com.br</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
