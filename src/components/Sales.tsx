"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Trash2, Trophy, TrendingUp, X } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { useAuth } from "@/lib/auth/AuthProvider";
import { listCatalogOptions, type CatalogItemOption } from "@/lib/catalog/api";
import { listQuotes } from "@/lib/quotes/api";
import type { Quote } from "@/lib/quotes/types";
import { ROUTES } from "@/lib/routes";
import { launchSale, listSaleOrders, listSellers } from "@/lib/sales/api";
import {
  SALE_STATUS_LABELS,
  type CustomerType,
  type LaunchSaleInput,
  type SaleOrder,
  type SaleStatus,
  type Seller,
} from "@/lib/sales/types";

const TABS = ["Vendas", "Comissões"] as const;
type Tab = (typeof TABS)[number];
type SaleMode = "direct" | "approved";

interface ItemFormRow {
  key: string;
  paintCatalogItemId: string;
  materialCatalogItemId: string;
  areaM2: string;
  quantity: string;
}

interface SaleFormState {
  mode: SaleMode;
  sellerEmployeeId: string;
  scope: string;
  dueDate: string;
  orderId: string;
  customerType: CustomerType;
  name: string;
  document: string;
  email: string;
  phone: string;
  finalPrice: string;
  items: ItemFormRow[];
}

const LOAD_ERROR_MESSAGE = "Não foi possível carregar as vendas.";
const LAUNCH_ERROR_MESSAGE = "Não foi possível registrar a venda. Tente novamente.";
const STATUS_STYLE: Record<SaleStatus, string> = {
  queued: "text-site-text/55 bg-site-text/8",
  inProduction: "text-site-accent bg-site-accent/15",
  finishing: "text-blue-300 bg-[rgba(147,197,253,0.12)]",
  completed: "text-emerald-400 bg-[rgba(52,211,153,0.1)]",
};

function emptyItem(paints: CatalogItemOption[], materials: CatalogItemOption[]): ItemFormRow {
  return {
    key: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    paintCatalogItemId: paints[0]?.catalogItemId ?? "",
    materialCatalogItemId: materials[0]?.catalogItemId ?? "",
    areaM2: "",
    quantity: "1",
  };
}

function emptySaleForm(sellerEmployeeId: string, paints: CatalogItemOption[], materials: CatalogItemOption[]): SaleFormState {
  return {
    mode: "direct",
    sellerEmployeeId,
    scope: "",
    dueDate: "",
    orderId: "",
    customerType: "individual",
    name: "",
    document: "",
    email: "",
    phone: "",
    finalPrice: "",
    items: [emptyItem(paints, materials)],
  };
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatSoldAt(soldAt: string | null): string {
  if (!soldAt) return "—";
  return new Date(soldAt).toLocaleDateString("pt-BR");
}

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function sellerNameOf(sellers: Seller[], sellerEmployeeId: string | null): string {
  if (!sellerEmployeeId) return "—";
  return sellers.find((seller) => seller.employeeId === sellerEmployeeId)?.name ?? "—";
}

export default function Sales() {
  const { currentEmployee } = useAuth();
  // "Lançar venda" on the quotes screen comes here with the approved quote.
  const quoteIdFromLink = useSearchParams().get("orderId");

  const [sales, setSales] = useState<SaleOrder[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [paints, setPaints] = useState<CatalogItemOption[]>([]);
  const [materials, setMaterials] = useState<CatalogItemOption[]>([]);
  const [approvedQuotes, setApprovedQuotes] = useState<Quote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>("Vendas");
  const [modal, setModal] = useState<"add-sale" | null>(null);
  const [sellerFilter, setSellerFilter] = useState("Todos");
  const [saleForm, setSaleForm] = useState<SaleFormState>(() => emptySaleForm("", [], []));
  useEffect(() => {
    let isCancelled = false;

    Promise.all([listSaleOrders(), listSellers(), listCatalogOptions(), listQuotes("approved")])
      .then(([orders, sellerList, catalog, quotes]) => {
        if (isCancelled) return;
        setApprovedQuotes(quotes);
        const paintOptions = catalog.filter((item) => item.type === "paintType");
        const materialOptions = catalog.filter((item) => item.type === "partMaterial");
        setSales(orders);
        setSellers(sellerList);
        setPaints(paintOptions);
        setMaterials(materialOptions);
        const blankForm = emptySaleForm(currentEmployee?.employeeId ?? sellerList[0]?.employeeId ?? "", paintOptions, materialOptions);
        // The link of an approved quote opens the sale already linked to it.
        const linkedQuote = quotes.find((quote) => quote.orderId === quoteIdFromLink);
        if (linkedQuote) {
          setSaleForm({ ...blankForm, mode: "approved", orderId: linkedQuote.orderId, dueDate: linkedQuote.dueDate ?? "" });
          setModal("add-sale");
        } else {
          setSaleForm(blankForm);
        }
      })
      .catch((error: unknown) => {
        if (!isCancelled) setLoadError(errorMessageOf(error, LOAD_ERROR_MESSAGE));
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [currentEmployee?.employeeId, quoteIdFromLink]);

  const visibleSales = useMemo(() => {
    if (sellerFilter === "Todos") return sales;
    return sales.filter((sale) => sale.sellerEmployeeId === sellerFilter);
  }, [sales, sellerFilter]);

  const ranking = useMemo(() => {
    return sellers
      .map((seller) => {
        const sellerSales = sales.filter((sale) => sale.sellerEmployeeId === seller.employeeId);
        return {
          seller: seller.name,
          total: sellerSales.reduce((sum, sale) => sum + (sale.finalPrice ?? 0), 0),
          commission: sellerSales.reduce((sum, sale) => sum + (sale.commission ?? 0), 0),
          count: sellerSales.length,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [sales, sellers]);

  const totalSales = sales.reduce((sum, sale) => sum + (sale.finalPrice ?? 0), 0);
  const totalCommission = sales.reduce((sum, sale) => sum + (sale.commission ?? 0), 0);
  const ticketAverage = sales.length > 0 ? Math.round(totalSales / sales.length) : 0;

  function openSaleModal() {
    setSubmitError(null);
    setSaleForm(emptySaleForm(currentEmployee?.employeeId ?? sellers[0]?.employeeId ?? "", paints, materials));
    setModal("add-sale");
  }

  function updateItem(key: string, patch: Partial<ItemFormRow>) {
    setSaleForm((current) => ({
      ...current,
      items: current.items.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    }));
  }

  function validateSaleForm(): string | null {
    if (!saleForm.sellerEmployeeId) return "Selecione o vendedor.";
    if (!saleForm.scope.trim()) return "Informe o escopo do serviço.";
    if (!saleForm.dueDate) return "Informe o prazo de entrega.";

    if (saleForm.mode === "approved") {
      if (!saleForm.orderId.trim()) return "Selecione o orçamento aprovado.";
      return null;
    }

    const document = onlyDigits(saleForm.document);
    if (!saleForm.name.trim()) return "Informe o nome do cliente.";
    if (!saleForm.email.trim()) return "Informe o e-mail do cliente.";
    if (!saleForm.phone.trim()) return "Informe o telefone do cliente.";
    if (saleForm.customerType === "business" && document.length !== 14) {
      return "Informe um CNPJ válido (14 dígitos).";
    }
    if (document && document.length !== 11 && document.length !== 14) {
      return "Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos.";
    }

    if (
      saleForm.items.length === 0 ||
      saleForm.items.some(
        (item) =>
          !item.paintCatalogItemId ||
          !item.materialCatalogItemId ||
          !(Number(item.areaM2) > 0) ||
          !Number.isInteger(Number(item.quantity)) ||
          !(Number(item.quantity) > 0),
      )
    ) {
      return "Preencha todos os itens com pintura, material, área e quantidade.";
    }

    if (!(Number(saleForm.finalPrice) > 0)) return "Informe o valor final da venda.";
    return null;
  }

  function buildLaunchPayload(): LaunchSaleInput {
    if (saleForm.mode === "approved") {
      return {
        sellerEmployeeId: saleForm.sellerEmployeeId,
        scope: saleForm.scope.trim(),
        dueDate: saleForm.dueDate,
        orderId: saleForm.orderId.trim(),
      };
    }

    const document = onlyDigits(saleForm.document);
    return {
      sellerEmployeeId: saleForm.sellerEmployeeId,
      scope: saleForm.scope.trim(),
      dueDate: saleForm.dueDate,
      customer: {
        type: saleForm.customerType,
        name: saleForm.name.trim(),
        email: saleForm.email.trim(),
        phone: saleForm.phone.trim(),
        ...(document ? { document } : {}),
      },
      items: saleForm.items.map((item) => ({
        paintCatalogItemId: item.paintCatalogItemId,
        materialCatalogItemId: item.materialCatalogItemId,
        areaM2: Number(item.areaM2),
        quantity: Number(item.quantity),
      })),
      finalPrice: Number(saleForm.finalPrice),
    };
  }

  async function submitSale() {
    const validationError = validateSaleForm();
    if (validationError) {
      setSubmitError(validationError);
      return;
    }
    const payload = buildLaunchPayload();

    setIsSaving(true);
    setSubmitError(null);
    try {
      const launched = await launchSale(payload);
      const [orders, quotes] = await Promise.all([listSaleOrders(), listQuotes("approved")]);
      setSales(orders);
      setApprovedQuotes(quotes);
      setSuccessMessage(`Venda registrada. Protocolo do cliente: ${launched.trackingCode}`);
      setModal(null);
    } catch (error) {
      setSubmitError(errorMessageOf(error, LAUNCH_ERROR_MESSAGE));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-site-accent mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>LANÇAMENTO DE VENDAS</p>
          <h1 className="text-[32px] text-site-text leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Vendas</h1>
        </div>
        <button
          onClick={openSaleModal}
          className="flex items-center gap-2 px-5 py-2.5 bg-site-accent text-site-page text-[13px] hover:opacity-90 transition-opacity"
          style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
        >
          <Plus size={16} /> Nova venda
        </button>
      </div>

      {successMessage && (
        <p role="status" className="mb-6 px-5 py-3 border border-emerald-400/40 text-[13px] text-emerald-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
          {successMessage}
        </p>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-site-text/8 mb-px">
        {[
          { label: "TOTAL VENDIDO", value: formatMoney(totalSales) },
          { label: "TOTAL COMISSÕES", value: formatMoney(totalCommission) },
          { label: "VENDAS NO PERÍODO", value: String(sales.length) },
          { label: "TICKET MÉDIO", value: formatMoney(ticketAverage) },
        ].map((k) => (
          <div key={k.label} className="bg-site-page px-6 py-5">
            <p className="text-[28px] text-site-text leading-tight mb-1" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{k.value}</p>
            <p className="text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{k.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-0 mb-6 mt-6 border-b border-site-text/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-3 text-[13px] border-b-2 transition-all ${tab === t ? "border-site-accent text-site-accent" : "border-transparent text-site-text/50 hover:text-site-text/80"}`}
            style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Vendas" && (
        <>
          <div className="flex flex-wrap gap-2 mb-5">
            <button
              onClick={() => setSellerFilter("Todos")}
              className={`px-4 py-1.5 text-[11px] tracking-[1.5px] transition-all ${sellerFilter === "Todos" ? "bg-site-accent text-site-page" : "border border-site-text/15 text-site-text/55"}`}
              style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
            >
              TODOS
            </button>
            {sellers.map((seller) => (
              <button
                key={seller.employeeId}
                onClick={() => setSellerFilter(seller.employeeId)}
                className={`px-4 py-1.5 text-[11px] tracking-[1.5px] transition-all ${sellerFilter === seller.employeeId ? "bg-site-accent text-site-page" : "border border-site-text/15 text-site-text/55"}`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
              >
                {seller.name.toUpperCase().split(" ")[0]}
              </button>
            ))}
          </div>

          {isLoading && (
            <p className="px-5 py-10 text-center text-[14px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Carregando vendas…
            </p>
          )}

          {loadError && (
            <p role="alert" className="px-5 py-10 text-center border border-red-400/40 text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              {loadError}
            </p>
          )}

          {!isLoading && !loadError && (
            <div className="border border-site-text/8 overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-site-text/10">
                    {["PROTOCOLO", "CLIENTE", "ESCOPO", "VALOR", "VENDEDOR", "COMISSÃO", "DATA", "STATUS"].map((h) => (
                      <th key={h} className="px-4 py-4 text-left text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleSales.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-[14px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                        Nenhuma venda lançada ainda.
                      </td>
                    </tr>
                  )}
                  {visibleSales.map((sale) => (
                    <tr key={sale.orderId} className="border-b border-site-text/6 hover:bg-site-text/2">
                      <td className="px-4 py-4 text-[11px] text-site-text/45" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{sale.trackingCode ?? "—"}</td>
                      <td className="px-4 py-4 text-[14px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{sale.customer.name}</td>
                      <td className="px-4 py-4 text-[13px] text-site-text/60 max-w-[220px] truncate" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{sale.scope ?? "—"}</td>
                      <td className="px-4 py-4 text-[14px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{sale.finalPrice == null ? "—" : formatMoney(sale.finalPrice)}</td>
                      <td className="px-4 py-4 text-[13px] text-site-text/60" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{sellerNameOf(sellers, sale.sellerEmployeeId).split(" ")[0]}</td>
                      <td className="px-4 py-4 text-[14px] text-site-accent" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{sale.commission == null ? "—" : formatMoney(sale.commission)}</td>
                      <td className="px-4 py-4 text-[12px] text-site-text/40" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{formatSoldAt(sale.soldAt)}</td>
                      <td className="px-4 py-4">
                        <span className={`text-[10px] tracking-[1.5px] px-2 py-1 ${STATUS_STYLE[sale.status]}`} style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                          {SALE_STATUS_LABELS[sale.status].toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "Comissões" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-site-text/8">
          {ranking.length === 0 && (
            <div className="bg-site-page p-6 col-span-full">
              <p className="text-[14px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Sem vendedores para rankear.</p>
            </div>
          )}
          {ranking.map((r, i) => (
            <div key={r.seller} className="bg-site-page p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>#{i + 1}</span>
                {i === 0 && <Trophy size={16} className="text-site-accent" />}
                {i === 1 && <TrendingUp size={16} className="text-site-text/40" />}
              </div>
              <p className="text-[15px] text-site-text mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{r.seller.split(" ")[0]}</p>
              <p className="text-[28px] text-site-accent leading-tight mb-1" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{formatMoney(r.commission)}</p>
              <p className="text-[12px] text-site-text/40" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>em comissão</p>
              <div className="mt-4 pt-4 border-t border-site-text/8">
                <p className="text-[13px] text-site-text/60" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{formatMoney(r.total)} vendido · {r.count} venda(s)</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "add-sale" && createPortal(
        <Drawer title="Nova venda" onClose={() => !isSaving && setModal(null)}>
          <div className="flex flex-col gap-5">
            <div className="px-4 py-3 border-l-2 border-site-accent bg-site-accent/4">
              <p className="text-[11px] text-site-text/55 leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Ao registrar a venda, uma OS é criada automaticamente e o cliente recebe um protocolo para acompanhar o status.
              </p>
            </div>

            <DF label="TIPO DE LANÇAMENTO">
              <div className="grid grid-cols-2 gap-2">
                {([
                  ["direct", "CLIENTE NOVO"],
                  ["approved", "ORÇAMENTO APROVADO"],
                ] as const).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    disabled={isSaving}
                    onClick={() => setSaleForm((current) => ({ ...current, mode }))}
                    className={`h-[44px] border text-[12px] tracking-[1px] transition-all ${saleForm.mode === mode ? "border-site-accent bg-site-accent/10 text-site-accent" : "border-site-text/15 text-site-text/50"}`}
                    style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </DF>

            <DF label="VENDEDOR">
              <select
                value={saleForm.sellerEmployeeId}
                disabled={isSaving}
                onChange={(e) => setSaleForm({ ...saleForm, sellerEmployeeId: e.target.value })}
                className="drw-inp"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
              >
                {sellers.map((seller) => (
                  <option key={seller.employeeId} value={seller.employeeId}>{seller.name}</option>
                ))}
              </select>
            </DF>

            <DF label="ESCOPO TÉCNICO">
              <textarea
                value={saleForm.scope}
                disabled={isSaving}
                onChange={(e) => setSaleForm({ ...saleForm, scope: e.target.value })}
                rows={2}
                placeholder="Peças, processo, acabamento…"
                className="w-full px-4 py-3 bg-site-page border border-site-text/18 text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent resize-none transition-colors"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
              />
            </DF>

            <DF label="PRAZO DE ENTREGA">
              <input
                type="date"
                value={saleForm.dueDate}
                disabled={isSaving}
                onChange={(e) => setSaleForm({ ...saleForm, dueDate: e.target.value })}
                className="drw-inp [color-scheme:dark]"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
              />
            </DF>

            {saleForm.mode === "approved" ? (
              <DF label="ORÇAMENTO APROVADO">
                {approvedQuotes.length === 0 ? (
                  <p className="text-[13px] text-site-text/50" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                    Nenhum orçamento aprovado. Aprove um na tela de <Link href={ROUTES.quotes} className="underline text-site-accent">Orçamentos</Link> ou lance uma venda para cliente novo.
                  </p>
                ) : (
                  <select
                    value={saleForm.orderId}
                    disabled={isSaving}
                    onChange={(e) => setSaleForm({ ...saleForm, orderId: e.target.value })}
                    className="drw-inp"
                    style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                  >
                    <option value="">Selecione o orçamento</option>
                    {approvedQuotes.map((quote) => (
                      <option key={quote.orderId} value={quote.orderId}>
                        {quote.customerName}{quote.finalPrice !== null ? ` · ${formatMoney(quote.finalPrice)}` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </DF>
            ) : (
              <>
                <p className="text-[10px] tracking-[2.5px] text-site-text/35" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>DADOS DO CLIENTE</p>

                <DF label="TIPO DE CLIENTE">
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      ["individual", "PESSOA FÍSICA"],
                      ["business", "PESSOA JURÍDICA"],
                    ] as const).map(([type, label]) => (
                      <button
                        key={type}
                        type="button"
                        disabled={isSaving}
                        onClick={() => setSaleForm({ ...saleForm, customerType: type })}
                        className={`h-[44px] border text-[12px] tracking-[1px] transition-all ${saleForm.customerType === type ? "border-site-accent bg-site-accent/10 text-site-accent" : "border-site-text/15 text-site-text/50"}`}
                        style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </DF>

                <DF label="NOME / RAZÃO SOCIAL">
                  <input type="text" value={saleForm.name} disabled={isSaving} onChange={(e) => setSaleForm({ ...saleForm, name: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                </DF>
                <DF label={saleForm.customerType === "business" ? "CNPJ (obrigatório)" : "CPF (opcional)"}>
                  <input type="text" value={saleForm.document} disabled={isSaving} onChange={(e) => setSaleForm({ ...saleForm, document: e.target.value })} placeholder={saleForm.customerType === "business" ? "00.000.000/0001-00" : "000.000.000-00"} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                </DF>
                <div className="grid grid-cols-2 gap-4">
                  <DF label="E-MAIL">
                    <input type="email" value={saleForm.email} disabled={isSaving} onChange={(e) => setSaleForm({ ...saleForm, email: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                  </DF>
                  <DF label="TELEFONE">
                    <input type="tel" value={saleForm.phone} disabled={isSaving} onChange={(e) => setSaleForm({ ...saleForm, phone: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                  </DF>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-[10px] tracking-[2.5px] text-site-text/35" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ITENS</p>
                  <button
                    type="button"
                    disabled={isSaving || paints.length === 0 || materials.length === 0}
                    onClick={() => setSaleForm((current) => ({ ...current, items: [...current.items, emptyItem(paints, materials)] }))}
                    className="flex items-center gap-1.5 text-[11px] text-site-accent disabled:opacity-40"
                    style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
                  >
                    <Plus size={12} /> Adicionar item
                  </button>
                </div>

                {(paints.length === 0 || materials.length === 0) && (
                  <p role="alert" className="text-[12px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                    Cadastre tipos de pintura e materiais no catálogo antes de lançar uma venda direta.
                  </p>
                )}

                {saleForm.items.map((item, index) => (
                  <div key={item.key} className="p-4 border border-site-text/10 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] text-site-text/55" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Item {index + 1}</p>
                      {saleForm.items.length > 1 && (
                        <button type="button" disabled={isSaving} onClick={() => setSaleForm((current) => ({ ...current, items: current.items.filter((row) => row.key !== item.key) }))} className="text-site-text/35 hover:text-red-300 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <DF label="TIPO DE PINTURA">
                      <select value={item.paintCatalogItemId} disabled={isSaving} onChange={(e) => updateItem(item.key, { paintCatalogItemId: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                        {paints.map((paint) => <option key={paint.catalogItemId} value={paint.catalogItemId}>{paint.name}</option>)}
                      </select>
                    </DF>
                    <DF label="MATERIAL">
                      <select value={item.materialCatalogItemId} disabled={isSaving} onChange={(e) => updateItem(item.key, { materialCatalogItemId: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                        {materials.map((material) => <option key={material.catalogItemId} value={material.catalogItemId}>{material.name}</option>)}
                      </select>
                    </DF>
                    <div className="grid grid-cols-2 gap-4">
                      <DF label="ÁREA (m²)">
                        <input type="number" min="0.001" step="0.001" value={item.areaM2} disabled={isSaving} onChange={(e) => updateItem(item.key, { areaM2: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                      </DF>
                      <DF label="QUANTIDADE">
                        <input type="number" min="1" step="1" value={item.quantity} disabled={isSaving} onChange={(e) => updateItem(item.key, { quantity: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                      </DF>
                    </div>
                  </div>
                ))}

                <DF label="VALOR FINAL (R$)">
                  <input type="number" min="0.01" step="0.01" value={saleForm.finalPrice} disabled={isSaving} onChange={(e) => setSaleForm({ ...saleForm, finalPrice: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                </DF>
              </>
            )}

            {submitError && (
              <p role="alert" className="text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{submitError}</p>
            )}
          </div>
          <DrawerFooter
            onCancel={() => setModal(null)}
            onConfirm={submitSale}
            confirmLabel={isSaving ? "Registrando…" : "Registrar venda e criar OS"}
            disabled={isSaving}
          />
        </Drawer>,
        document.body,
      )}
    </div>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[480px] bg-site-card border-l border-site-text/12">
        <div className="flex items-center justify-between px-8 py-6 border-b border-site-text/8">
          <h2 className="text-[20px] text-site-text" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{title}</h2>
          <button onClick={onClose} className="text-site-text/35 hover:text-site-text/90 transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
      </aside>
    </>
  );
}

function DrawerFooter({
  onCancel,
  onConfirm,
  confirmLabel,
  disabled = false,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-3 mt-8">
      <button
        onClick={onCancel}
        disabled={disabled}
        className="flex-1 h-[48px] border border-site-text/18 text-site-text/60 text-[13px] disabled:opacity-50"
        style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
      >
        Cancelar
      </button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        className="flex-1 h-[48px] bg-site-accent text-site-page text-[13px] hover:opacity-90 disabled:opacity-60"
        style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
      >
        {confirmLabel}
      </button>
    </div>
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
