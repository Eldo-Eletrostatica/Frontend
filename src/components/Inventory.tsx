"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, AlertTriangle, X } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { createInventoryItem, listInventoryItems } from "@/lib/inventory/api";
import {
  INVENTORY_UNITS,
  isBelowMinimum,
  UNIT_LABELS,
  type InventoryItem,
  type InventoryUnit,
} from "@/lib/inventory/types";

const ALL_CATEGORIES = "Todos";
const LOAD_ERROR_MESSAGE = "Não foi possível carregar o estoque.";
const SAVE_ERROR_MESSAGE = "Não foi possível cadastrar o item. Tente novamente.";

interface ItemForm {
  name: string;
  category: string;
  supplierName: string;
  unit: InventoryUnit;
  balance: string;
  minimumStock: string;
}

const EMPTY_FORM: ItemForm = { name: "", category: "", supplierName: "", unit: "kg", balance: "", minimumStock: "" };

type FieldErrors = Partial<Record<"name" | "category" | "supplierName", string>>;

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("pt-BR");
}

function validate(form: ItemForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Informe o nome do item.";
  if (!form.category.trim()) errors.category = "Informe a categoria do item.";
  if (!form.supplierName.trim()) errors.supplierName = "Informe o fornecedor.";
  return errors;
}

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Categories are free text typed on the item (glossary), so the list comes
  // from the items themselves.
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items],
  );
  const alerts = items.filter(isBelowMinimum);
  const visible = items
    .filter((item) => categoryFilter === ALL_CATEGORIES || item.category === categoryFilter)
    .filter((item) => !showAlertsOnly || isBelowMinimum(item));

  function loadItems() {
    setIsLoading(true);
    setLoadError(null);
    listInventoryItems()
      .then(setItems)
      .catch((error: unknown) => setLoadError(errorMessageOf(error, LOAD_ERROR_MESSAGE)))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    let isCancelled = false;
    listInventoryItems()
      .then((list) => { if (!isCancelled) setItems(list); })
      .catch((error: unknown) => { if (!isCancelled) setLoadError(errorMessageOf(error, LOAD_ERROR_MESSAGE)); })
      .finally(() => { if (!isCancelled) setIsLoading(false); });
    return () => { isCancelled = true; };
  }, []);

  function openForm() {
    setForm(EMPTY_FORM);
    setFieldErrors({});
    setSaveError(null);
    setDuplicateOf(null);
    setIsFormOpen(true);
  }

  function changeForm(patch: Partial<ItemForm>) {
    setForm((current) => ({ ...current, ...patch }));
    // Any edit clears the duplicate warning: the name may no longer match.
    setDuplicateOf(null);
  }

  async function saveItem(isDuplicateConfirmed: boolean) {
    const errors = validate(form);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const duplicate = items.find((item) => normalizeName(item.name) === normalizeName(form.name));
    if (duplicate && !isDuplicateConfirmed) {
      setDuplicateOf(duplicate);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      await createInventoryItem({
        name: form.name.trim(),
        category: form.category.trim(),
        supplierName: form.supplierName.trim(),
        unit: form.unit,
        balance: Number(form.balance) || 0,
        minimumStock: Number(form.minimumStock) || 0,
      });
      setIsFormOpen(false);
      loadItems();
    } catch (error) {
      setSaveError(errorMessageOf(error, SAVE_ERROR_MESSAGE));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTROLE DE ESTOQUE</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Estoque</h1>
        </div>
        <button onClick={openForm} className="flex items-center gap-2 px-5 py-2.5 bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
          <Plus size={16} /> Novo item
        </button>
      </div>

      {/* Alerts banner */}
      {alerts.length > 0 && (
        <button onClick={() => setShowAlertsOnly(!showAlertsOnly)}
          className={`w-full flex items-center gap-3 px-5 py-3 mb-6 border text-left transition-colors ${showAlertsOnly ? "border-[#e9b421] bg-[rgba(233,180,33,0.08)]" : "border-[rgba(233,180,33,0.4)]"}`}>
          <AlertTriangle size={16} className="text-[#e9b421] flex-shrink-0" />
          <p className="text-[13px] text-[rgba(245,242,236,0.8)]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <span className="text-[#e9b421] font-bold">{alerts.length}</span> {alerts.length === 1 ? "item abaixo" : "itens abaixo"} do estoque mínimo —{" "}
            <span className="underline">{showAlertsOnly ? "mostrar todos" : "ver apenas alertas"}</span>
          </p>
        </button>
      )}

      {/* Category filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[ALL_CATEGORIES, ...categories].map((c) => (
          <button key={c} onClick={() => setCategoryFilter(c)}
            className={`px-4 py-2 text-[11px] tracking-[1.5px] transition-all ${categoryFilter === c ? "bg-[#e9b421] text-[#12100d]" : "border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.55)] hover:text-[rgba(245,242,236,0.9)]"}`}
            style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-[14px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Carregando estoque...</p>
      ) : loadError ? (
        <div className="flex flex-col items-start gap-3">
          <p role="alert" className="text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{loadError}</p>
          <button onClick={loadItems} className="px-4 py-2 border border-[rgba(245,242,236,0.2)] text-[12px] text-[rgba(245,242,236,0.7)] hover:text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
            TENTAR NOVAMENTE
          </button>
        </div>
      ) : items.length === 0 ? (
        <p className="text-[14px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Nenhum item cadastrado. Use &quot;Novo item&quot; para começar.
        </p>
      ) : (
        <div className="border border-[rgba(245,242,236,0.08)] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(245,242,236,0.1)]">
                {["ITEM", "CATEGORIA", "FORNECEDOR", "SALDO", "MÍN.", "ATUALIZADO"].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((item) => {
                const alert = isBelowMinimum(item);
                const unit = UNIT_LABELS[item.unit];
                return (
                  <tr key={item.inventoryItemId} className={`border-b border-[rgba(245,242,236,0.06)] hover:bg-[rgba(245,242,236,0.02)] transition-colors ${alert ? "bg-[rgba(233,180,33,0.03)]" : ""}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {alert && <AlertTriangle size={13} className="text-[#e9b421] flex-shrink-0" />}
                        <p className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{item.name}</p>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.55)] border border-[rgba(245,242,236,0.12)] px-2 py-0.5" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{item.category.toUpperCase()}</span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.55)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{item.supplierName}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[15px] ${alert ? "text-[#e9b421]" : "text-[#f5f2ec]"}`} style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                        {item.balance} <span className="text-[11px] text-[rgba(245,242,236,0.4)]">{unit}</span>
                      </span>
                    </td>
                    <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{item.minimumStock} {unit}</td>
                    <td className="px-5 py-4 text-[12px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{new Date(item.updatedAt).toLocaleDateString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add item drawer */}
      {isFormOpen && createPortal(
        <Drawer title="Cadastrar item" onClose={() => setIsFormOpen(false)}>
          <div className="flex flex-col gap-5">
            <DF label="NOME DO ITEM" error={fieldErrors.name}>
              <input type="text" value={form.name} onChange={(e) => changeForm({ name: e.target.value })} placeholder="Ex.: Tinta epóxi preta RAL 9005" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </DF>
            <div className="grid grid-cols-2 gap-4">
              <DF label="CATEGORIA" error={fieldErrors.category}>
                <input type="text" list="inventory-categories" value={form.category} onChange={(e) => changeForm({ category: e.target.value })} placeholder="Ex.: Tintas" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                <datalist id="inventory-categories">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
              </DF>
              <DF label="UNIDADE">
                <select value={form.unit} onChange={(e) => changeForm({ unit: e.target.value as InventoryUnit })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  {INVENTORY_UNITS.map((u) => <option key={u} value={u}>{UNIT_LABELS[u]}</option>)}
                </select>
              </DF>
            </div>
            <DF label="FORNECEDOR" error={fieldErrors.supplierName}>
              <input type="text" value={form.supplierName} onChange={(e) => changeForm({ supplierName: e.target.value })} placeholder="Nome do fornecedor" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </DF>
            <div className="grid grid-cols-2 gap-4">
              <DF label="QUANTIDADE INICIAL"><input type="number" min="0" step="any" value={form.balance} onChange={(e) => changeForm({ balance: e.target.value })} placeholder="0" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
              <DF label="ESTOQUE MÍNIMO"><input type="number" min="0" step="any" value={form.minimumStock} onChange={(e) => changeForm({ minimumStock: e.target.value })} placeholder="0" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            </div>

            {duplicateOf && (
              <p role="alert" className="px-4 py-3 border border-[rgba(233,180,33,0.5)] text-[13px] text-[#e9b421]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                Já existe um item com o nome &quot;{duplicateOf.name}&quot; ({duplicateOf.category}). Confira se não é o mesmo item antes de cadastrar de novo.
              </p>
            )}
            {saveError && (
              <p role="alert" className="text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{saveError}</p>
            )}
          </div>
          <DrawerFooter
            onCancel={() => setIsFormOpen(false)}
            onConfirm={() => saveItem(duplicateOf !== null)}
            confirmLabel={isSaving ? "Salvando..." : duplicateOf ? "Cadastrar mesmo assim" : "Cadastrar item"}
            isBusy={isSaving}
          />
        </Drawer>,
        document.body
      )}

      <style>{`.drw-inp { width:100%; height:46px; padding:0 14px; background:#12100d; border:1px solid rgba(245,242,236,0.18); color:#f5f2ec; font-size:14px; outline:none; transition:border-color .15s; } .drw-inp:focus { border-color:#e9b421; } .drw-inp option { background:#1a1713; }`}</style>
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

function DrawerFooter({ onCancel, onConfirm, confirmLabel, isBusy }: { onCancel: () => void; onConfirm: () => void; confirmLabel: string; isBusy: boolean }) {
  return (
    <div className="flex gap-3 mt-8">
      <button onClick={onCancel} disabled={isBusy} className="flex-1 h-[48px] border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[13px] hover:border-[rgba(245,242,236,0.35)] transition-colors disabled:opacity-50" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Cancelar</button>
      <button onClick={onConfirm} disabled={isBusy} className="flex-1 h-[48px] bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{confirmLabel}</button>
    </div>
  );
}

function DF({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</label>
      {children}
      {error && <p role="alert" className="text-[12px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{error}</p>}
    </div>
  );
}