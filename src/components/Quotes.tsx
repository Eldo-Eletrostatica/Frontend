"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Check, FileText, Mail, MessageCircle, Phone, ReceiptText, RotateCcw, Send, X } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { listQuotes, updateQuoteStatus } from "@/lib/quotes/api";
import { QUOTE_STATUS_LABELS, type Quote, type QuoteStatus } from "@/lib/quotes/types";
import { ROUTES } from "@/lib/routes";

type StatusFilter = QuoteStatus | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "requested", label: "Novos" },
  { value: "sent", label: "Valor enviado" },
  { value: "approved", label: "Aprovados" },
  { value: "rejected", label: "Recusados" },
];

const EMPTY_LIST_MESSAGE: Record<StatusFilter, string> = {
  all: "Nenhum orçamento recebido pelo site.",
  requested: "Nenhum orçamento novo.",
  sent: "Nenhum orçamento aguardando a resposta do cliente.",
  approved: "Nenhum orçamento aprovado esperando a venda.",
  rejected: "Nenhum orçamento recusado.",
};

const LOAD_ERROR_MESSAGE = "Não foi possível carregar os orçamentos. Tente novamente.";
const UPDATE_ERROR_MESSAGE = "Não foi possível atualizar o orçamento. Tente novamente.";
const INVALID_VALUE_MESSAGE = "Informe um valor final maior que zero.";
const BRAZIL_COUNTRY_CODE = "55";
const MAX_NATIONAL_PHONE_DIGITS = 11;
const CNPJ_FORMAT = /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/;

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const DATE_TIME_FORMAT = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });
const AREA_FORMAT = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });

type ListState =
  | { kind: "loading" }
  | { kind: "loaded"; quotes: Quote[] }
  | { kind: "failed"; message: string };

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCnpj(document: string): string {
  return document.replace(CNPJ_FORMAT, "$1.$2.$3/$4-$5");
}

// A date-only value at noon stays on the same day in any time zone.
function formatDueDate(dueDate: string): string {
  return new Date(`${dueDate}T12:00:00`).toLocaleDateString("pt-BR");
}

function buildWhatsAppUrl(phone: string): string {
  const digits = onlyDigits(phone);
  const international = digits.length > MAX_NATIONAL_PHONE_DIGITS ? digits : `${BRAZIL_COUNTRY_CODE}${digits}`;
  return `https://wa.me/${international}`;
}

// US21: the quotes asked on the site. The team sends the value, records the
// customer's answer and, once approved, launches the sale.
export default function Quotes() {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const [listState, setListState] = useState<ListState>({ kind: "loading" });
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const load = useCallback(() => {
    return listQuotes()
      .then((quotes) => setListState({ kind: "loaded", quotes }))
      .catch((error: unknown) => setListState({ kind: "failed", message: errorMessageOf(error, LOAD_ERROR_MESSAGE) }));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function reload() {
    setListState({ kind: "loading" });
    void load();
  }

  async function changeStatus(quote: Quote, status: "sent" | "approved" | "rejected", finalPrice?: number) {
    setUpdatingOrderId(quote.orderId);
    setActionError("");
    setSuccessMessage("");
    try {
      const updated = await updateQuoteStatus(quote.orderId, status, finalPrice);
      setListState((current) =>
        current.kind === "loaded"
          ? { kind: "loaded", quotes: current.quotes.map((item) => (item.orderId === updated.orderId ? updated : item)) }
          : current,
      );
      setSuccessMessage(
        status === "sent" ? "Valor registrado como enviado ao cliente." : status === "approved" ? "Orçamento aprovado. Já pode lançar a venda." : "Orçamento marcado como recusado.",
      );
    } catch (error) {
      setActionError(errorMessageOf(error, UPDATE_ERROR_MESSAGE));
    } finally {
      setUpdatingOrderId(null);
    }
  }

  const quotes = listState.kind === "loaded" ? listState.quotes : [];
  const visibleQuotes = filter === "all" ? quotes : quotes.filter((quote) => quote.status === filter);

  return (
    <div>
      <div className="mb-10">
        <p className="text-[12px] tracking-[2.5px] text-site-accent mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          ATENDIMENTO PESSOA JURÍDICA
        </p>
        <h1 className="text-[32px] text-site-text leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
          Orçamentos
        </h1>
        <p className="mt-2 text-[14px] text-site-text/50" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Pedidos feitos pelo simulador e por PDF no site. Envie o valor ao cliente, registre a resposta e lance a venda quando ele aprovar.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Filtrar por status">
        {FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => setFilter(option.value)}
            aria-pressed={filter === option.value}
            className={`px-4 py-2 text-[11px] tracking-[1.5px] transition-all ${filter === option.value ? "bg-site-accent text-site-page" : "border border-site-text/15 text-site-text/55 hover:text-site-text/90"}`}
            style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
          >
            {option.label.toUpperCase()}
            {listState.kind === "loaded" && (
              <span className="ml-2 opacity-60">{option.value === "all" ? quotes.length : quotes.filter((quote) => quote.status === option.value).length}</span>
            )}
          </button>
        ))}
      </div>

      {successMessage && (
        <p role="status" className="mb-4 px-4 py-3 border border-emerald-400/40 text-[13px] text-emerald-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
          {successMessage}
        </p>
      )}
      {actionError && (
        <p role="alert" className="mb-4 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {actionError}
        </p>
      )}

      {listState.kind === "loading" && (
        <p className="px-5 py-10 text-center text-[14px] text-site-text/35 border border-site-text/8" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Carregando orçamentos...
        </p>
      )}

      {listState.kind === "failed" && (
        <div role="alert" className="px-5 py-10 text-center border border-red-500/30">
          <p className="text-[14px] text-red-300 mb-4" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{listState.message}</p>
          <button type="button" onClick={reload} className="px-5 py-2.5 border border-site-text/20 text-[13px] text-site-text hover:border-site-accent hover:text-site-accent transition-colors" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            Tentar novamente
          </button>
        </div>
      )}

      {listState.kind === "loaded" && visibleQuotes.length === 0 && (
        <p className="px-5 py-10 text-center text-[14px] text-site-text/35 border border-site-text/8" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {EMPTY_LIST_MESSAGE[filter]}
        </p>
      )}

      {visibleQuotes.length > 0 && (
        <ul className="flex flex-col gap-3">
          {visibleQuotes.map((quote) => (
            <QuoteCard key={quote.orderId} quote={quote} isUpdating={updatingOrderId === quote.orderId} onChangeStatus={changeStatus} />
          ))}
        </ul>
      )}
    </div>
  );
}

interface QuoteCardProps {
  quote: Quote;
  isUpdating: boolean;
  onChangeStatus: (quote: Quote, status: "sent" | "approved" | "rejected", finalPrice?: number) => void;
}

function QuoteCard({ quote, isUpdating, onChangeStatus }: QuoteCardProps) {
  const [price, setPrice] = useState(quote.finalPrice === null ? "" : String(quote.finalPrice));
  const [priceError, setPriceError] = useState("");
  const canSendValue = quote.status !== "approved";
  const sendLabel = quote.status === "requested" ? "Enviar valor" : quote.status === "rejected" ? "Reabrir com novo valor" : "Reenviar valor";
  const linkClassName = "flex items-center gap-2 text-[13px] text-site-text/70 hover:text-site-accent transition-colors break-all";

  function sendValue() {
    const finalPrice = Number(price);
    if (!(finalPrice > 0)) {
      setPriceError(INVALID_VALUE_MESSAGE);
      return;
    }
    setPriceError("");
    onChangeStatus(quote, "sent", finalPrice);
  }

  return (
    <li data-order-id={quote.orderId} className="border border-site-text/8 bg-site-text/2 px-5 py-5 flex flex-col xl:flex-row gap-5">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-3 mb-1">
          <p className="text-[15px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{quote.customerName}</p>
          <StatusTag status={quote.status} />
          <span className="text-[10px] tracking-[1.5px] text-site-text/40 border border-site-text/12 px-2 py-0.5" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
            {quote.source === "pdf" ? "PDF" : "SIMULADOR"}
          </span>
        </div>
        <p className="text-[12px] text-site-text/40 mb-3" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {quote.customerDocument ? `CNPJ ${formatCnpj(quote.customerDocument)} · ` : ""}Recebido em {DATE_TIME_FORMAT.format(new Date(quote.createdAt))}
          {quote.dueDate ? ` · Prazo desejado ${formatDueDate(quote.dueDate)}` : ""}
        </p>

        {quote.items.length > 0 && (
          <ul className="mb-3 flex flex-col gap-1">
            {quote.items.map((item, index) => (
              <li key={index} className="text-[13px] text-site-text/75" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                {item.paintName} em {item.materialName}: {AREA_FORMAT.format(item.areaM2)} m² × {item.quantity}
              </li>
            ))}
          </ul>
        )}
        {quote.minPrice !== null && quote.maxPrice !== null && (
          <p className="mb-3 text-[13px] text-site-text/60" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Faixa mostrada ao cliente: {BRL.format(quote.minPrice)} a {BRL.format(quote.maxPrice)}
          </p>
        )}
        {quote.pdfUrl && (
          <a href={quote.pdfUrl} target="_blank" rel="noopener noreferrer" className={`${linkClassName} mb-3`} data-quote-link="pdf">
            <FileText size={14} className="flex-shrink-0" /> Abrir o projeto em PDF
          </a>
        )}
        {quote.customerMessage && (
          <p className="text-[14px] text-site-text/75 whitespace-pre-line break-words" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {quote.customerMessage}
          </p>
        )}
        {quote.finalPrice !== null && (
          <p className="mt-3 text-[14px] text-site-accent" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            Valor enviado: {BRL.format(quote.finalPrice)}
          </p>
        )}
      </div>

      <div className="xl:w-[280px] flex flex-col gap-2.5 xl:border-l xl:border-site-text/7 xl:pl-5" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
        <a href={`tel:${onlyDigits(quote.customerPhone)}`} className={linkClassName} data-quote-link="phone">
          <Phone size={14} className="flex-shrink-0" /> {quote.customerPhone}
        </a>
        <a href={`mailto:${quote.customerEmail}`} className={linkClassName} data-quote-link="email">
          <Mail size={14} className="flex-shrink-0" /> {quote.customerEmail}
        </a>
        <a href={buildWhatsAppUrl(quote.customerPhone)} target="_blank" rel="noopener noreferrer" className={linkClassName} data-quote-link="whatsapp">
          <MessageCircle size={14} className="flex-shrink-0" /> Responder pelo WhatsApp
        </a>

        {canSendValue && (
          <label className="mt-2 flex flex-col gap-1.5">
            <span className="text-[11px] tracking-[2px] text-site-text/45" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>VALOR FINAL (R$)</span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              disabled={isUpdating}
              onChange={(event) => setPrice(event.target.value)}
              className="h-[40px] px-3 bg-site-card border border-site-text/18 text-site-text text-[13px] outline-none focus:border-site-accent"
            />
            {priceError && <span role="alert" className="text-[12px] text-red-300">{priceError}</span>}
          </label>
        )}

        <div className="flex flex-col gap-2">
          {canSendValue && (
            <ActionButton primary disabled={isUpdating} onClick={sendValue} icon={<Send size={14} />}>
              {isUpdating ? "Salvando..." : sendLabel}
            </ActionButton>
          )}
          {quote.status === "sent" && (
            <ActionButton disabled={isUpdating} onClick={() => onChangeStatus(quote, "approved")} icon={<Check size={14} />}>
              Cliente aprovou
            </ActionButton>
          )}
          {quote.status === "approved" && (
            <Link
              href={`${ROUTES.sales}?orderId=${quote.orderId}`}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] tracking-[0.5px] bg-site-accent text-site-page hover:opacity-90 transition-opacity"
              style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
              data-quote-action="launch-sale"
            >
              <ReceiptText size={14} /> Lançar venda
            </Link>
          )}
          {(quote.status === "requested" || quote.status === "sent" || quote.status === "approved") && (
            <ActionButton disabled={isUpdating} onClick={() => onChangeStatus(quote, "rejected")} icon={quote.status === "approved" ? <RotateCcw size={14} /> : <X size={14} />}>
              {quote.status === "approved" ? "Cliente desistiu" : "Cliente recusou"}
            </ActionButton>
          )}
        </div>
      </div>
    </li>
  );
}

function ActionButton({ children, icon, onClick, disabled, primary = false }: { children: React.ReactNode; icon: React.ReactNode; onClick: () => void; disabled: boolean; primary?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] tracking-[0.5px] transition-opacity disabled:opacity-50 ${primary ? "bg-site-accent text-site-page hover:opacity-90" : "border border-site-text/20 text-site-text/75 hover:border-site-text/40"}`}
      style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
    >
      {icon} {children}
    </button>
  );
}

const STATUS_TAG_STYLE: Record<QuoteStatus, string> = {
  requested: "bg-site-accent/12 text-site-accent",
  sent: "bg-[rgba(96,165,250,0.12)] text-blue-300",
  approved: "bg-[rgba(74,222,128,0.1)] text-green-400",
  rejected: "bg-[rgba(248,113,113,0.1)] text-red-300",
};

function StatusTag({ status }: { status: QuoteStatus }) {
  return (
    <span className={`px-2 py-0.5 text-[10px] tracking-[1.5px] ${STATUS_TAG_STYLE[status]}`} style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
      {QUOTE_STATUS_LABELS[status]}
    </span>
  );
}
