"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { CACHE_TAGS } from "@/lib/api/server";
import { revalidatePublicData } from "@/lib/api/revalidate";
import {
  createCatalogItem,
  deleteCatalogItem,
  listCatalogItems,
  updateCatalogItem,
  type CatalogItem,
  type CatalogItemType,
} from "@/lib/catalog/api";
import {
  fetchEstimatorSettings,
  updateEstimatorSettings,
  type EstimatorSettings,
} from "@/lib/siteSettings/api";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const LOAD_ERROR = "Não foi possível carregar a tabela de orçamento. Tente novamente.";
const SAVE_ERROR = "Não foi possível salvar a tabela de orçamento. Tente novamente.";

interface CatalogForm {
  catalogItemId: string | null;
  type: CatalogItemType;
  name: string;
  price: string;
  isActive: boolean;
}

const EMPTY_CATALOG: CatalogForm = {
  catalogItemId: null,
  type: "paintType",
  name: "",
  price: "",
  isActive: true,
};

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

// US08: the price per m² of each paint type, the factor of each material and
// the margin that closes the price range of the public simulator.
export default function QuoteTable() {
  const [catalogItems, setCatalogItems] = useState<CatalogItem[]>([]);
  const [estimator, setEstimator] = useState<EstimatorSettings | null>(null);
  const [estimatorMargin, setEstimatorMargin] = useState("");
  const [catalogForm, setCatalogForm] = useState<CatalogForm | null>(null);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const loadCatalog = useCallback(() => {
    Promise.all([listCatalogItems(), fetchEstimatorSettings()])
      .then(([items, settings]) => {
        setCatalogItems(items);
        setEstimator(settings);
        setEstimatorMargin(String(settings.negotiationMargin));
        setLoadError("");
      })
      .catch((error: unknown) => setLoadError(errorMessageOf(error, LOAD_ERROR)));
  }, []);

  useEffect(() => {
    loadCatalog();
  }, [loadCatalog]);

  function openCatalogForm(item?: CatalogItem) {
    setActionError("");
    setCatalogForm(item
      ? {
          catalogItemId: item.catalogItemId,
          type: item.type,
          name: item.name,
          price: String(item.type === "paintType" ? item.pricePerM2 : item.priceFactor),
          isActive: item.isActive,
        }
      : EMPTY_CATALOG);
  }

  async function saveEstimatorSettings() {
    if (!estimator) return;
    const margin = Number(estimatorMargin);
    if (!Number.isFinite(margin) || margin < 0 || margin > 100) {
      setActionError("A margem deve ficar entre 0% e 100%.");
      return;
    }
    setActionError("");
    try {
      const updated = await updateEstimatorSettings({ isEnabled: estimator.isEnabled, negotiationMargin: margin });
      setEstimator(updated);
      setEstimatorMargin(String(updated.negotiationMargin));
      await revalidatePublicData(CACHE_TAGS.quoteEstimator);
      setSuccessMessage("Configuração do simulador atualizada.");
    } catch (error) {
      setActionError(errorMessageOf(error, SAVE_ERROR));
    }
  }

  async function submitCatalogItem(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!catalogForm) return;
    const price = Number(catalogForm.price);
    if (!catalogForm.name.trim()) {
      setActionError("Informe o nome do item.");
      return;
    }
    if (!price || price <= 0) {
      setActionError("Informe um preço maior que zero.");
      return;
    }
    setIsSaving(true);
    setActionError("");
    try {
      const body = {
        name: catalogForm.name.trim(),
        isActive: catalogForm.isActive,
        ...(catalogForm.type === "paintType" ? { pricePerM2: price } : { priceFactor: price }),
      };
      if (catalogForm.catalogItemId) {
        await updateCatalogItem(catalogForm.catalogItemId, body);
      } else {
        await createCatalogItem({ type: catalogForm.type, ...body });
      }
      setCatalogForm(null);
      loadCatalog();
      await revalidatePublicData(CACHE_TAGS.quoteEstimator);
      setSuccessMessage("Tabela de orçamento atualizada.");
    } catch (error) {
      setActionError(errorMessageOf(error, SAVE_ERROR));
    } finally {
      setIsSaving(false);
    }
  }

  async function removeCatalogItem(item: CatalogItem) {
    if (!window.confirm(`Remover "${item.name}" da tabela de orçamento?`)) return;
    setActionError("");
    try {
      await deleteCatalogItem(item.catalogItemId);
      loadCatalog();
      await revalidatePublicData(CACHE_TAGS.quoteEstimator);
      setSuccessMessage("Item removido da tabela de orçamento.");
    } catch (error) {
      setActionError(errorMessageOf(error, SAVE_ERROR));
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>REGRAS DE ORÇAMENTO</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Tabela de orçamento</h1>
        </div>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 px-5 py-3 mb-6 border border-emerald-500/30 bg-emerald-500/5">
          <Check size={14} className="text-emerald-400" />
          <p className="text-[13px] text-emerald-400" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{successMessage}</p>
        </div>
      )}
      {loadError && <p role="alert" className="mb-6 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{loadError}</p>}
      {actionError && !catalogForm && <p role="alert" className="mb-6 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{actionError}</p>}

      {estimator && (
        <div className="p-6 mb-8 border border-[rgba(245,242,236,0.1)] bg-[rgba(23,21,17,0.45)]">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <p className="text-[15px] text-[#f5f2ec] mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>Simulador automático no site</p>
              <p className="text-[13px] text-[rgba(245,242,236,0.48)] leading-[1.6] max-w-[560px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Desligado, o visitante PJ vê apenas o envio de projeto em PDF. A margem de negociação define o teto da faixa mostrada (mínimo + margem).
              </p>
            </div>
            <button type="button" role="switch" aria-checked={estimator.isEnabled} onClick={() => setEstimator({ ...estimator, isEnabled: !estimator.isEnabled })}
              className={`relative w-[52px] h-[28px] rounded-full flex-shrink-0 transition-colors ${estimator.isEnabled ? "bg-[#e9b421]" : "bg-[rgba(245,242,236,0.16)]"}`}>
              <span className={`absolute top-1 w-5 h-5 rounded-full bg-[#12100d] transition-transform ${estimator.isEnabled ? "translate-x-7" : "translate-x-1"}`} />
            </button>
          </div>
          <div className="flex flex-wrap items-end gap-3 mt-5">
            <label className="flex flex-col gap-2">
              <span className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>MARGEM DE NEGOCIAÇÃO (%)</span>
              <input type="number" min="0" max="100" step="0.01" value={estimatorMargin} onChange={(event) => setEstimatorMargin(event.target.value)} className="h-[40px] w-[160px] px-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </label>
            <button type="button" onClick={saveEstimatorSettings} className="h-[40px] px-5 bg-[#e9b421] text-[#12100d] text-[12px] tracking-[1px]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>SALVAR CONFIGURAÇÃO</button>
          </div>
        </div>
      )}

      {(["paintType", "partMaterial"] as const).map((type) => {
        const items = catalogItems.filter((item) => item.type === type);
        const title = type === "paintType" ? "TIPOS DE PINTURA — PREÇO POR M²" : "MATERIAIS DA PEÇA — FATOR";
        return (
          <div key={type} className="mb-8">
            <div className="flex items-end justify-between gap-4 mb-3">
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{title}</p>
              <button onClick={() => openCatalogForm()} className="flex items-center gap-2 h-[38px] px-4 border border-[rgba(245,242,236,0.18)] text-[12px] text-[rgba(245,242,236,0.7)] hover:border-[#e9b421] hover:text-[#e9b421]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                <Plus size={13} /> Adicionar
              </button>
            </div>
            <div className="border border-[rgba(245,242,236,0.08)] overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[rgba(245,242,236,0.1)]">
                    {["NOME", type === "paintType" ? "PREÇO POR M²" : "FATOR", "STATUS", ""].map((header) => (
                      <th key={header} className="px-5 py-3 text-left text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.catalogItemId} className="border-b border-[rgba(245,242,236,0.06)]">
                      <td className="px-5 py-3 text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{item.name}</td>
                      <td className="px-5 py-3 text-[14px] text-[#e9b421]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
                        {type === "paintType" ? BRL.format(item.pricePerM2 ?? 0) : (item.priceFactor ?? 0).toLocaleString("pt-BR", { maximumFractionDigits: 3 })}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] tracking-[1.5px] px-2 py-1 ${item.isActive ? "text-emerald-400 bg-emerald-500/10" : "text-[rgba(245,242,236,0.45)] bg-[rgba(245,242,236,0.08)]"}`} style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                          {item.isActive ? "ATIVO" : "INATIVO"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openCatalogForm(item)} className="text-[rgba(245,242,236,0.45)] hover:text-[#e9b421]" title="Editar"><Pencil size={14} /></button>
                          <button onClick={() => removeCatalogItem(item)} className="text-[rgba(245,242,236,0.45)] hover:text-red-400" title="Remover"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td colSpan={4} className="px-5 py-8 text-center text-[13px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Nenhum item cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}

      {/* Catalog item modal */}
      {catalogForm && createPortal(
        <Drawer title={catalogForm.catalogItemId ? "Editar item da tabela" : "Novo item da tabela"} onClose={() => setCatalogForm(null)}>
          <form onSubmit={submitCatalogItem} className="flex flex-col gap-5">
            {!catalogForm.catalogItemId && (
              <DF label="TIPO">
                <select value={catalogForm.type} onChange={(event) => setCatalogForm({ ...catalogForm, type: event.target.value as CatalogItemType })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  <option value="paintType">Tipo de pintura (preço por m²)</option>
                  <option value="partMaterial">Material da peça (fator)</option>
                </select>
              </DF>
            )}
            <DF label="NOME"><input type="text" required value={catalogForm.name} onChange={(event) => setCatalogForm({ ...catalogForm, name: event.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <DF label={catalogForm.type === "paintType" ? "PREÇO POR M² (R$)" : "FATOR"}>
              <input type="number" required min="0.001" step="0.001" value={catalogForm.price} onChange={(event) => setCatalogForm({ ...catalogForm, price: event.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </DF>
            <label className="flex items-center gap-3">
              <input type="checkbox" checked={catalogForm.isActive} onChange={(event) => setCatalogForm({ ...catalogForm, isActive: event.target.checked })} className="w-4 h-4 accent-[#e9b421]" />
              <span className="text-[13px] text-[rgba(245,242,236,0.7)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Disponível no simulador e no lançamento de venda</span>
            </label>
            {actionError && <p role="alert" className="text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{actionError}</p>}
            <div className="flex gap-3 mt-3">
              <button type="button" onClick={() => setCatalogForm(null)} className="flex-1 h-[48px] border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[13px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Cancelar</button>
              <button type="submit" disabled={isSaving} className="flex-1 h-[48px] bg-[#e9b421] text-[#12100d] text-[13px] disabled:opacity-50" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{isSaving ? "Salvando..." : "Salvar item"}</button>
            </div>
          </form>
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

function DF({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}
