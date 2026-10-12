import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, Trophy, TrendingUp } from "lucide-react";
import { usePricing, calcEstimate, type PricingConfig } from "../lib/pricingContext";
import { useServices } from "../lib/servicesContext";

interface Sale {
  id: number;
  code: string;
  client: string;
  service: string;
  value: number;
  seller: string;
  date: string;
  status: "pendente" | "pago";
  commission: number;
}

interface CommissionRule {
  id: number;
  seller: string;
  serviceType: string;
  rateType: "percentual" | "fixo";
  rate: number;
}

const RULES_INIT: CommissionRule[] = [
  { id: 1, seller: "Carlos Andrade",  serviceType: "Todos",              rateType: "percentual", rate: 3.5 },
  { id: 2, seller: "Fernanda Lopes",  serviceType: "Máquinas industriais", rateType: "percentual", rate: 4.0 },
  { id: 3, seller: "Ricardo Melo",    serviceType: "Todos",              rateType: "fixo",        rate: 80 },
];

function calcCommission(value: number, seller: string, rules: CommissionRule[]): number {
  const rule = rules.find((r) => r.seller === seller) ?? rules[0];
  if (!rule) return 0;
  return rule.rateType === "percentual" ? Math.round(value * rule.rate / 100) : rule.rate;
}

const SELLERS = ["Carlos Andrade", "Fernanda Lopes", "Ricardo Melo", "Thiago Pires"];

const SALES_INIT: Sale[] = [
  { id: 1, code: "VD-0041", client: "Metalúrgica Prata",    service: "Pintura estrutura", value: 4800, seller: "Carlos Andrade", date: "2025-09-08", status: "pago",    commission: 168 },
  { id: 2, code: "VD-0042", client: "Construmetal SP",       service: "Pintura cobertura", value: 12400, seller: "Fernanda Lopes", date: "2025-09-09", status: "pendente", commission: 496 },
  { id: 3, code: "VD-0043", client: "João Pedro Silva",      service: "Portão residencial", value: 920,  seller: "Ricardo Melo",   date: "2025-09-10", status: "pago",    commission: 80 },
  { id: 4, code: "VD-0044", client: "Agropecuária Horizonte",service: "Pintura chassi",    value: 7300,  seller: "Carlos Andrade", date: "2025-09-11", status: "pago",    commission: 255 },
  { id: 5, code: "VD-0045", client: "Datacenter Nuvem",      service: "Racks condutivos",  value: 18600, seller: "Fernanda Lopes", date: "2025-09-12", status: "pendente", commission: 744 },
];

const TABS = ["Vendas", "Comissões", "Regras de comissão", "Tabela de orçamento"] as const;
type Tab = typeof TABS[number];

export default function Sales() {
  const { config, setConfig } = usePricing();
  const { addOrder } = useServices();
  const [sales, setSales] = useState<Sale[]>(SALES_INIT);
  const [rules, setRules] = useState<CommissionRule[]>(RULES_INIT);
  const [tab, setTab] = useState<Tab>("Vendas");
  const [modal, setModal] = useState<"add-sale" | "add-rule" | null>(null);
  const [sellerFilter, setSellerFilter] = useState("Todos");

  const [saleForm, setSaleForm] = useState({ client: "", cnpj: "", service: "", scope: "", deadline: "", responsible: "", value: "", seller: SELLERS[0], date: "" });
  const [ruleForm, setRuleForm] = useState({ seller: SELLERS[0], serviceType: "Todos", rateType: "percentual" as "percentual" | "fixo", rate: "" });

  function addSale() {
    if (!saleForm.client || !saleForm.value) return;
    const value = parseFloat(saleForm.value);
    const commission = calcCommission(value, saleForm.seller, rules);
    const saleId = Date.now();
    const saleCode = `VD-${String(saleId).slice(-4)}`;
    setSales((prev) => [{ id: saleId, code: saleCode, client: saleForm.client, service: saleForm.service, value, seller: saleForm.seller, date: saleForm.date || new Date().toISOString().split("T")[0], status: "pendente", commission }, ...prev]);
    addOrder({
      client: saleForm.client,
      cnpj: saleForm.cnpj,
      scope: saleForm.scope || saleForm.service,
      deadline: saleForm.deadline || "",
      createdAt: new Date().toISOString().split("T")[0],
      status: "fila",
      responsible: saleForm.responsible || saleForm.seller,
      notes: "",
      saleCode,
    });
    setSaleForm({ client: "", cnpj: "", service: "", scope: "", deadline: "", responsible: "", value: "", seller: SELLERS[0], date: "" });
    setModal(null);
  }

  function addRule() {
    if (!ruleForm.rate) return;
    setRules((prev) => [...prev, { id: Date.now(), seller: ruleForm.seller, serviceType: ruleForm.serviceType, rateType: ruleForm.rateType, rate: parseFloat(ruleForm.rate) }]);
    setRuleForm({ seller: SELLERS[0], serviceType: "Todos", rateType: "percentual", rate: "" });
    setModal(null);
  }

  const visibleSales = sellerFilter === "Todos" ? sales : sales.filter((s) => s.seller === sellerFilter);

  // Ranking
  const ranking = SELLERS.map((seller) => ({
    seller,
    total: sales.filter((s) => s.seller === seller).reduce((a, s) => a + s.value, 0),
    commission: sales.filter((s) => s.seller === seller).reduce((a, s) => a + s.commission, 0),
    count: sales.filter((s) => s.seller === seller).length,
  })).sort((a, b) => b.total - a.total);

  const totalSales = sales.reduce((a, s) => a + s.value, 0);
  const totalCommission = sales.reduce((a, s) => a + s.commission, 0);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>LANÇAMENTO DE VENDAS</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Vendas</h1>
        </div>
        {tab !== "Tabela de orçamento" && (
          <button onClick={() => setModal(tab === "Regras de comissão" ? "add-rule" : "add-sale")}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity"
            style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            <Plus size={16} /> {tab === "Regras de comissão" ? "Nova regra" : "Nova venda"}
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(245,242,236,0.08)] mb-px">
        {[
          { label: "TOTAL VENDIDO", value: fmt(totalSales) },
          { label: "TOTAL COMISSÕES", value: fmt(totalCommission) },
          { label: "VENDAS NO PERÍODO", value: String(sales.length) },
          { label: "TICKET MÉDIO", value: fmt(Math.round(totalSales / sales.length)) },
        ].map((k) => (
          <div key={k.label} className="bg-[#12100d] px-6 py-5">
            <p className="text-[28px] text-[#f5f2ec] leading-tight mb-1" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{k.value}</p>
            <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-0 mb-6 mt-6 border-b border-[rgba(245,242,236,0.1)]">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-3 text-[13px] border-b-2 transition-all ${tab === t ? "border-[#e9b421] text-[#e9b421]" : "border-transparent text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.8)]"}`}
            style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Vendas" && (
        <>
          {/* Seller filter */}
          <div className="flex flex-wrap gap-2 mb-5">
            {["Todos", ...SELLERS].map((s) => (
              <button key={s} onClick={() => setSellerFilter(s)}
                className={`px-4 py-1.5 text-[11px] tracking-[1.5px] transition-all ${sellerFilter === s ? "bg-[#e9b421] text-[#12100d]" : "border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.55)]"}`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                {s.toUpperCase().split(" ")[0]}
              </button>
            ))}
          </div>

          <div className="border border-[rgba(245,242,236,0.08)] overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(245,242,236,0.1)]">
                  {["CÓD.", "CLIENTE", "SERVIÇO", "VALOR", "VENDEDOR", "COMISSÃO", "DATA", "STATUS"].map((h) => (
                    <th key={h} className="px-4 py-4 text-left text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleSales.map((s) => (
                  <tr key={s.id} className="border-b border-[rgba(245,242,236,0.06)] hover:bg-[rgba(245,242,236,0.02)]">
                    <td className="px-4 py-4 text-[11px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{s.code}</td>
                    <td className="px-4 py-4 text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{s.client}</td>
                    <td className="px-4 py-4 text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.service}</td>
                    <td className="px-4 py-4 text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{fmt(s.value)}</td>
                    <td className="px-4 py-4 text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.seller.split(" ")[0]}</td>
                    <td className="px-4 py-4 text-[14px] text-[#e9b421]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{fmt(s.commission)}</td>
                    <td className="px-4 py-4 text-[12px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{new Date(s.date).toLocaleDateString("pt-BR")}</td>
                    <td className="px-4 py-4">
                      <span className={`text-[10px] tracking-[1.5px] px-2 py-1 ${s.status === "pago" ? "text-emerald-400 bg-[rgba(52,211,153,0.1)]" : "text-[rgba(245,242,236,0.55)] bg-[rgba(245,242,236,0.08)]"}`} style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "Comissões" && (
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-[rgba(245,242,236,0.08)]">
          {ranking.map((r, i) => (
            <div key={r.seller} className="bg-[#12100d] p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>#{i + 1}</span>
                {i === 0 && <Trophy size={16} className="text-[#e9b421]" />}
                {i === 1 && <TrendingUp size={16} className="text-[rgba(245,242,236,0.4)]" />}
              </div>
              <p className="text-[15px] text-[#f5f2ec] mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{r.seller.split(" ")[0]}</p>
              <p className="text-[28px] text-[#e9b421] leading-tight mb-1" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{fmt(r.commission)}</p>
              <p className="text-[12px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>em comissão</p>
              <div className="mt-4 pt-4 border-t border-[rgba(245,242,236,0.08)]">
                <p className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{fmt(r.total)} vendido · {r.count} venda(s)</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "Regras de comissão" && (
        <div className="border border-[rgba(245,242,236,0.08)] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(245,242,236,0.1)]">
                {["VENDEDOR", "TIPO DE SERVIÇO", "TIPO DE COMISSÃO", "VALOR"].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.id} className="border-b border-[rgba(245,242,236,0.06)]">
                  <td className="px-5 py-4 text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{r.seller}</td>
                  <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{r.serviceType}</td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.55)] border border-[rgba(245,242,236,0.12)] px-2 py-0.5" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                      {r.rateType.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[14px] text-[#e9b421]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                    {r.rateType === "percentual" ? `${r.rate}%` : fmt(r.rate)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "Tabela de orçamento" && (
        <PricingRulesEditor config={config} setConfig={setConfig} />
      )}

      {/* Add sale modal */}
      {modal === "add-sale" && createPortal(
        <Drawer title="Nova venda" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-5">
            <div className="px-4 py-3 border-l-2 border-[#e9b421]" style={{ background: "rgba(233,180,33,0.04)" }}>
              <p className="text-[11px] text-[rgba(245,242,236,0.55)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Ao registrar a venda, uma OS é criada automaticamente e o cliente pode acompanhá-la pela área do cliente.
              </p>
            </div>

            <p className="text-[10px] tracking-[2.5px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>DADOS DO CLIENTE</p>
            <DF label="CLIENTE / EMPRESA"><input type="text" value={saleForm.client} onChange={(e) => setSaleForm({ ...saleForm, client: e.target.value })} placeholder="Nome ou razão social" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <DF label="CNPJ (opcional — habilita área do cliente PJ)"><input type="text" value={saleForm.cnpj} onChange={(e) => setSaleForm({ ...saleForm, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>

            <p className="text-[10px] tracking-[2.5px] text-[rgba(245,242,236,0.35)] mt-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>VENDA</p>
            <DF label="SERVIÇO VENDIDO"><input type="text" value={saleForm.service} onChange={(e) => setSaleForm({ ...saleForm, service: e.target.value })} placeholder="Ex.: Pintura estrutura industrial" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <div className="grid grid-cols-2 gap-4">
              <DF label="VALOR (R$)"><input type="number" min="0" step="0.01" value={saleForm.value} onChange={(e) => setSaleForm({ ...saleForm, value: e.target.value })} placeholder="0,00" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
              <DF label="DATA"><input type="date" value={saleForm.date} onChange={(e) => setSaleForm({ ...saleForm, date: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            </div>
            <DF label="VENDEDOR">
              <select value={saleForm.seller} onChange={(e) => setSaleForm({ ...saleForm, seller: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                {SELLERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </DF>

            <p className="text-[10px] tracking-[2.5px] text-[rgba(245,242,236,0.35)] mt-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ORDEM DE SERVIÇO (gerada automaticamente)</p>
            <DF label="ESCOPO TÉCNICO"><textarea value={saleForm.scope} onChange={(e) => setSaleForm({ ...saleForm, scope: e.target.value })} rows={2} placeholder="Peças, processo, acabamento… (deixe em branco para usar o nome do serviço)" className="w-full px-4 py-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] resize-none transition-colors" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <div className="grid grid-cols-2 gap-4">
              <DF label="PRAZO DE ENTREGA"><input type="date" value={saleForm.deadline} onChange={(e) => setSaleForm({ ...saleForm, deadline: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
              <DF label="RESPONSÁVEL TÉCNICO"><input type="text" value={saleForm.responsible} onChange={(e) => setSaleForm({ ...saleForm, responsible: e.target.value })} placeholder="Nome (padrão: vendedor)" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            </div>

            {saleForm.value && (
              <div className="p-4 border border-[rgba(245,242,236,0.1)]">
                <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>COMISSÃO ESTIMADA</p>
                <p className="text-[22px] text-[#e9b421]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                  {fmt(calcCommission(parseFloat(saleForm.value) || 0, saleForm.seller, rules))}
                </p>
              </div>
            )}
          </div>
          <DrawerFooter onCancel={() => setModal(null)} onConfirm={addSale} confirmLabel="Registrar venda e criar OS" />
        </Drawer>,
        document.body
      )}

      {/* Add rule modal */}
      {modal === "add-rule" && createPortal(
        <Drawer title="Nova regra de comissão" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-5">
            <DF label="VENDEDOR">
              <select value={ruleForm.seller} onChange={(e) => setRuleForm({ ...ruleForm, seller: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                {SELLERS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </DF>
            <DF label="TIPO DE SERVIÇO"><input type="text" value={ruleForm.serviceType} onChange={(e) => setRuleForm({ ...ruleForm, serviceType: e.target.value })} placeholder="Ex.: Máquinas industriais, ou Todos" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <DF label="TIPO DE COMISSÃO">
              <div className="grid grid-cols-2 gap-2">
                {(["percentual","fixo"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setRuleForm({ ...ruleForm, rateType: t })}
                    className={`h-[44px] border text-[12px] tracking-[1px] transition-all ${ruleForm.rateType === t ? "border-[#e9b421] bg-[rgba(233,180,33,0.1)] text-[#e9b421]" : "border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.5)]"}`}
                    style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                    {t === "percentual" ? "PERCENTUAL (%)" : "VALOR FIXO (R$)"}
                  </button>
                ))}
              </div>
            </DF>
            <DF label={ruleForm.rateType === "percentual" ? "PERCENTUAL (%)" : "VALOR (R$)"}>
              <input type="number" min="0" step="0.1" value={ruleForm.rate} onChange={(e) => setRuleForm({ ...ruleForm, rate: e.target.value })} placeholder={ruleForm.rateType === "percentual" ? "3,5" : "80"} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </DF>
          </div>
          <DrawerFooter onCancel={() => setModal(null)} onConfirm={addRule} confirmLabel="Salvar regra" />
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

function DrawerFooter({ onCancel, onConfirm, confirmLabel }: { onCancel: () => void; onConfirm: () => void; confirmLabel: string }) {
  return (
    <div className="flex gap-3 mt-8">
      <button onClick={onCancel} className="flex-1 h-[48px] border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[13px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Cancelar</button>
      <button onClick={onConfirm} className="flex-1 h-[48px] bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{confirmLabel}</button>
    </div>
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

/* ─── Pricing Rules Editor (US08) ─────────────────────────────────────────── */

function PricingRulesEditor({ config, setConfig }: { config: PricingConfig; setConfig: (c: PricingConfig) => void }) {
  const [saved, setSaved] = useState(false);

  function updateServicePrice(id: number, value: string) {
    const n = parseFloat(value);
    if (isNaN(n) || n < 0) return;
    setConfig({ ...config, serviceRules: config.serviceRules.map((r) => r.id === id ? { ...r, pricePerM2: n } : r) });
  }

  function toggleService(id: number) {
    setConfig({ ...config, serviceRules: config.serviceRules.map((r) => r.id === id ? { ...r, active: !r.active } : r) });
  }

  function addService() {
    const name = prompt("Nome do novo tipo de pintura:");
    if (!name?.trim()) return;
    setConfig({ ...config, serviceRules: [...config.serviceRules, { id: Date.now(), name: name.trim(), pricePerM2: 40, active: true }] });
  }

  function updateMultiplier(id: number, value: string) {
    const n = parseFloat(value);
    if (isNaN(n) || n <= 0) return;
    setConfig({ ...config, materialRules: config.materialRules.map((r) => r.id === id ? { ...r, multiplier: n } : r) });
  }

  function toggleMaterial(id: number) {
    setConfig({ ...config, materialRules: config.materialRules.map((r) => r.id === id ? { ...r, active: !r.active } : r) });
  }

  function addMaterial() {
    const name = prompt("Nome do novo material:");
    if (!name?.trim()) return;
    setConfig({ ...config, materialRules: [...config.materialRules, { id: Date.now(), name: name.trim(), multiplier: 1.0, active: true }] });
  }

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const inpCls = "w-full h-[42px] px-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] outline-none focus:border-[#e9b421] transition-colors text-right";

  return (
    <div className="flex flex-col gap-8">
      {/* Info banner */}
      <div className="flex items-start gap-3 px-5 py-4 border border-[rgba(233,180,33,0.2)] bg-[rgba(233,180,33,0.04)]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#e9b421] flex-shrink-0 mt-1.5" />
        <p className="text-[13px] text-[rgba(245,242,236,0.65)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          As regras abaixo alimentam o <strong className="text-[rgba(245,242,236,0.9)]">calculador automático de orçamentos PJ</strong> exibido no site público. Alterações entram em vigor imediatamente após salvar. Serviços e materiais desativados não aparecem no formulário público.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Service prices */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] tracking-[2.5px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>TIPOS DE PINTURA</p>
              <p className="text-[12px] text-[rgba(245,242,236,0.45)] mt-0.5" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Preço base em R$/m²</p>
            </div>
            <button onClick={addService} className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[11px] hover:border-[#e9b421] hover:text-[#e9b421] transition-all" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              <Plus size={11} /> Adicionar
            </button>
          </div>

          <div className="border border-[rgba(245,242,236,0.08)]">
            <div className="grid grid-cols-[1fr_100px_44px] border-b border-[rgba(245,242,236,0.08)] px-4 py-2">
              {["SERVIÇO", "R$/m²", ""].map((h) => (
                <span key={h} className="text-[10px] tracking-[2px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</span>
              ))}
            </div>
            {config.serviceRules.map((r) => (
              <div key={r.id} className={`grid grid-cols-[1fr_100px_44px] items-center border-b border-[rgba(245,242,236,0.06)] last:border-0 px-4 py-2 ${!r.active ? "opacity-40" : ""}`}>
                <span className="text-[13px] text-[#f5f2ec] truncate pr-3" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{r.name}</span>
                <input
                  type="number" min="1" step="0.5"
                  value={r.pricePerM2}
                  onChange={(e) => updateServicePrice(r.id, e.target.value)}
                  disabled={!r.active}
                  className={inpCls}
                  style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
                />
                <button onClick={() => toggleService(r.id)}
                  className={`ml-2 w-8 h-5 rounded-full transition-colors flex-shrink-0 relative ${r.active ? "bg-[#e9b421]" : "bg-[rgba(245,242,236,0.15)]"}`}
                  title={r.active ? "Desativar" : "Ativar"}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${r.active ? "translate-x-3" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Material multipliers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] tracking-[2.5px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>MATERIAIS</p>
              <p className="text-[12px] text-[rgba(245,242,236,0.45)] mt-0.5" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Multiplicador sobre o preço base</p>
            </div>
            <button onClick={addMaterial} className="flex items-center gap-1.5 px-3 py-1.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[11px] hover:border-[#e9b421] hover:text-[#e9b421] transition-all" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              <Plus size={11} /> Adicionar
            </button>
          </div>

          <div className="border border-[rgba(245,242,236,0.08)]">
            <div className="grid grid-cols-[1fr_100px_44px] border-b border-[rgba(245,242,236,0.08)] px-4 py-2">
              {["MATERIAL", "MULT.", ""].map((h) => (
                <span key={h} className="text-[10px] tracking-[2px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</span>
              ))}
            </div>
            {config.materialRules.map((r) => (
              <div key={r.id} className={`grid grid-cols-[1fr_100px_44px] items-center border-b border-[rgba(245,242,236,0.06)] last:border-0 px-4 py-2 ${!r.active ? "opacity-40" : ""}`}>
                <span className="text-[13px] text-[#f5f2ec] truncate pr-3" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{r.name}</span>
                <input
                  type="number" min="0.1" step="0.01"
                  value={r.multiplier}
                  onChange={(e) => updateMultiplier(r.id, e.target.value)}
                  disabled={!r.active}
                  className={inpCls}
                  style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
                />
                <button onClick={() => toggleMaterial(r.id)}
                  className={`ml-2 w-8 h-5 rounded-full transition-colors flex-shrink-0 relative ${r.active ? "bg-[#e9b421]" : "bg-[rgba(245,242,236,0.15)]"}`}
                  title={r.active ? "Desativar" : "Ativar"}>
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${r.active ? "translate-x-3" : "translate-x-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Global settings */}
      <div className="grid md:grid-cols-2 gap-6 border-t border-[rgba(245,242,236,0.08)] pt-8">
        <DF label="ÁREA MÍNIMA (m²)">
          <input type="number" min="0.1" step="0.1" value={config.minArea}
            onChange={(e) => setConfig({ ...config, minArea: parseFloat(e.target.value) || 0.5 })}
            className="w-full h-[46px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] outline-none focus:border-[#e9b421] transition-colors"
            style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          <p className="text-[12px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Área mínima aceita no formulário público.</p>
        </DF>
        <DF label="AVISO EXIBIDO AO CLIENTE">
          <textarea value={config.disclaimer} rows={3}
            onChange={(e) => setConfig({ ...config, disclaimer: e.target.value })}
            className="w-full px-4 py-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] outline-none focus:border-[#e9b421] transition-colors resize-none"
            style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
        </DF>
      </div>

      {/* Simulator */}
      <SimulatorPreview config={config} />

      {/* Save */}
      <div className="flex justify-end">
        <button onClick={save} className={`flex items-center gap-2 px-8 py-3 text-[14px] transition-all ${saved ? "bg-emerald-500 text-white" : "bg-[#e9b421] text-[#12100d] hover:opacity-90"}`}
          style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
          {saved ? "✓ Regras salvas" : "Salvar e publicar regras"}
        </button>
      </div>
    </div>
  );
}

function SimulatorPreview({ config }: { config: PricingConfig }) {
  const active = config.serviceRules.filter((r) => r.active);
  const activeMat = config.materialRules.filter((r) => r.active);
  const [svc, setSvc] = useState(active[0]?.name ?? "");
  const [mat, setMat] = useState(activeMat[0]?.name ?? "");
  const [area, setArea] = useState("4");
  const [qty, setQty] = useState("5");

  const result = calcEstimate(config, svc, mat, parseFloat(area) || 0, parseInt(qty) || 1);
  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 0 });

  return (
    <div className="border border-[rgba(245,242,236,0.1)] p-6" style={{ background: "#171511" }}>
      <p className="text-[11px] tracking-[2.5px] text-[rgba(245,242,236,0.4)] mb-5" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SIMULADOR — PRÉVIA DO CÁLCULO</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <DF label="SERVIÇO">
          <select value={svc} onChange={(e) => setSvc(e.target.value)}
            className="w-full h-[42px] px-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors"
            style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {active.map((r) => <option key={r.id}>{r.name}</option>)}
          </select>
        </DF>
        <DF label="MATERIAL">
          <select value={mat} onChange={(e) => setMat(e.target.value)}
            className="w-full h-[42px] px-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors"
            style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {activeMat.map((r) => <option key={r.id}>{r.name}</option>)}
          </select>
        </DF>
        <DF label="ÁREA (m²/peça)">
          <input type="number" min="0.1" step="0.5" value={area} onChange={(e) => setArea(e.target.value)}
            className="w-full h-[42px] px-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors"
            style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
        </DF>
        <DF label="QUANTIDADE">
          <input type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)}
            className="w-full h-[42px] px-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors"
            style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
        </DF>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[13px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Estimativa gerada:</span>
        <span className="text-[28px] text-[#e9b421]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{fmt(result)}</span>
      </div>
    </div>
  );
}
