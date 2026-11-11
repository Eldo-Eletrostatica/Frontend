"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, AlertTriangle, X, Package, History, ArrowUp, ArrowDown, Tag } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  createInventoryCategory,
  createInventoryItem,
  createStockMovement,
  listInventoryCategories,
  listInventoryItems,
  listStockMovements,
  removeInventoryCategory,
  renameInventoryCategory,
} from "@/lib/inventory/api";
import {
  INVENTORY_UNITS,
  isBelowMinimum,
  UNIT_LABELS,
  type InventoryCategory,
  type InventoryItem,
  type InventoryUnit,
  type StockMovement,
  type StockMovementType,
} from "@/lib/inventory/types";

const ALL_CATEGORIES = "Todos";
const LOAD_ERROR_MESSAGE = "Não foi possível carregar o estoque.";
const SAVE_ERROR_MESSAGE = "Não foi possível cadastrar o item. Tente novamente.";
const MOVEMENT_ERROR_MESSAGE = "Não foi possível registrar a movimentação. Tente novamente.";
const HISTORY_ERROR_MESSAGE = "Não foi possível carregar o histórico.";
const HISTORY_EMPTY_PERIOD_MESSAGE = "Informe o período completo para consultar.";
const HISTORY_INVALID_PERIOD_MESSAGE = "A data inicial não pode ser depois da data final.";
// The history starts on the last 30 days; the employee can change the filter.
const HISTORY_DEFAULT_DAYS = 30;

interface ItemForm {
  name: string;
  categoryId: string;
  supplierName: string;
  unit: InventoryUnit;
  balance: string;
  minimumStock: string;
}

const EMPTY_FORM: ItemForm = { name: "", categoryId: "", supplierName: "", unit: "kg", balance: "", minimumStock: "" };

interface MovementForm {
  type: StockMovementType;
  quantity: string;
  reason: string;
}

const EMPTY_MOVEMENT_FORM: MovementForm = { type: "inbound", quantity: "", reason: "" };

type FieldErrors = Partial<Record<"name" | "categoryId" | "supplierName", string>>;
type MovementErrors = Partial<Record<"quantity" | "reason", string>>;

type HistoryState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; movements: StockMovement[] };

interface HistoryFilter {
  inventoryItemId: string;
  from: string;
  to: string;
}

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function normalizeName(name: string): string {
  return name.trim().toLocaleLowerCase("pt-BR");
}

function validate(form: ItemForm): FieldErrors {
  const errors: FieldErrors = {};
  if (!form.name.trim()) errors.name = "Informe o nome do item.";
  if (!form.categoryId) errors.categoryId = "Escolha a categoria do item.";
  if (!form.supplierName.trim()) errors.supplierName = "Informe o fornecedor.";
  return errors;
}

function validateMovement(form: MovementForm): MovementErrors {
  const errors: MovementErrors = {};
  if (!(Number(form.quantity) > 0)) errors.quantity = "Informe uma quantidade maior que zero.";
  if (!form.reason.trim()) errors.reason = "Informe o motivo da movimentação.";
  return errors;
}

function toDateText(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function defaultHistoryFilter(): HistoryFilter {
  const today = new Date();
  const start = new Date();
  start.setDate(today.getDate() - HISTORY_DEFAULT_DAYS);
  return { inventoryItemId: "", from: toDateText(start), to: toDateText(today) };
}

export default function Inventory() {
  const { currentEmployee } = useAuth();
  // The Backend only lets managers and administrators read the history.
  const canSeeHistory = currentEmployee?.role === "admin" || currentEmployee?.role === "manager";
  // And only the administrator manages the categories.
  const canManageCategories = currentEmployee?.role === "admin";

  const [items, setItems] = useState<InventoryItem[]>([]);
  // What the registration form offers; a removed category is not in it.
  const [categoryOptions, setCategoryOptions] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [form, setForm] = useState<ItemForm>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [duplicateOf, setDuplicateOf] = useState<InventoryItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [movementItemId, setMovementItemId] = useState<string | null>(null);
  const [movementForm, setMovementForm] = useState<MovementForm>(EMPTY_MOVEMENT_FORM);
  const [movementErrors, setMovementErrors] = useState<MovementErrors>({});
  const [movementError, setMovementError] = useState<string | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>(defaultHistoryFilter);
  const [history, setHistory] = useState<HistoryState>({ status: "idle" });

  // The drawer reads the item from the list, so the balance follows every reload.
  const movementItem = items.find((item) => item.inventoryItemId === movementItemId) ?? null;

  // The filter shows the categories the items have, removed ones included:
  // an item keeps showing the category it was registered with.
  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [items],
  );
  const alerts = items.filter(isBelowMinimum);
  const visible = items
    .filter((item) => categoryFilter === ALL_CATEGORIES || item.category === categoryFilter)
    .filter((item) => !showAlertsOnly || isBelowMinimum(item));

  // After the administrator changes a category: the form options and the
  // items (a rename changes the name they show) are read again.
  function reloadCategoriesAndItems() {
    listInventoryCategories().then(setCategoryOptions).catch(() => { /* keeps the list on screen */ });
    loadItems(false);
  }

  function loadItems(showLoading = true) {
    if (showLoading) setIsLoading(true);
    setLoadError(null);
    listInventoryItems()
      .then(setItems)
      .catch((error: unknown) => setLoadError(errorMessageOf(error, LOAD_ERROR_MESSAGE)))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    let isCancelled = false;
    listInventoryCategories()
      .then((list) => { if (!isCancelled) setCategoryOptions(list); })
      .catch(() => { /* the form shows the empty list; the items load below */ });
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
        categoryId: form.categoryId,
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

  function openMovement(item: InventoryItem) {
    setMovementForm(EMPTY_MOVEMENT_FORM);
    setMovementErrors({});
    setMovementError(null);
    setMovementItemId(item.inventoryItemId);
  }

  // The balance on screen only changes with what the Backend holds: on a 409
  // (insufficient balance) nothing is touched and the message is shown.
  async function registerMovement() {
    if (!movementItem || !currentEmployee) return;
    const errors = validateMovement(movementForm);
    setMovementErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsMoving(true);
    setMovementError(null);
    try {
      await createStockMovement({
        inventoryItemId: movementItem.inventoryItemId,
        employeeId: currentEmployee.employeeId,
        type: movementForm.type,
        quantity: Number(movementForm.quantity),
        reason: movementForm.reason.trim(),
      });
      setMovementItemId(null);
      loadItems(false);
    } catch (error) {
      setMovementError(errorMessageOf(error, MOVEMENT_ERROR_MESSAGE));
    } finally {
      setIsMoving(false);
    }
  }

  function consultHistory(filter: HistoryFilter) {
    if (!filter.from || !filter.to) {
      setHistory({ status: "error", message: HISTORY_EMPTY_PERIOD_MESSAGE });
      return;
    }
    if (filter.from > filter.to) {
      setHistory({ status: "error", message: HISTORY_INVALID_PERIOD_MESSAGE });
      return;
    }
    setHistory({ status: "loading" });
    listStockMovements(filter.from, filter.to, filter.inventoryItemId || undefined)
      .then((movements) => setHistory({ status: "loaded", movements }))
      .catch((error: unknown) => setHistory({ status: "error", message: errorMessageOf(error, HISTORY_ERROR_MESSAGE) }));
  }

  function openHistory() {
    const filter = defaultHistoryFilter();
    setHistoryFilter(filter);
    setIsHistoryOpen(true);
    consultHistory(filter);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTROLE DE ESTOQUE</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Estoque</h1>
        </div>
        <div className="flex gap-2">
          {canManageCategories && (
            <button onClick={() => setIsCategoriesOpen(true)} className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)] text-[12px] hover:border-[rgba(245,242,236,0.4)] transition-colors" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              <Tag size={14} /> Categorias
            </button>
          )}
          {canSeeHistory && (
            <button onClick={openHistory} className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)] text-[12px] hover:border-[rgba(245,242,236,0.4)] transition-colors" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              <History size={14} /> Histórico
            </button>
          )}
          <button onClick={openForm} className="flex items-center gap-2 px-5 py-2.5 bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            <Plus size={16} /> Novo item
          </button>
        </div>
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
          <button onClick={() => loadItems()} className="px-4 py-2 border border-[rgba(245,242,236,0.2)] text-[12px] text-[rgba(245,242,236,0.7)] hover:text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
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
                {["ITEM", "CATEGORIA", "FORNECEDOR", "SALDO", "MÍN.", "ATUALIZADO", ""].map((h) => (
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
                    <td className="px-5 py-4">
                      <button onClick={() => openMovement(item)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.6)] text-[11px] hover:border-[#e9b421] hover:text-[#e9b421] transition-all"
                        style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                        <Package size={11} /> Movimentar
                      </button>
                    </td>
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
              <DF label="CATEGORIA" error={fieldErrors.categoryId}>
                <select value={form.categoryId} onChange={(e) => changeForm({ categoryId: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  <option value="">{categoryOptions.length === 0 ? "Nenhuma cadastrada" : "Escolha..."}</option>
                  {categoryOptions.map((c) => <option key={c.inventoryCategoryId} value={c.inventoryCategoryId}>{c.name}</option>)}
                </select>
                {categoryOptions.length === 0 && (
                  <p className="text-[12px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                    {canManageCategories ? 'Cadastre uma categoria em "Categorias".' : "Peça ao administrador para cadastrar as categorias."}
                  </p>
                )}
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

      {/* Categories drawer (administrator) */}
      {isCategoriesOpen && createPortal(
        <Drawer title="Categorias de estoque" onClose={() => setIsCategoriesOpen(false)}>
          <CategoriesManager categories={categoryOptions} onChanged={reloadCategoriesAndItems} />
        </Drawer>,
        document.body
      )}

      {/* Movement drawer */}
      {movementItem && createPortal(
        <Drawer title={`Movimentar: ${movementItem.name}`} onClose={() => setMovementItemId(null)}>
          <div className="flex flex-col gap-5">
            <div className="p-4 border border-[rgba(245,242,236,0.1)] flex items-center justify-between">
              <span className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Saldo atual</span>
              <span className="text-[20px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{movementItem.balance} {UNIT_LABELS[movementItem.unit]}</span>
            </div>

            <DF label="TIPO DE MOVIMENTAÇÃO">
              <div className="grid grid-cols-2 gap-2">
                {(["inbound", "outbound"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setMovementForm({ ...movementForm, type: t })}
                    className={`h-[44px] flex items-center justify-center gap-2 text-[13px] border transition-all ${movementForm.type === t ? "border-[#e9b421] bg-[rgba(233,180,33,0.1)] text-[#e9b421]" : "border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.5)]"}`}
                    style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                    {t === "inbound" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {t === "inbound" ? "Entrada" : "Saída"}
                  </button>
                ))}
              </div>
            </DF>

            <DF label={`QUANTIDADE (${UNIT_LABELS[movementItem.unit]})`} error={movementErrors.quantity}>
              <input type="number" min="0" step="any" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} placeholder="0" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </DF>
            <DF label="MOTIVO / REFERÊNCIA" error={movementErrors.reason}>
              <input type="text" value={movementForm.reason} onChange={(e) => setMovementForm({ ...movementForm, reason: e.target.value })} placeholder="Ex.: OS #0092, Compra PO-2250" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </DF>

            {movementError && (
              <p role="alert" className="px-4 py-3 border border-red-400/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{movementError}</p>
            )}
          </div>
          <DrawerFooter
            onCancel={() => setMovementItemId(null)}
            onConfirm={registerMovement}
            confirmLabel={isMoving ? "Registrando..." : "Registrar movimentação"}
            isBusy={isMoving}
          />
        </Drawer>,
        document.body
      )}

      {/* History drawer */}
      {isHistoryOpen && createPortal(
        <Drawer title="Histórico de movimentações" onClose={() => setIsHistoryOpen(false)}>
          <div className="flex flex-col gap-5 mb-6">
            <DF label="ITEM">
              <select value={historyFilter.inventoryItemId} onChange={(e) => setHistoryFilter({ ...historyFilter, inventoryItemId: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                <option value="">Todos os itens</option>
                {items.map((item) => <option key={item.inventoryItemId} value={item.inventoryItemId}>{item.name}</option>)}
              </select>
            </DF>
            <div className="grid grid-cols-2 gap-4">
              <DF label="DE">
                <input type="date" value={historyFilter.from} onChange={(e) => setHistoryFilter({ ...historyFilter, from: e.target.value })} className="drw-inp [color-scheme:dark]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </DF>
              <DF label="ATÉ">
                <input type="date" value={historyFilter.to} onChange={(e) => setHistoryFilter({ ...historyFilter, to: e.target.value })} className="drw-inp [color-scheme:dark]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </DF>
            </div>
            <button type="button" onClick={() => consultHistory(historyFilter)} disabled={history.status === "loading"} className="h-[48px] bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 disabled:opacity-60" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
              {history.status === "loading" ? "Consultando..." : "Consultar período"}
            </button>
          </div>
          {history.status === "loading" && (
            <p className="text-[14px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Carregando histórico...</p>
          )}
          {history.status === "error" && (
            <p role="alert" className="text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{history.message}</p>
          )}
          {history.status === "loaded" && (
            <div className="flex flex-col gap-px bg-[rgba(245,242,236,0.06)]">
              {history.movements.map((m) => (
                <div key={m.stockMovementId} className="bg-[#171511] px-4 py-4 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {m.type === "inbound" ? <ArrowUp size={13} className="text-[#e9b421]" /> : <ArrowDown size={13} className="text-red-400" />}
                      <span className={`text-[12px] tracking-[1.5px] ${m.type === "inbound" ? "text-[#e9b421]" : "text-red-400"}`} style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{m.type === "inbound" ? "ENTRADA" : "SAÍDA"}</span>
                    </div>
                    <p className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{m.inventoryItem.name}</p>
                    <p className="text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{m.reason} · {m.employee.name}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <p className={`text-[18px] ${m.type === "inbound" ? "text-[#e9b421]" : "text-[rgba(245,242,236,0.6)]"}`} style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                      {m.type === "inbound" ? "+" : "−"}{m.quantity} {UNIT_LABELS[m.inventoryItem.unit]}
                    </p>
                    <p className="text-[11px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{new Date(m.movedAt).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              ))}
              {history.movements.length === 0 && (
                <p className="p-8 text-center text-[rgba(245,242,236,0.35)] text-[14px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Nenhuma movimentação no período.</p>
              )}
            </div>
          )}
        </Drawer>,
        document.body
      )}

      <style>{`.drw-inp { width:100%; height:46px; padding:0 14px; background:#12100d; border:1px solid rgba(245,242,236,0.18); color:#f5f2ec; font-size:14px; outline:none; transition:border-color .15s; } .drw-inp:focus { border-color:#e9b421; } .drw-inp option { background:#1a1713; }`}</style>
    </div>
  );
}

const CATEGORY_SAVE_ERROR = "Não foi possível salvar a categoria. Tente novamente.";
const CATEGORY_REMOVE_ERROR = "Não foi possível remover a categoria. Tente novamente.";

// Create, rename and remove. Removing only takes the category off the form's
// list: the items that use it keep showing it, which the screen says.
function CategoriesManager({ categories, onChanged }: { categories: InventoryCategory[]; onChanged: () => void }) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  function run(action: () => Promise<unknown>, fallback: string, after: () => void) {
    setIsBusy(true);
    setError(null);
    action()
      .then(() => { after(); onChanged(); })
      .catch((caught: unknown) => setError(errorMessageOf(caught, fallback)))
      .finally(() => setIsBusy(false));
  }

  function add() {
    if (!newName.trim()) { setError("Informe o nome da categoria."); return; }
    run(() => createInventoryCategory(newName.trim()), CATEGORY_SAVE_ERROR, () => setNewName(""));
  }

  function saveRename(inventoryCategoryId: string) {
    if (!editingName.trim()) { setError("Informe o nome da categoria."); return; }
    run(() => renameInventoryCategory(inventoryCategoryId, editingName.trim()), CATEGORY_SAVE_ERROR, () => setEditingId(null));
  }

  function remove(inventoryCategoryId: string) {
    run(() => removeInventoryCategory(inventoryCategoryId), CATEGORY_REMOVE_ERROR, () => setRemovingId(null));
  }

  const smallButton = "px-3 py-1.5 border border-[rgba(245,242,236,0.18)] text-[11px] text-[rgba(245,242,236,0.65)] hover:border-[#e9b421] hover:text-[#e9b421] transition-all disabled:opacity-50";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <DF label="NOVA CATEGORIA">
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex.: Solventes" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          </DF>
        </div>
        <button onClick={add} disabled={isBusy} className="h-[46px] px-5 bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 disabled:opacity-60" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>Adicionar</button>
      </div>
      {error && <p role="alert" className="text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{error}</p>}

      <div className="border border-[rgba(245,242,236,0.08)]">
        {categories.length === 0 && (
          <p className="p-6 text-center text-[14px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Nenhuma categoria cadastrada.</p>
        )}
        {categories.map((category) => (
          <div key={category.inventoryCategoryId} className="flex items-center gap-2 px-4 py-3 border-b border-[rgba(245,242,236,0.06)] last:border-b-0">
            {editingId === category.inventoryCategoryId ? (
              <>
                <input aria-label="Novo nome da categoria" type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} className="drw-inp flex-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                <button onClick={() => saveRename(category.inventoryCategoryId)} disabled={isBusy} className={smallButton}>Salvar</button>
                <button onClick={() => setEditingId(null)} disabled={isBusy} className={smallButton}>Cancelar</button>
              </>
            ) : removingId === category.inventoryCategoryId ? (
              <>
                <p className="flex-1 text-[12px] text-[rgba(245,242,236,0.7)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  Remover &quot;{category.name}&quot;? Os itens dela continuam mostrando esse nome.
                </p>
                <button onClick={() => remove(category.inventoryCategoryId)} disabled={isBusy} className={smallButton}>Remover</button>
                <button onClick={() => setRemovingId(null)} disabled={isBusy} className={smallButton}>Cancelar</button>
              </>
            ) : (
              <>
                <p className="flex-1 text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{category.name}</p>
                <button onClick={() => { setEditingId(category.inventoryCategoryId); setEditingName(category.name); setRemovingId(null); setError(null); }} className={smallButton}>Renomear</button>
                <button onClick={() => { setRemovingId(category.inventoryCategoryId); setEditingId(null); setError(null); }} className={smallButton}>Remover</button>
              </>
            )}
          </div>
        ))}
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