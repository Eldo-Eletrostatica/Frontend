import { useState } from "react";
import { AlertTriangle, ArrowRight, Calculator, Check, ChevronDown, FileText, Upload } from "lucide-react";
import { usePricing, calcEstimate } from "../../lib/pricingContext";
import { useSiteContent } from "../../lib/siteContentContext";

export default function ContactPJPage() {
  const { config } = usePricing();
  const { content } = useSiteContent();
  const activeServices = config.serviceRules.filter((rule) => rule.active);
  const activeMaterials = config.materialRules.filter((rule) => rule.active);
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [step, setStep] = useState<"form" | "estimate">("form");
  const [pdfName, setPdfName] = useState("");
  const [pdfSent, setPdfSent] = useState(false);
  const [form, setForm] = useState({
    company: "", cnpj: "", contact: "", phone: "", email: "",
    service: activeServices[0]?.name ?? "", material: activeMaterials[0]?.name ?? "",
    piece: "", area: "", qty: "", deadline: "", color: "", notes: "",
  });
  const [estimate, setEstimate] = useState<number | null>(null);

  function handleCalc(event: React.FormEvent) {
    event.preventDefault();
    const area = parseFloat(form.area) || 0;
    const qty = parseInt(form.qty) || 1;
    setEstimate(calcEstimate(config, form.service, form.material, area, qty));
    setStep("estimate");
  }

  function handlePdf(file?: File) {
    if (!file) return;
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) return;
    setPdfName(file.name);
    setPdfSent(true);
  }

  const inputClass = "w-full h-[46px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors";
  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
  const estimateMin = estimate ? Math.max(0, Math.round(estimate * 0.9)) : 0;
  const estimateMax = estimate ? Math.round(estimate * 1.1) : 0;

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-20">
      <div className="border-b border-[rgba(245,242,236,0.12)] pb-10 mb-10">
        <p className="text-[13px] tracking-[2.86px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTATO · PESSOA JURÍDICA</p>
        <h1 className="text-[48px] text-[#f5f2ec] leading-[1.05] tracking-[-1.44px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Orçamento para<br />empresas</h1>
        <p className="mt-5 max-w-[720px] text-[15px] text-[rgba(245,242,236,0.55)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Você pode solicitar seu orçamento enviando um projeto em PDF. Essa opção é indicada para pedidos com várias peças, plantas técnicas ou lotes grandes, e nossa equipe responde em até 48 horas.
        </p>
      </div>

      <section className="relative overflow-hidden border border-[rgba(233,180,33,0.32)] bg-[#171511] p-7 md:p-10 mb-8">
        <div className="absolute top-0 left-0 h-full w-1 bg-[#e9b421]" />
        {pdfSent ? (
          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-[rgba(52,211,153,0.1)] border border-emerald-500/40 flex items-center justify-center flex-shrink-0">
              <Check size={24} className="text-emerald-400" />
            </div>
            <div>
              <p className="text-[11px] tracking-[2.4px] text-emerald-400 mb-2" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>PROJETO RECEBIDO</p>
              <h2 className="text-[24px] text-[#f5f2ec] mb-2" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Nossa equipe fará a análise manual</h2>
              <p className="text-[14px] text-[rgba(245,242,236,0.62)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                O arquivo <strong className="text-[rgba(245,242,236,0.85)]">{pdfName}</strong> foi enviado. Retornaremos com um orçamento em até 48 horas.
              </p>
              <button type="button" onClick={() => { setPdfName(""); setPdfSent(false); }} className="mt-4 text-[12px] text-[#e9b421] hover:opacity-80" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Enviar outro projeto</button>
            </div>
          </div>
        ) : (
          <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FileText size={22} className="text-[#e9b421]" />
                <p className="text-[11px] tracking-[2.4px] text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>CAMINHO RECOMENDADO</p>
              </div>
              <h2 className="text-[28px] text-[#f5f2ec] leading-tight mb-3" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Enviar projeto em PDF</h2>
              <p className="text-[15px] text-[rgba(245,242,236,0.62)] leading-[1.7] max-w-[680px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Recomendado para pedidos com múltiplas peças ou lotes grandes. Envie plantas, medidas e especificações em um único arquivo para uma análise mais precisa da equipe.
              </p>
            </div>
            <label className="min-w-[250px] min-h-[132px] px-7 py-6 border border-dashed border-[#e9b421] bg-[rgba(233,180,33,0.05)] cursor-pointer flex flex-col items-center justify-center text-center hover:bg-[rgba(233,180,33,0.09)] transition-colors">
              <Upload size={22} className="text-[#e9b421] mb-3" />
              <span className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>Selecionar arquivo PDF</span>
              <span className="text-[11px] text-[rgba(245,242,236,0.4)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Somente arquivos .pdf</span>
              <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(event) => handlePdf(event.target.files?.[0])} />
            </label>
          </div>
        )}
      </section>

      {content.showAutomaticSimulator && (
        <section className="border border-[rgba(245,242,236,0.1)] bg-[rgba(23,21,17,0.55)]">
          <button type="button" onClick={() => setSimulatorOpen(!simulatorOpen)} className="w-full px-6 py-5 flex items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-4">
              <Calculator size={18} className="text-[rgba(245,242,236,0.42)]" />
              <div>
                <p className="text-[14px] text-[rgba(245,242,236,0.74)]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>Prefere preencher item a item?</p>
                <p className="text-[12px] text-[rgba(245,242,236,0.38)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Use o simulador para obter uma estimativa inicial.</p>
              </div>
            </div>
            <ChevronDown size={18} className={`text-[rgba(245,242,236,0.45)] transition-transform ${simulatorOpen ? "rotate-180" : ""}`} />
          </button>

          {simulatorOpen && (
            <div className="border-t border-[rgba(245,242,236,0.08)] p-6 md:p-8">
              {step === "form" ? (
                <form onSubmit={handleCalc}>
                  <div className="grid md:grid-cols-2 gap-10">
                    <div className="flex flex-col gap-5">
                      <SectionTitle>DADOS DA EMPRESA</SectionTitle>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="EMPRESA"><input type="text" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Razão social" className={inputClass} /></Field>
                        <Field label="CNPJ"><input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className={inputClass} /></Field>
                      </div>
                      <Field label="RESPONSÁVEL PELO CONTATO"><input type="text" value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} placeholder="Nome completo" className={inputClass} /></Field>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="TELEFONE (WHATSAPP)"><input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="(00) 00000-0000" className={inputClass} /></Field>
                        <Field label="E-MAIL COMERCIAL"><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="compras@empresa.com.br" className={inputClass} /></Field>
                      </div>
                    </div>
                    <div className="flex flex-col gap-5">
                      <SectionTitle>DETALHES DO PROJETO</SectionTitle>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <Field label="TIPO DE PINTURA"><select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} className={`${inputClass} cursor-pointer`}>{activeServices.map((service) => <option key={service.id}>{service.name}</option>)}</select></Field>
                        <Field label="MATERIAL DA PEÇA"><select value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} className={`${inputClass} cursor-pointer`}>{activeMaterials.map((material) => <option key={material.id}>{material.name}</option>)}</select></Field>
                      </div>
                      <Field label="DESCRIÇÃO DA PEÇA"><input type="text" value={form.piece} onChange={(e) => setForm({ ...form, piece: e.target.value })} placeholder="Ex.: chassi de máquina, grade 3m x 2m" className={inputClass} /></Field>
                      <div className="grid grid-cols-3 gap-4">
                        <Field label="ÁREA (m²/peça)"><input type="number" min="0.1" step="0.1" value={form.area} onChange={(e) => setForm({ ...form, area: e.target.value })} placeholder="4,5" className={inputClass} /></Field>
                        <Field label="QUANTIDADE"><input type="number" min="1" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} placeholder="10" className={inputClass} /></Field>
                        <Field label="PRAZO (dias)"><input type="number" min="1" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} placeholder="15" className={inputClass} /></Field>
                      </div>
                      <Field label="COR DESEJADA"><input type="text" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} placeholder="Ex.: RAL 7016, preto fosco" className={inputClass} /></Field>
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button type="submit" className="flex items-center gap-3 h-[48px] px-7 border border-[rgba(245,242,236,0.2)] text-[rgba(245,242,236,0.78)] text-[14px] hover:border-[#e9b421] hover:text-[#e9b421] transition-colors" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}><Calculator size={16} /> Calcular estimativa</button>
                  </div>
                </form>
              ) : (
                <div className="max-w-[780px]">
                  <p className="text-[11px] tracking-[2.4px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>FAIXA ESTIMADA</p>
                  <p className="text-[34px] md:text-[44px] text-[#f5f2ec] leading-tight mb-5" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Entre {money(estimateMin)} e {money(estimateMax)}</p>
                  <div className="flex gap-3 p-4 border border-amber-400/30 bg-amber-400/5 mb-5">
                    <AlertTriangle size={19} className="text-[#e9b421] flex-shrink-0 mt-0.5" />
                    <p className="text-[13px] text-[rgba(245,242,236,0.72)] leading-[1.65]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}><strong className="text-[#f5f2ec]">Esta é apenas uma estimativa inicial.</strong> O valor está sujeito à análise e confirmação da Eldo antes da aprovação final do orçamento.</p>
                  </div>
                  <p className="text-[12px] text-[rgba(245,242,236,0.4)] mb-7" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{form.qty} peça(s) · {form.area} m²/peça · {form.service} · {form.material}</p>
                  <div className="flex gap-3 flex-wrap">
                    <button type="button" onClick={() => setStep("form")} className="h-[46px] px-6 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.65)] text-[13px]">Ajustar dados</button>
                    <button type="button" className="flex items-center gap-2 h-[46px] px-7 rounded-full bg-[#e9b421] text-[#12100d] text-[13px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Solicitar orçamento formal <ArrowRight size={15} /></button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] tracking-[2.5px] text-[rgba(245,242,236,0.4)] pb-2 border-b border-[rgba(245,242,236,0.08)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{children}</p>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="flex flex-col gap-2 text-[11px] tracking-[1.8px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}{children}</label>;
}
