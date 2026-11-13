"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Pencil, Check, X } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { sendApiRequest } from "@/lib/api/client";
import { useAuth, type Employee } from "@/lib/auth/AuthProvider";
import {
  fetchAccumulatedCommissions,
  updateCommissionRule,
  type AccumulatedCommissions,
  type CommissionType,
} from "@/lib/commissions/api";
import { listSellers } from "@/lib/sales/api";
import type { Seller } from "@/lib/sales/types";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE_FORMAT = new Intl.DateTimeFormat("pt-BR");

const TABS = ["Minhas comissões", "Regras de comissão"] as const;
type Tab = (typeof TABS)[number];

const COMMISSION_ERROR = "Não foi possível carregar as comissões. Tente novamente.";
const EMPLOYEE_ERROR = "Não foi possível carregar os funcionários. Tente novamente.";
const RULE_ERROR = "Não foi possível salvar a regra de comissão. Tente novamente.";
const INVALID_PERIOD_MESSAGE = "A data inicial não pode ser depois da data final.";

// GET /employees also brings the current commission rule.
interface EmployeeWithCommission extends Employee {
  commissionType: CommissionType | null;
  commissionValue: number | null;
}

interface RuleForm {
  employeeId: string;
  name: string;
  type: CommissionType | "none";
  value: string;
}

type CommissionsState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; commissions: AccumulatedCommissions }
  | { kind: "failed"; message: string };

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function todayAsText(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function firstDayOfMonthAsText(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function isPeriodValid(startDate: string, endDate: string): boolean {
  return Boolean(startDate && endDate) && startDate <= endDate;
}

function formatSoldAt(date: string): string {
  return DATE_FORMAT.format(new Date(date));
}

function formatRule(type: CommissionType | null, value: number | null): string {
  if (!type || value === null) return "Sem regra";
  return type === "percentage" ? `${value}%` : BRL.format(value);
}

export default function Commissions() {
  const { currentEmployee } = useAuth();
  const isAdmin = currentEmployee?.role === "admin";
  const canSeeOtherSellers = currentEmployee?.role === "admin" || currentEmployee?.role === "manager";

  const [tab, setTab] = useState<Tab>("Minhas comissões");
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [startDate, setStartDate] = useState(firstDayOfMonthAsText());
  const [endDate, setEndDate] = useState(todayAsText());
  const [commissionsState, setCommissionsState] = useState<CommissionsState>({ kind: "idle" });

  const [employees, setEmployees] = useState<EmployeeWithCommission[]>([]);
  const [ruleForm, setRuleForm] = useState<RuleForm | null>(null);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const periodIsValid = isPeriodValid(startDate, endDate);

  useEffect(() => {
    let isCurrent = true;
    listSellers()
      .then((list) => {
        if (!isCurrent) return;
        setSellers(list);
        // The employee starts with their own name on the field (US21/US23).
        setEmployeeId((current) => current || currentEmployee?.employeeId || list[0]?.employeeId || "");
      })
      .catch(() => {
        if (isCurrent) setSellers([]);
      });
    return () => {
      isCurrent = false;
    };
  }, [currentEmployee?.employeeId]);

  useEffect(() => {
    if (tab !== "Regras de comissão" || !isAdmin) return;
    sendApiRequest<EmployeeWithCommission[]>("/employees")
      .then(setEmployees)
      .catch((error: unknown) => setActionError(errorMessageOf(error, EMPLOYEE_ERROR)));
  }, [tab, isAdmin]);

  useEffect(() => {
    if (tab !== "Minhas comissões" || !employeeId || !periodIsValid) return;
    let isCurrent = true;
    fetchAccumulatedCommissions(employeeId, { startDate, endDate })
      .then((commissions) => {
        if (isCurrent) setCommissionsState({ kind: "loaded", commissions });
      })
      .catch((error: unknown) => {
        if (isCurrent) setCommissionsState({ kind: "failed", message: errorMessageOf(error, COMMISSION_ERROR) });
      });
    return () => {
      isCurrent = false;
    };
  }, [tab, employeeId, startDate, endDate, periodIsValid]);

  const loadEmployees = useCallback(async () => {
    const updated = await sendApiRequest<EmployeeWithCommission[]>("/employees");
    setEmployees(updated);
  }, []);

  function changeEmployee(nextEmployeeId: string) {
    setCommissionsState({ kind: "loading" });
    setEmployeeId(nextEmployeeId);
  }

  function changeStartDate(nextStartDate: string) {
    setCommissionsState({ kind: "loading" });
    setStartDate(nextStartDate);
  }

  function changeEndDate(nextEndDate: string) {
    setCommissionsState({ kind: "loading" });
    setEndDate(nextEndDate);
  }

  function changeTab(nextTab: Tab) {
    setTab(nextTab);
    setActionError("");
    setSuccessMessage("");
  }

  function openRuleForm(employee: EmployeeWithCommission) {
    setActionError("");
    setRuleForm({
      employeeId: employee.employeeId,
      name: employee.name,
      type: employee.commissionType ?? "none",
      value: employee.commissionValue !== null ? String(employee.commissionValue) : "",
    });
  }

  async function submitRule(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!ruleForm) return;
    const value = Number(ruleForm.value);
    if (ruleForm.type !== "none") {
      if (!value || value <= 0) {
        setActionError("Informe um valor de comissão maior que zero.");
        return;
      }
      if (ruleForm.type === "percentage" && value > 100) {
        setActionError("O percentual não pode passar de 100%.");
        return;
      }
    }
    setIsSaving(true);
    setActionError("");
    try {
      await updateCommissionRule(ruleForm.employeeId, {
        commissionType: ruleForm.type === "none" ? null : ruleForm.type,
        commissionValue: ruleForm.type === "none" ? null : value,
      });
      await loadEmployees();
      setRuleForm(null);
      setSuccessMessage("Regra de comissão atualizada.");
    } catch (error) {
      setActionError(errorMessageOf(error, RULE_ERROR));
    } finally {
      setIsSaving(false);
    }
  }

  const visibleTabs = TABS.filter((option) => option !== "Regras de comissão" || isAdmin);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-site-accent mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>COMISSÕES</p>
          <h1 className="text-[32px] text-site-text leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Comissões</h1>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 px-5 py-3 mb-6 border border-emerald-500/30 bg-emerald-500/5">
          <Check size={14} className="text-emerald-400" />
          <p className="text-[13px] text-emerald-400" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{successMessage}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-0 mb-6 border-b border-site-text/10">
        {visibleTabs.map((option) => (
          <button key={option} onClick={() => changeTab(option)}
            className={`px-6 py-3 text-[13px] border-b-2 transition-all ${tab === option ? "border-site-accent text-site-accent" : "border-transparent text-site-text/50 hover:text-site-text/80"}`}
            style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            {option}
          </button>
        ))}
      </div>

      {tab === "Minhas comissões" && (
        <div>
          <div className="flex flex-wrap items-end gap-4 mb-6">
            {canSeeOtherSellers && (
              <label className="flex flex-col gap-2">
                <span className="text-[11px] tracking-[2px] text-site-text/45" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>FUNCIONÁRIO</span>
                <select value={employeeId} onChange={(event) => changeEmployee(event.target.value)} className="h-[40px] px-3 bg-site-card border border-site-text/18 text-site-text text-[13px] outline-none focus:border-site-accent [&>option]:bg-site-card" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  {sellers.map((seller) => <option key={seller.employeeId} value={seller.employeeId}>{seller.name}</option>)}
                </select>
              </label>
            )}
            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[2px] text-site-text/45" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>DE</span>
              <input type="date" value={startDate} onChange={(event) => changeStartDate(event.target.value)} className="h-[40px] px-3 bg-site-card border border-site-text/18 text-site-text text-[13px] outline-none focus:border-site-accent [color-scheme:dark]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </label>
            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[2px] text-site-text/45" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ATÉ</span>
              <input type="date" value={endDate} onChange={(event) => changeEndDate(event.target.value)} className="h-[40px] px-3 bg-site-card border border-site-text/18 text-site-text text-[13px] outline-none focus:border-site-accent [color-scheme:dark]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </label>
          </div>

          {!periodIsValid ? (
            <p role="alert" className="py-10 text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{INVALID_PERIOD_MESSAGE}</p>
          ) : commissionsState.kind === "idle" || commissionsState.kind === "loading" ? (
            <p className="py-16 text-center text-[14px] text-site-text/45" aria-live="polite" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Carregando comissões...</p>
          ) : commissionsState.kind === "failed" ? (
            <p role="alert" className="py-10 text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{commissionsState.message}</p>
          ) : (
            <>
              <div className="grid md:grid-cols-3 gap-px bg-site-text/8 mb-6">
                <div className="bg-site-page p-6">
                  <p className="text-[11px] tracking-[2px] text-site-text/40 mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>COMISSÃO ACUMULADA</p>
                  <p className="text-[32px] text-site-accent" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{BRL.format(commissionsState.commissions.totalCommission)}</p>
                </div>
                <div className="bg-site-page p-6">
                  <p className="text-[11px] tracking-[2px] text-site-text/40 mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>VALOR VENDIDO</p>
                  <p className="text-[32px] text-site-text" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{BRL.format(commissionsState.commissions.totalSalesValue)}</p>
                </div>
                <div className="bg-site-page p-6">
                  <p className="text-[11px] tracking-[2px] text-site-text/40 mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>VENDAS NO PERÍODO</p>
                  <p className="text-[32px] text-site-text" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{commissionsState.commissions.salesCount}</p>
                </div>
              </div>

              {commissionsState.commissions.sales.length === 0 ? (
                <p className="py-12 text-center text-[14px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  Nenhuma venda no período. O total acumulado é R$ 0,00.
                </p>
              ) : (
                <div className="border border-site-text/8 overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-site-text/10">
                        {["PROTOCOLO", "DATA", "VALOR", "COMISSÃO", "STATUS"].map((header) => (
                          <th key={header} className="px-5 py-4 text-left text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {commissionsState.commissions.sales.map((sale) => (
                        <tr key={sale.orderId} className="border-b border-site-text/6">
                          <td className="px-5 py-4 text-[12px] text-site-text/55" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{sale.trackingCode}</td>
                          <td className="px-5 py-4 text-[13px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{formatSoldAt(sale.soldAt)}</td>
                          <td className="px-5 py-4 text-[14px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{BRL.format(sale.finalPrice)}</td>
                          <td className="px-5 py-4 text-[14px] text-site-accent" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{BRL.format(sale.commission)}</td>
                          <td className="px-5 py-4 text-[12px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{sale.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {tab === "Regras de comissão" && isAdmin && (
        <div>
          {actionError && <p role="alert" className="mb-4 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{actionError}</p>}
          <p className="mb-4 text-[13px] text-site-text/50" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Cada funcionário tem uma regra vigente, em percentual ou valor fixo. A venda guarda a comissão calculada no lançamento; mudar a regra não altera vendas antigas.
          </p>
          <div className="border border-site-text/8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-site-text/10">
                  {["FUNCIONÁRIO", "E-MAIL", "NÍVEL", "REGRA ATUAL", ""].map((header) => (
                    <th key={header} className="px-5 py-4 text-left text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.employeeId} className="border-b border-site-text/6">
                    <td className="px-5 py-4 text-[14px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{employee.name}</td>
                    <td className="px-5 py-4 text-[13px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{employee.email}</td>
                    <td className="px-5 py-4 text-[12px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{employee.role.toUpperCase()}</td>
                    <td className="px-5 py-4 text-[14px] text-site-accent" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{formatRule(employee.commissionType, employee.commissionValue)}</td>
                    <td className="px-5 py-4">
                      <button onClick={() => openRuleForm(employee)} className="flex items-center gap-1 text-[11px] tracking-[1.5px] text-site-text/50 hover:text-site-accent" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                        <Pencil size={12} /> EDITAR
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Commission rule modal */}
      {ruleForm && createPortal(
        <Drawer title={`Regra de comissão — ${ruleForm.name}`} onClose={() => setRuleForm(null)}>
          <form onSubmit={submitRule} className="flex flex-col gap-5">
            <DF label="TIPO DE COMISSÃO">
              <div className="grid grid-cols-3 gap-2">
                {([["none", "SEM REGRA"], ["percentage", "PERCENTUAL"], ["fixed", "VALOR FIXO"]] as const).map(([type, label]) => (
                  <button key={type} type="button" onClick={() => setRuleForm({ ...ruleForm, type })}
                    className={`h-[44px] border text-[11px] tracking-[1px] ${ruleForm.type === type ? "border-site-accent bg-site-accent/10 text-site-accent" : "border-site-text/15 text-site-text/50"}`}
                    style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                    {label}
                  </button>
                ))}
              </div>
            </DF>
            {ruleForm.type !== "none" && (
              <DF label={ruleForm.type === "percentage" ? "PERCENTUAL (%)" : "VALOR (R$)"}>
                <input type="number" min="0.01" step="0.01" required value={ruleForm.value} onChange={(event) => setRuleForm({ ...ruleForm, value: event.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </DF>
            )}
            {actionError && <p role="alert" className="text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{actionError}</p>}
            <div className="flex gap-3 mt-3">
              <button type="button" onClick={() => setRuleForm(null)} className="flex-1 h-[48px] border border-site-text/18 text-site-text/60 text-[13px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 h-[48px] bg-site-accent text-site-page text-[13px] disabled:opacity-50" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{isSaving ? "Salvando..." : "Salvar regra"}</button>
            </div>
          </form>
        </Drawer>,
        document.body
      )}
    </div>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[480px] border-l border-site-text/12 bg-site-card">
        <div className="flex items-center justify-between px-8 py-6 border-b border-site-text/8">
          <h2 className="text-[20px] text-site-text" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{title}</h2>
          <button onClick={onClose} className="text-site-text/35 hover:text-site-text/90 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
      </aside>
    </>
  );
}

function DF({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] tracking-[2px] text-site-text/50" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}
