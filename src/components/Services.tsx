import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, X, AlertTriangle, Clock } from "lucide-react";
import { useServices, type ServiceStatus } from "../lib/servicesContext";

type Status = ServiceStatus;

const STATUS_CONFIG: Record<Status, { label: string; color: string; bg: string }> = {
  fila:        { label: "Em fila",       color: "text-[rgba(245,242,236,0.55)]", bg: "bg-[rgba(245,242,236,0.08)]" },
  producao:    { label: "Em produção",   color: "text-[#e9b421]",               bg: "bg-[rgba(233,180,33,0.15)]"  },
  finalizacao: { label: "Finalização",   color: "text-blue-300",                bg: "bg-[rgba(147,197,253,0.12)]" },
  concluido:   { label: "Concluído",     color: "text-emerald-400",             bg: "bg-[rgba(52,211,153,0.1)]"   },
};

const STATUSES: Status[] = ["fila", "producao", "finalizacao", "concluido"];

function isLate(deadline: string, status: Status): boolean {
  if (status === "concluido") return false;
  return new Date(deadline) < new Date();
}

export default function Services() {
  const { orders: services, addOrder, updateStatus: ctxUpdateStatus } = useServices();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [modal, setModal] = useState<"add" | "detail" | null>(null);
  const [selected, setSelected] = useState<typeof services[0] | null>(null);

  const [form, setForm] = useState({ client: "", cnpj: "", scope: "", deadline: "", responsible: "", notes: "" });

  const lateCount = services.filter((s) => isLate(s.deadline, s.status)).length;

  function addService() {
    if (!form.client || !form.scope) return;
    addOrder({
      client: form.client, cnpj: form.cnpj, scope: form.scope, deadline: form.deadline,
      createdAt: new Date().toISOString().split("T")[0],
      status: "fila", responsible: form.responsible, notes: form.notes, saleCode: "",
    });
    setForm({ client: "", cnpj: "", scope: "", deadline: "", responsible: "", notes: "" });
    setModal(null);
  }

  function updateStatus(id: number, status: Status) {
    ctxUpdateStatus(id, status);
    if (selected?.id === id) setSelected((s) => s ? { ...s, status } : s);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ORDENS DE SERVIÇO</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Serviços</h1>
        </div>
        <div className="flex gap-2">
          {(["kanban","list"] as const).map((v) => (
            <button key={v} onClick={() => setView(v)}
              className={`px-4 py-2 text-[11px] tracking-[1.5px] transition-all ${view === v ? "bg-[#e9b421] text-[#12100d]" : "border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.55)]"}`}
              style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
              {v === "kanban" ? "KANBAN" : "LISTA"}
            </button>
          ))}
          <button onClick={() => setModal("add")} className="flex items-center gap-2 px-5 py-2.5 bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            <Plus size={16} /> Novo serviço
          </button>
        </div>
      </div>

      {/* Alerts */}
      {lateCount > 0 && (
        <div className="flex items-center gap-3 px-5 py-3 mb-6 border border-[rgba(233,180,33,0.4)]">
          <AlertTriangle size={16} className="text-[#e9b421]" />
          <p className="text-[13px] text-[rgba(245,242,236,0.8)]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <span className="text-[#e9b421] font-bold">{lateCount}</span> {lateCount === 1 ? "serviço atrasado" : "serviços atrasados"} — verifique prazos no painel
          </p>
        </div>
      )}

      {view === "kanban" ? (
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
                    <button key={s.id} onClick={() => { setSelected(s); setModal("detail"); }}
                      className={`text-left p-4 border transition-colors hover:border-[rgba(245,242,236,0.25)] ${isLate(s.deadline, s.status) ? "border-[rgba(233,180,33,0.35)]" : "border-[rgba(245,242,236,0.1)]"}`}
                      style={{ background: "#171511" }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{s.code}</span>
                        {isLate(s.deadline, s.status) && <AlertTriangle size={12} className="text-[#e9b421]" />}
                      </div>
                      <p className="text-[13px] text-[#f5f2ec] leading-[1.3] mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{s.client}</p>
                      <p className="text-[11px] text-[rgba(245,242,236,0.5)] leading-[1.4] mb-3" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.scope}</p>
                      <div className="flex items-center gap-1 text-[11px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                        <Clock size={10} />
                        {new Date(s.deadline).toLocaleDateString("pt-BR")}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="border border-[rgba(245,242,236,0.08)] overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(245,242,236,0.1)]">
                {["OS", "CLIENTE", "ESCOPO", "RESPONSÁVEL", "PRAZO", "STATUS", ""].map((h) => (
                  <th key={h} className="px-5 py-4 text-left text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const late = isLate(s.deadline, s.status);
                const cfg = STATUS_CONFIG[s.status];
                return (
                  <tr key={s.id} className="border-b border-[rgba(245,242,236,0.06)] hover:bg-[rgba(245,242,236,0.02)]">
                    <td className="px-5 py-4 text-[12px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{s.code}</td>
                    <td className="px-5 py-4 text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{s.client}</td>
                    <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.6)] max-w-[220px] truncate" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.scope}</td>
                    <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.55)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.responsible}</td>
                    <td className="px-5 py-4">
                      <div className={`flex items-center gap-1 text-[12px] ${late ? "text-[#e9b421]" : "text-[rgba(245,242,236,0.5)]"}`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                        {late && <AlertTriangle size={11} />}
                        {new Date(s.deadline).toLocaleDateString("pt-BR")}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-[11px] tracking-[1.5px] px-2 py-1 ${cfg.color} ${cfg.bg}`} style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                        {cfg.label.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <button onClick={() => { setSelected(s); setModal("detail"); }} className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.4)] hover:text-[#e9b421] transition-colors" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
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

      {/* Add modal */}
      {modal === "add" && createPortal(
        <Drawer title="Novo serviço" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-5">
            <DF label="CLIENTE"><input type="text" value={form.client} onChange={(e) => setForm({ ...form, client: e.target.value })} placeholder="Nome ou razão social" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <DF label="CNPJ (opcional — permite acesso à área do cliente)"><input type="text" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0001-00" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <DF label="ESCOPO DO SERVIÇO"><textarea value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} rows={3} placeholder="Descreva as peças, processo e acabamento" className="w-full px-4 py-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] resize-none transition-colors" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <div className="grid grid-cols-2 gap-4">
              <DF label="PRAZO"><input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
              <DF label="RESPONSÁVEL"><input type="text" value={form.responsible} onChange={(e) => setForm({ ...form, responsible: e.target.value })} placeholder="Nome" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            </div>
            <DF label="OBSERVAÇÕES"><input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Instruções especiais de entrega, etc." className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
          </div>
          <DrawerFooter onCancel={() => setModal(null)} onConfirm={addService} confirmLabel="Cadastrar serviço" />
        </Drawer>,
        document.body
      )}

      {/* Detail modal */}
      {modal === "detail" && selected && createPortal(
        <Drawer title={selected.code} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CLIENTE</p>
              <p className="text-[17px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{selected.client}</p>
            </div>
            <div>
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ESCOPO</p>
              <p className="text-[14px] text-[rgba(245,242,236,0.75)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{selected.scope}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PRAZO</p>
                <p className={`text-[14px] ${isLate(selected.deadline, selected.status) ? "text-[#e9b421]" : "text-[#f5f2ec]"}`} style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                  {new Date(selected.deadline).toLocaleDateString("pt-BR")}
                  {isLate(selected.deadline, selected.status) && " ⚠ ATRASADO"}
                </p>
              </div>
              <div>
                <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>RESPONSÁVEL</p>
                <p className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{selected.responsible}</p>
              </div>
            </div>
            {selected.notes && (
              <div>
                <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>OBS.</p>
                <p className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{selected.notes}</p>
              </div>
            )}

            <div>
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ATUALIZAR STATUS</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map((st) => {
                  const cfg = STATUS_CONFIG[st];
                  return (
                    <button key={st} onClick={() => updateStatus(selected.id, st)}
                      className={`py-3 text-[12px] tracking-[1.5px] border transition-all ${selected.status === st ? `${cfg.bg} ${cfg.color} border-transparent` : "border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.5)] hover:border-[rgba(245,242,236,0.3)]"}`}
                      style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                      {cfg.label.toUpperCase()}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
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
