"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Clock, CheckCircle2 } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listOverdueServiceOrders, listServiceOrders, updateServiceOrderStatus } from "@/lib/serviceOrders/api";
import type { ServiceOrder, ServiceOrderStatus } from "@/lib/serviceOrders/types";

const STATUS_CONFIG: Record<ServiceOrderStatus, { label: string; color: string; bg: string }> = {
  queued:       { label: "Em fila",     color: "text-[rgba(245,242,236,0.55)]", bg: "bg-[rgba(245,242,236,0.08)]" },
  inProduction: { label: "Em produção", color: "text-[#e9b421]",               bg: "bg-[rgba(233,180,33,0.15)]"  },
  finishing:    { label: "Finalização", color: "text-blue-300",                bg: "bg-[rgba(147,197,253,0.12)]" },
  completed:    { label: "Concluído",   color: "text-emerald-400",             bg: "bg-[rgba(52,211,153,0.1)]"   },
};

const STATUSES: ServiceOrderStatus[] = ["queued", "inProduction", "finishing", "completed"];

const LOAD_ERROR_MESSAGE = "Não foi possível carregar os serviços.";
const OVERDUE_ERROR_MESSAGE = "Não foi possível carregar os serviços atrasados.";
const UPDATE_ERROR_MESSAGE = "Não foi possível atualizar o status. Tente novamente.";

type ServicesView = "kanban" | "list" | "overdue";

// dueDate is a date without time ("2030-01-15"): parsing it with new Date()
// reads it as UTC and shows the previous day in Brazil, so it is handled as text.
function formatDate(date: string): string {
  return date.split("-").reverse().join("/");
}

function todayAsText(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function isLate(dueDate: string, status: ServiceOrderStatus): boolean {
  return status !== "completed" && dueDate < todayAsText();
}

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

export default function Services() {
  const { currentEmployee } = useAuth();
  const canSeeOverduePanel = currentEmployee?.role === "admin" || currentEmployee?.role === "manager";

  const [services, setServices] = useState<ServiceOrder[]>([]);
  const [overdue, setOverdue] = useState<ServiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOverdue, setIsLoadingOverdue] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [overdueError, setOverdueError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [view, setView] = useState<ServicesView>("kanban");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [overdueLoaded, setOverdueLoaded] = useState(false);

  // The drawer reads the order from the list, so it follows every update.
  const selected =
    services.find((s) => s.orderId === selectedId) ??
    overdue.find((s) => s.orderId === selectedId) ??
    null;
  const lateCount = services.filter((s) => isLate(s.dueDate, s.status)).length;

  function loadServices() {
    setIsLoading(true);
    setLoadError(null);
    listServiceOrders()
      .then(setServices)
      .catch((error: unknown) => setLoadError(errorMessageOf(error, LOAD_ERROR_MESSAGE)))
      .finally(() => setIsLoading(false));
  }

  function loadOverdue() {
    setIsLoadingOverdue(true);
    setOverdueError(null);
    listOverdueServiceOrders()
      .then((orders) => {
        setOverdue(orders);
        setOverdueLoaded(true);
      })
      .catch((error: unknown) => {
        setOverdueError(errorMessageOf(error, OVERDUE_ERROR_MESSAGE));
        setOverdueLoaded(true);
      })
      .finally(() => setIsLoadingOverdue(false));
  }

  function openView(next: ServicesView) {
    setView(next);
    if (next === "overdue" && canSeeOverduePanel && !overdueLoaded && !isLoadingOverdue) {
      loadOverdue();
    }
  }

  useEffect(() => {
    let isCancelled = false;
    listServiceOrders()
      .then((orders) => { if (!isCancelled) setServices(orders); })
      .catch((error: unknown) => { if (!isCancelled) setLoadError(errorMessageOf(error, LOAD_ERROR_MESSAGE)); })
      .finally(() => { if (!isCancelled) setIsLoading(false); });
    return () => { isCancelled = true; };
  }, []);

  // The screen only changes with what the Backend answers: it is the source of truth.
  async function updateStatus(orderId: string, status: ServiceOrderStatus) {
    setUpdatingId(orderId);
    setUpdateError(null);
    try {
      const updated = await updateServiceOrderStatus(orderId, status);
      setServices((current) => current.map((s) => (s.orderId === orderId ? { ...s, ...updated } : s)));
      setOverdue((current) => {
        if (status === "completed") return current.filter((s) => s.orderId !== orderId);
        return current.map((s) => (s.orderId === orderId ? { ...s, ...updated } : s));
      });
    } catch (error) {
      setUpdateError(errorMessageOf(error, UPDATE_ERROR_MESSAGE));
    } finally {
      setUpdatingId(null);
    }
  }

  const viewOptions: { id: ServicesView; label: string; visible: boolean }[] = [
    { id: "kanban", label: "KANBAN", visible: true },
    { id: "list", label: "LISTA", visible: true },
    { id: "overdue", label: "ATRASOS", visible: canSeeOverduePanel },
  ];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ORDENS DE SERVIÇO</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Serviços</h1>
        </div>
        <div className="flex gap-2">
          {viewOptions.filter((option) => option.visible).map((option) => (
            <button key={option.id} onClick={() => openView(option.id)}
              className={`px-4 py-2 text-[11px] tracking-[1.5px] transition-all ${view === option.id ? "bg-[#e9b421] text-[#12100d]" : "border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.55)]"}`}
              style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts */}
      {view !== "overdue" && lateCount > 0 && (
        <button
          type="button"
          onClick={() => canSeeOverduePanel && openView("overdue")}
          className="flex items-center gap-3 px-5 py-3 mb-6 border border-[rgba(233,180,33,0.4)] w-full text-left hover:bg-[rgba(233,180,33,0.04)] transition-colors"
        >
          <AlertTriangle size={16} className="text-[#e9b421]" />
          <p className="text-[13px] text-[rgba(245,242,236,0.8)]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <span className="text-[#e9b421] font-bold">{lateCount}</span> {lateCount === 1 ? "serviço atrasado" : "serviços atrasados"}
            {canSeeOverduePanel ? " — abrir painel de atrasos" : " — verifique os prazos no kanban"}
          </p>
        </button>
      )}

      {updateError && !selected && (
        <p role="alert" className="mb-6 px-5 py-3 border border-red-400/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{updateError}</p>
      )}

      {view === "overdue" ? (
        <OverduePanel
          orders={overdue}
          isLoading={isLoadingOverdue}
          error={overdueError}
          onRetry={loadOverdue}
          onOpen={setSelectedId}
        />
      ) : isLoading ? (
        <p className="text-[14px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Carregando serviços...</p>
      ) : loadError ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{loadError}</p>
          <button onClick={loadServices} className="px-4 py-2 border border-[rgba(245,242,236,0.2)] text-[12px] text-[rgba(245,242,236,0.7)] hover:text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
            TENTAR NOVAMENTE
          </button>
        </div>
      ) : services.length === 0 ? (
        <p className="text-[14px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Nenhum serviço ainda. As ordens de serviço nascem do lançamento de uma venda.
        </p>
      ) : view === "kanban" ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(245,242,236,0.08)]">
          {STATUSES.map((status) => {
            const cols = services.filter((s) => s.status === status);
            const cfg = STATUS_CONFIG[status];
            return (
              <div key={status} className="bg-[#12100d] flex flex-col min-h-[400px]">
                <div className="px-4 py-4 border-b border-[rgba(245,242,236,0.08)] flex items-center justify-between">
                  <span className={`text-[11px] tracking-[2px] px-2 py-1 ${cfg.color} ${cfg.bg}`} style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                    {cfg.label.toUpperCase()}
                  </span>
                  <span className="text-[12px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{cols.length}</span>
                </div>
                <div className="flex flex-col gap-2 p-3 flex-1">
                  {cols.map((s) => (
                    <button key={s.orderId} onClick={() => setSelectedId(s.orderId)}
                      className={`text-left p-4 border transition-colors hover:border-[rgba(245,242,236,0.25)] ${isLate(s.dueDate, s.status) ? "border-[rgba(233,180,33,0.35)]" : "border-[rgba(245,242,236,0.1)]"}`}
                      style={{ background: "#171511" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{s.trackingCode}</span>
                        {isLate(s.dueDate, s.status) && <AlertTriangle size={12} className="text-[#e9b421]" />}
                      </div>
                      <p className="text-[13px] text-[#f5f2ec] leading-[1.3] mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{s.customer.name}</p>
                      <p className="text-[11px] text-[rgba(245,242,236,0.5)] leading-[1.4] mb-3" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.scope}</p>
                      <div className="flex items-center gap-1 text-[11px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                        <Clock size={10} />
                        {formatDate(s.dueDate)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="border border-[rgba(245,242,236,0.08)] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(245,242,236,0.1)]">
                {["PROTOCOLO", "CLIENTE", "ESCOPO", "PRAZO", "STATUS", ""].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const late = isLate(s.dueDate, s.status);
                const cfg = STATUS_CONFIG[s.status];
                return (
                  <tr key={s.orderId} className="border-b border-[rgba(245,242,236,0.06)] hover:bg-[rgba(245,242,236,0.02)]">
                    <td className="px-5 py-4 text-[12px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{s.trackingCode}</td>
                    <td className="px-5 py-4 text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{s.customer.name}</td>
                    <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.6)] max-w-[220px] truncate" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.scope}</td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1 text-[12px] ${late ? "text-[#e9b421]" : "text-[rgba(245,242,236,0.5)]"}`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                        {late && <AlertTriangle size={11} />}
                        {formatDate(s.dueDate)}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] tracking-[1.5px] px-2 py-1 ${cfg.color} ${cfg.bg}`} style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                        {cfg.label.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => setSelectedId(s.orderId)} className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.4)] hover:text-[#e9b421] transition-colors" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                        DETALHES
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail drawer */}
      {selected && createPortal(
        <Drawer title={selected.trackingCode} onClose={() => { setSelectedId(null); setUpdateError(null); }}>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CLIENTE</p>
              <p className="text-[17px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{selected.customer.name}</p>
            </div>
            <div>
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ESCOPO</p>
              <p className="text-[14px] text-[rgba(245,242,236,0.75)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{selected.scope}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PRAZO</p>
                <p className={`text-[14px] ${isLate(selected.dueDate, selected.status) ? "text-[#e9b421]" : "text-[#f5f2ec]"}`} style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                  {formatDate(selected.dueDate)}
                  {isLate(selected.dueDate, selected.status) && " ⚠ ATRASADO"}
                </p>
              </div>
              {selected.completedAt && (
                <div>
                  <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONCLUÍDO EM</p>
                  <p className="text-[14px] text-emerald-400" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                    {new Date(selected.completedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>

            <div>
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ATUALIZAR STATUS</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  return (
                    <button key={st} onClick={() => updateStatus(selected.orderId, st)}
                      disabled={updatingId !== null || selected.status === st}
                      className={`py-3 text-[12px] tracking-[1.5px] border transition-all disabled:cursor-not-allowed ${selected.status === st ? `${cfg.bg} ${cfg.color} border-transparent` : "border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.5)] hover:border-[rgba(245,242,236,0.3)] disabled:opacity-50"}`}
                      style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                      {cfg.label.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              {updateError && (
                <p role="alert" className="mt-3 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{updateError}</p>
              )}
            </div>
          </div>
        </Drawer>,
        document.body
      )}
    </div>
  );
}

function OverduePanel({
  orders,
  isLoading,
  error,
  onRetry,
  onOpen,
}: {
  orders: ServiceOrder[];
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onOpen: (orderId: string) => void;
}) {
  if (isLoading) {
    return <p className="text-[14px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Carregando atrasos...</p>;
  }

  if (error) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p role="alert" className="text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{error}</p>
        <button onClick={onRetry} className="px-4 py-2 border border-[rgba(245,242,236,0.2)] text-[12px] text-[rgba(245,242,236,0.7)] hover:text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
          TENTAR NOVAMENTE
        </button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex items-start gap-3 px-5 py-6 border border-emerald-400/30 bg-emerald-400/5">
        <CheckCircle2 size={18} className="text-emerald-400 mt-0.5" />
        <div>
          <p className="text-[15px] text-emerald-300 mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>Tudo em dia</p>
          <p className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Não há serviços com prazo vencido no momento.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-3 mb-6 border border-[rgba(233,180,33,0.4)]">
        <AlertTriangle size={16} className="text-[#e9b421]" />
        <p className="text-[13px] text-[rgba(245,242,236,0.8)]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
          <span className="text-[#e9b421] font-bold">{orders.length}</span> {orders.length === 1 ? "serviço atrasado" : "serviços atrasados"} — priorize estas entregas
        </p>
      </div>

      <div className="border border-[rgba(233,180,33,0.25)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(245,242,236,0.1)]">
              {["PROTOCOLO", "CLIENTE", "ESCOPO", "PRAZO", "STATUS", ""].map((h) => (
                <th key={h} className="px-5 py-4 text-left text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {orders.map((s) => {
              const cfg = STATUS_CONFIG[s.status];
              return (
                <tr key={s.orderId} className="border-b border-[rgba(245,242,236,0.06)] bg-[rgba(233,180,33,0.03)] hover:bg-[rgba(233,180,33,0.06)]">
                  <td className="px-5 py-4 text-[12px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{s.trackingCode}</td>
                  <td className="px-5 py-4 text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{s.customer.name}</td>
                  <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.6)] max-w-[220px] truncate" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.scope}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1 text-[12px] text-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                      <AlertTriangle size={11} />
                      {formatDate(s.dueDate)}
                      <span className="ml-2 text-[10px] tracking-[1.5px] px-2 py-0.5 bg-[rgba(233,180,33,0.15)]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>ATRASADO</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`text-[11px] tracking-[1.5px] px-2 py-1 ${cfg.color} ${cfg.bg}`} style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                      {cfg.label.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => onOpen(s.orderId)} className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.4)] hover:text-[#e9b421] transition-colors" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                      DETALHES
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[480px] border-l border-[rgba(245,242,236,0.12)]" style={{ background: "#171511" }}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-[rgba(245,242,236,0.08)]">
          <h2 className="text-[20px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{title}</h2>
          <button onClick={onClose} className="text-[rgba(245,242,236,0.35)] hover:text-[rgba(245,242,236,0.9)] transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
      </aside>
    </>
  );
}
