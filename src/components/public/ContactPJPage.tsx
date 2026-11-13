"use client";

import { useRef, useState } from "react";
import { AlertTriangle, Calculator, Check, ChevronDown, FileText, Plus, Send, Trash2, Upload } from "lucide-react";
import { sendApiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import CaptchaField, { type CaptchaFieldHandle } from "@/components/public/CaptchaField";
import { formatPhone } from "@/lib/validation/phone";
import {
  buildEstimatedQuote,
  buildPdfQuote,
  buildPriceRangeRequest,
  CUSTOMER_NAME_MAX_LENGTH,
  EMAIL_MAX_LENGTH,
  EMPTY_CUSTOMER,
  getTodayDateOnly,
  type CustomerFields,
  type EstimatorFields,
  type FieldErrors,
  type PdfFields,
  type OrderItemFields,
} from "@/components/quote/quoteForm";
import type { EstimatorOptions, PriceRange, Quote } from "@/components/quote/types";

// "priceRange" only calculates the range; "estimator" is the formal quote.
type QuotePath = "pdf" | "priceRange" | "estimator";

interface Props {
  estimatorOptions: EstimatorOptions;
}

const FALLBACK_ERROR = "Não foi possível enviar o pedido. Tente novamente.";
const INPUT_CLASS = "w-full h-[46px] px-4 bg-site-card border border-site-text/18 text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent transition-colors [&>option]:bg-site-card";
const TEXTAREA_CLASS = "w-full min-h-[92px] px-4 py-3 bg-site-card border border-site-text/18 text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent transition-colors resize-y";

let nextItemKey = 0;

function createEmptyItem(): OrderItemFields {
  nextItemKey += 1;
  return { key: nextItemKey, paintCatalogItemId: "", materialCatalogItemId: "", description: "", areaM2: "", quantity: "" };
}

function formatMoney(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function toErrorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : FALLBACK_ERROR;
}

export default function ContactPJPage({ estimatorOptions }: Props) {
  const { paintTypes, partMaterials } = estimatorOptions;
  const isEstimatorAvailable = estimatorOptions.isEnabled && paintTypes.length > 0 && partMaterials.length > 0;

  const [customer, setCustomer] = useState<CustomerFields>(EMPTY_CUSTOMER);
  const [pdfFields, setPdfFields] = useState<PdfFields>({ file: null, dueDate: "", notes: "" });
  const [estimatorFields, setEstimatorFields] = useState<EstimatorFields>(() => ({ items: [createEmptyItem()], dueDate: "", color: "", notes: "" }));
  const [isEstimatorOpen, setIsEstimatorOpen] = useState(false);
  // Errors of the last submitted path. The company fields appear in the PDF form
  // and in the formal quote, with the same values.
  const [fieldErrors, setFieldErrors] = useState<{ path: QuotePath; errors: FieldErrors } | null>(null);
  const [submitError, setSubmitError] = useState<{ path: QuotePath; message: string } | null>(null);
  const [submittingPath, setSubmittingPath] = useState<QuotePath | null>(null);
  const [sentPdfName, setSentPdfName] = useState("");
  const [priceRange, setPriceRange] = useState<PriceRange | null>(null);
  const [isQuoteRequested, setIsQuoteRequested] = useState(false);
  const pdfCaptchaRef = useRef<CaptchaFieldHandle>(null);
  const estimatorCaptchaRef = useRef<CaptchaFieldHandle>(null);

  const today = getTodayDateOnly();

  function getFieldError(path: QuotePath, field: string): string | undefined {
    return fieldErrors?.path === path ? fieldErrors.errors[field] : undefined;
  }


  function updateCustomer(field: keyof CustomerFields, value: string) {
    setCustomer((current) => ({ ...current, [field]: value }));
  }

  function updateItem(key: number, field: keyof Omit<OrderItemFields, "key">, value: string) {
    setEstimatorFields((current) => ({
      ...current,
      items: current.items.map((item) => (item.key === key ? { ...item, [field]: value } : item)),
    }));
  }

  function addItem() {
    setEstimatorFields((current) => ({ ...current, items: [...current.items, createEmptyItem()] }));
  }

  function removeItem(key: number) {
    setEstimatorFields((current) => ({ ...current, items: current.items.filter((item) => item.key !== key) }));
  }

  function startSubmit(path: QuotePath, errors: FieldErrors | undefined): boolean {
    setSubmitError(null);
    if (errors) {
      setFieldErrors({ path, errors });
      return false;
    }
    setFieldErrors(null);
    return true;
  }

  async function handlePdfSubmit(event: React.FormEvent) {
    event.preventDefault();
    const { errors, payload } = buildPdfQuote(customer, pdfFields);
    if (!startSubmit("pdf", errors) || !payload) return;
    const captchaToken = pdfCaptchaRef.current?.requireToken();
    if (!captchaToken) return;
    setSubmittingPath("pdf");
    try {
      await sendApiRequest<Quote>("/quotes/pdf", { method: "POST", formData: payload, captchaToken });
      setSentPdfName(pdfFields.file?.name ?? "");
      setPdfFields({ file: null, dueDate: "", notes: "" });
    } catch (error) {
      setSubmitError({ path: "pdf", message: toErrorMessage(error) });
    } finally {
      setSubmittingPath(null);
      pdfCaptchaRef.current?.reset();
    }
  }

  // Only shows the range: nothing is saved and the company is not notified.
  async function handlePriceRangeSubmit(event: React.FormEvent) {
    event.preventDefault();
    const { errors, payload } = buildPriceRangeRequest(estimatorFields.items);
    if (!startSubmit("priceRange", errors) || !payload) return;
    setSubmittingPath("priceRange");
    try {
      setPriceRange(await sendApiRequest<PriceRange>("/quotes/estimator/price-range", { method: "POST", body: payload }));
    } catch (error) {
      setSubmitError({ path: "priceRange", message: toErrorMessage(error) });
    } finally {
      setSubmittingPath(null);
    }
  }

  async function handleEstimatorSubmit(event: React.FormEvent) {
    event.preventDefault();
    const { errors, payload } = buildEstimatedQuote(customer, estimatorFields);
    if (!startSubmit("estimator", errors) || !payload) return;
    const captchaToken = estimatorCaptchaRef.current?.requireToken();
    if (!captchaToken) return;
    setSubmittingPath("estimator");
    try {
      await sendApiRequest<Quote>("/quotes/estimator", { method: "POST", body: payload, captchaToken });
      setIsQuoteRequested(true);
    } catch (error) {
      setSubmitError({ path: "estimator", message: toErrorMessage(error) });
    } finally {
      setSubmittingPath(null);
      estimatorCaptchaRef.current?.reset();
    }
  }

  function startNewEstimate() {
    setPriceRange(null);
    setIsQuoteRequested(false);
    setEstimatorFields({ items: [createEmptyItem()], dueDate: "", color: "", notes: "" });
  }

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-20">
      <div className="border-b border-site-text/12 pb-10 mb-10">
        <p className="text-[13px] tracking-[2.86px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTATO · PESSOA JURÍDICA</p>
        <h1 className="text-[48px] text-site-text leading-[1.05] tracking-[-1.44px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Orçamento para<br />empresas</h1>
        <p className="mt-5 max-w-[720px] text-[15px] text-site-text/55 leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {isEstimatorAvailable
            ? "Escolha como prefere pedir: envie o projeto em PDF ou preencha as peças no simulador para ver uma estimativa inicial na hora e, se quiser, solicitar o orçamento formal."
            : "Envie o projeto em PDF. Nossa equipe analisa o pedido e responde em até 48 horas."}
        </p>
      </div>

      <section className="relative overflow-hidden border border-site-accent/32 bg-site-card p-7 md:p-10 mb-8">
        <div className="absolute top-0 left-0 h-full w-1 bg-site-accent" />
        {sentPdfName ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-5" role="status">
            <div className="w-14 h-14 rounded-full bg-[rgba(52,211,153,0.1)] border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <Check size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] tracking-[2.4px] text-emerald-400 mb-2" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>PROJETO RECEBIDO</p>
              <h2 className="text-[24px] text-site-text mb-2" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Nossa equipe fará a análise manual</h2>
              <p className="text-[14px] text-site-text/62 leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                O arquivo <strong className="text-site-text/85">{sentPdfName}</strong> foi enviado. Nossa equipe responde com o orçamento em até 48 horas.
              </p>
              <button type="button" onClick={() => setSentPdfName("")} className="mt-4 text-[12px] text-site-accent hover:opacity-80" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Enviar outro projeto</button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePdfSubmit} noValidate>
            <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <FileText size={22} className="text-site-accent" />
                  <p className="text-[11px] tracking-[2.4px] text-site-accent" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>{isEstimatorAvailable ? "CAMINHO RECOMENDADO" : "ORÇAMENTO PELA EQUIPE"}</p>
                </div>
                <h2 className="text-[28px] text-site-text leading-tight mb-3" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Enviar projeto em PDF</h2>
                <p className="text-[15px] text-site-text/62 leading-[1.7] max-w-[680px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  Recomendado para pedidos com múltiplas peças ou lotes grandes. Envie plantas, medidas e especificações em um único arquivo de até 10 MB para uma análise mais precisa da equipe.
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <label className="min-w-[250px] min-h-[132px] px-7 py-6 border border-dashed border-site-accent bg-site-accent/5 cursor-pointer flex flex-col items-center justify-center text-center hover:bg-site-accent/9 transition-colors">
                  <Upload size={22} className="text-site-accent mb-3" />
                  <span className="text-[14px] text-site-text max-w-[240px] break-words" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{pdfFields.file ? pdfFields.file.name : "Selecionar arquivo PDF"}</span>
                  <span className="text-[11px] text-site-text/40 mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{pdfFields.file ? "Clique para trocar o arquivo" : "Somente arquivos .pdf"}</span>
                  <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => setPdfFields({ ...pdfFields, file: event.target.files?.[0] ?? null })} />
                </label>
                <FieldError message={getFieldError("pdf", "file")} />
              </div>
            </div>
            <div className="grid md:grid-cols-[220px_1fr] gap-4 mt-8">
              <Field label="PRAZO DESEJADO" error={getFieldError("pdf", "dueDate")}>
                <input type="date" min={today} value={pdfFields.dueDate} onChange={(e) => setPdfFields({ ...pdfFields, dueDate: e.target.value })} className={`${INPUT_CLASS} [color-scheme:dark]`} />
              </Field>
              <Field label="OBSERVAÇÕES" error={getFieldError("pdf", "notes")}>
                <input type="text" value={pdfFields.notes} onChange={(e) => setPdfFields({ ...pdfFields, notes: e.target.value })} placeholder="Algo que a equipe precise saber sobre o projeto" className={INPUT_CLASS} />
              </Field>
            </div>
            <div className="mt-8">
              <CompanyFields customer={customer} onChange={updateCustomer} getError={(field) => getFieldError("pdf", field)} />
            </div>
            <div className="mt-6">
              <CaptchaField ref={pdfCaptchaRef} />
            </div>
            <SubmitError message={submitError?.path === "pdf" ? submitError.message : undefined} />
            <div className="mt-6 flex justify-end">
              <button type="submit" disabled={submittingPath !== null} className="flex items-center gap-2 h-[48px] px-7 rounded-full bg-site-accent text-site-page text-[14px] disabled:opacity-50" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                <Upload size={16} /> {submittingPath === "pdf" ? "Enviando..." : "Enviar projeto"}
              </button>
            </div>
          </form>
        )}
      </section>

      {isEstimatorAvailable && (
        <section className="border border-site-text/10 bg-site-card/55">
          <button type="button" onClick={() => setIsEstimatorOpen(!isEstimatorOpen)} aria-expanded={isEstimatorOpen} className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-4">
              <Calculator size={18} className="text-site-text/42" />
              <div>
                <p className="text-[14px] text-site-text/74" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>Prefere preencher item a item?</p>
                <p className="text-[12px] text-site-text/38 mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Use o simulador para obter uma estimativa inicial.</p>
              </div>
            </div>
            <ChevronDown size={18} className={`text-site-text/45 transition-transform ${isEstimatorOpen ? "rotate-180" : ""}`} />
          </button>

          {isEstimatorOpen && (
            <div className="border-t border-site-text/8 p-6 md:p-8">
              {isQuoteRequested ? (
                <QuoteRequested onRestart={startNewEstimate} />
              ) : priceRange ? (
                <>
                  <PriceRangeResult priceRange={priceRange} onAdjust={() => setPriceRange(null)} />
                  <form onSubmit={handleEstimatorSubmit} noValidate>
                    <div className="mt-10">
                      <SectionTitle>PRAZO E DETALHES</SectionTitle>
                      <div className="grid md:grid-cols-[220px_1fr] gap-4 mt-5">
                        <Field label="PRAZO DESEJADO *" error={getFieldError("estimator", "dueDate")}>
                          <input type="date" min={today} value={estimatorFields.dueDate} onChange={(e) => setEstimatorFields({ ...estimatorFields, dueDate: e.target.value })} className={`${INPUT_CLASS} [color-scheme:dark]`} />
                        </Field>
                        <Field label="COR DESEJADA">
                          <input type="text" value={estimatorFields.color} onChange={(e) => setEstimatorFields({ ...estimatorFields, color: e.target.value })} placeholder="Ex.: RAL 7016, preto fosco" className={INPUT_CLASS} />
                        </Field>
                      </div>
                      <div className="mt-4">
                        <Field label="OBSERVAÇÕES" error={getFieldError("estimator", "notes")}>
                          <textarea value={estimatorFields.notes} onChange={(e) => setEstimatorFields({ ...estimatorFields, notes: e.target.value })} placeholder="Algo que a equipe precise saber sobre o projeto" className={TEXTAREA_CLASS} />
                        </Field>
                      </div>
                    </div>

                    <div className="mt-8">
                      <CompanyFields customer={customer} onChange={updateCustomer} getError={(field) => getFieldError("estimator", field)} />
                    </div>
                    <div className="mt-8">
                      <CaptchaField ref={estimatorCaptchaRef} />
                    </div>
                    <SubmitError message={submitError?.path === "estimator" ? submitError.message : undefined} />
                    <div className="mt-8 flex justify-end">
                      <button type="submit" disabled={submittingPath !== null} className="flex items-center gap-2 h-[48px] px-7 rounded-full bg-site-accent text-site-page text-[14px] disabled:opacity-50" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                        <Send size={16} /> {submittingPath === "estimator" ? "Enviando..." : "Solicitar orçamento formal"}
                      </button>
                    </div>
                  </form>
                </>
              ) : (
                <form onSubmit={handlePriceRangeSubmit} noValidate>
                  <SectionTitle>PEÇAS DO PROJETO</SectionTitle>
                  <div className="flex flex-col gap-5 mt-5">
                    {estimatorFields.items.map((item, index) => (
                      <div key={item.key} className="border border-site-text/8 p-5" data-testid="quote-item">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[12px] tracking-[2px] text-site-accent" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>PEÇA {index + 1}</p>
                          {estimatorFields.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(item.key)} className="flex items-center gap-1 text-[12px] text-site-text/45 hover:text-red-400" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                              <Trash2 size={14} /> Remover
                            </button>
                          )}
                        </div>
                        <div className="grid md:grid-cols-2 gap-4">
                          <Field label="TIPO DE PINTURA *" error={getFieldError("priceRange", `items.${index}.paintCatalogItemId`)}>
                            <select value={item.paintCatalogItemId} onChange={(e) => updateItem(item.key, "paintCatalogItemId", e.target.value)} className={`${INPUT_CLASS} cursor-pointer`}>
                              <option value="">Selecione</option>
                              {paintTypes.map((paintType) => <option key={paintType.catalogItemId} value={paintType.catalogItemId}>{paintType.name}</option>)}
                            </select>
                          </Field>
                          <Field label="MATERIAL DA PEÇA *" error={getFieldError("priceRange", `items.${index}.materialCatalogItemId`)}>
                            <select value={item.materialCatalogItemId} onChange={(e) => updateItem(item.key, "materialCatalogItemId", e.target.value)} className={`${INPUT_CLASS} cursor-pointer`}>
                              <option value="">Selecione</option>
                              {partMaterials.map((partMaterial) => <option key={partMaterial.catalogItemId} value={partMaterial.catalogItemId}>{partMaterial.name}</option>)}
                            </select>
                          </Field>
                          <Field label="DESCRIÇÃO DA PEÇA">
                            <input type="text" value={item.description} onChange={(e) => updateItem(item.key, "description", e.target.value)} placeholder="Ex.: chassi de máquina, grade 3m x 2m" className={INPUT_CLASS} />
                          </Field>
                          <div className="grid grid-cols-2 gap-4">
                            <Field label="ÁREA (m²/peça) *" error={getFieldError("priceRange", `items.${index}.areaM2`)}>
                              <input type="text" inputMode="decimal" value={item.areaM2} onChange={(e) => updateItem(item.key, "areaM2", e.target.value)} placeholder="4,5" className={INPUT_CLASS} />
                            </Field>
                            <Field label="QUANTIDADE *" error={getFieldError("priceRange", `items.${index}.quantity`)}>
                              <input type="number" min="1" step="1" value={item.quantity} onChange={(e) => updateItem(item.key, "quantity", e.target.value)} placeholder="10" className={INPUT_CLASS} />
                            </Field>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" onClick={addItem} className="self-start flex items-center gap-2 h-[40px] px-5 border border-dashed border-site-text/25 text-[13px] text-site-text/70 hover:border-site-accent hover:text-site-accent transition-colors" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                      <Plus size={15} /> Adicionar peça
                    </button>
                  </div>
                  <SubmitError message={submitError?.path === "priceRange" ? submitError.message : undefined} />
                  <div className="mt-8 flex justify-end">
                    <button type="submit" disabled={submittingPath !== null} className="flex items-center gap-3 h-[48px] px-7 border border-site-text/20 text-site-text/78 text-[14px] hover:border-site-accent hover:text-site-accent transition-colors disabled:opacity-50" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                      <Calculator size={16} /> {submittingPath === "priceRange" ? "Calculando..." : "Calcular estimativa"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function PriceRangeResult({ priceRange, onAdjust }: { priceRange: PriceRange; onAdjust: () => void }) {
  return (
    <div className="max-w-[780px]" role="status">
      <p className="text-[11px] tracking-[2.4px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>FAIXA ESTIMADA</p>
      <p className="text-[34px] md:text-[44px] text-site-text leading-tight mb-5" style={{ fontFamily: "'Poppins:Bold', sans-serif" }} data-testid="price-range">
        Entre {formatMoney(priceRange.minPrice)} e {formatMoney(priceRange.maxPrice)}
      </p>
      <div className="flex gap-3 p-4 border border-amber-400/30 bg-amber-400/5 mb-5">
        <AlertTriangle size={19} className="text-site-accent flex-shrink-0 mt-0.5" />
        <p className="text-[13px] text-site-text/72 leading-[1.65]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          <strong className="text-site-text">Esta é apenas uma estimativa inicial.</strong> O valor está sujeito à análise e confirmação da Eldo antes da aprovação final do orçamento.
        </p>
      </div>
      <p className="text-[13px] text-site-text/60 mb-5" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
        Para receber o orçamento da Eldo, informe o prazo e os dados da empresa abaixo e solicite o orçamento formal.
      </p>
      <button type="button" onClick={onAdjust} className="h-[46px] px-6 border border-site-text/18 text-site-text/65 text-[13px]">Ajustar peças</button>
    </div>
  );
}

function QuoteRequested({ onRestart }: { onRestart: () => void }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-5" role="status">
      <div className="w-14 h-14 rounded-full bg-[rgba(52,211,153,0.1)] border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
        <Check size={24} className="text-emerald-400" />
      </div>
      <div>
        <p className="text-[11px] tracking-[2.4px] text-emerald-400 mb-2" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>PEDIDO ENVIADO</p>
        <h2 className="text-[24px] text-site-text mb-2" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Recebemos seu pedido de orçamento</h2>
        <p className="text-[14px] text-site-text/62 leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Nossa equipe confere os valores e entra em contato para combinar os próximos passos.
        </p>
        <button type="button" onClick={onRestart} className="mt-4 text-[12px] text-site-accent hover:opacity-80" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Nova simulação</button>
      </div>
    </div>
  );
}

function CompanyFields({ customer, onChange, getError }: { customer: CustomerFields; onChange: (field: keyof CustomerFields, value: string) => void; getError: (field: keyof CustomerFields) => string | undefined }) {
  return (
    <>
      <SectionTitle>DADOS DA EMPRESA</SectionTitle>
      <div className="grid md:grid-cols-2 gap-4 mt-5">
        <Field label="EMPRESA *" error={getError("companyName")}>
          <input type="text" value={customer.companyName} maxLength={CUSTOMER_NAME_MAX_LENGTH} onChange={(e) => onChange("companyName", e.target.value)} placeholder="Razão social" className={INPUT_CLASS} />
        </Field>
        <Field label="CNPJ *" error={getError("cnpj")}>
          <input type="text" inputMode="numeric" value={customer.cnpj} onChange={(e) => onChange("cnpj", e.target.value)} placeholder="00.000.000/0001-00" className={INPUT_CLASS} />
        </Field>
        <Field label="RESPONSÁVEL PELO CONTATO" error={getError("contactName")}>
          <input type="text" value={customer.contactName} maxLength={CUSTOMER_NAME_MAX_LENGTH} onChange={(e) => onChange("contactName", e.target.value)} placeholder="Nome completo" className={INPUT_CLASS} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="TELEFONE (WHATSAPP) *" error={getError("phone")}>
            <input type="tel" inputMode="numeric" value={customer.phone} onChange={(e) => onChange("phone", formatPhone(e.target.value))} placeholder="(61) 99999-9999" className={INPUT_CLASS} />
          </Field>
          <Field label="E-MAIL COMERCIAL *" error={getError("email")}>
            <input type="email" value={customer.email} maxLength={EMAIL_MAX_LENGTH} onChange={(e) => onChange("email", e.target.value)} placeholder="compras@empresa.com.br" className={INPUT_CLASS} />
          </Field>
        </div>
      </div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] tracking-[2.5px] text-site-text/40 pb-2 border-b border-site-text/8" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{children}</p>;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-2 text-[11px] tracking-[1.8px] text-site-text/50" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
      {label}
      {children}
      <FieldError message={error} />
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="text-[12px] tracking-normal text-red-400" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} role="alert">{message}</span>;
}

function SubmitError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="mt-6 flex gap-3 p-4 border border-red-400/40 bg-red-400/5" role="alert">
      <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
      <p className="text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{message}</p>
    </div>
  );
}
