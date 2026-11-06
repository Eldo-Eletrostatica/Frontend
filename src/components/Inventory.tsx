import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, AlertTriangle, ArrowUp, ArrowDown, History, X, Package } from "lucide-react";

interface Item {
  id: number;
  name: string;
  category: string;
  supplier: string;
  unit: string;
  qty: number;
  minQty: number;
  updatedAt: string;
}

interface Movement {
  id: number;
  itemId: number;
  itemName: string;
  type: "entrada" | "saída";
  qty: number;
  reason: string;
  date: string;
  user: string;
}

const ITEMS_INIT: Item[] = [
  { id: 1, name: "Tinta epóxi preta fosca RAL 9005", category: "Tintas", supplier: "Jotun Brasil", unit: "kg", qty: 48, minQty: 20 },
  { id: 2, name: "Tinta poliéster cinza RAL 7016", category: "Tintas", supplier: "Tigre Tintas", unit: "kg", qty: 12, minQty: 20 },
  { id: 3, name: "Primer anticorrosivo epóxi", category: "Insumos", supplier: "Akzo Nobel", unit: "L", qty: 35, minQty: 10 },
  { id: 4, name: "Desengraxante industrial", category: "Químicos", supplier: "Quimisa", unit: "L", qty: 8, minQty: 15 },
  { id: 5, name: "Lixa grão 80 (folha)", category: "Abrasivos", supplier: "Norton", unit: "un", qty: 200, minQty: 50 },
  { id: 6, name: "Lixa grão 120 (folha)", category: "Abrasivos", supplier: "Norton", unit: "un", qty: 40, minQty: 50 },
  { id: 7, name: "EPI — luva nitrila (par)", category: "EPI", supplier: "Proteplus", unit: "par", qty: 60, minQty: 30 },
  { id: 8, name: "Máscara respiratória PFF2", category: "EPI", supplier: "Proteplus", unit: "un", qty: 14, minQty: 20 },
].map((i) => ({ ...i, updatedAt: "12/09/2025" }));

const MOVES_INIT: Movement[] = [
  { id: 1, itemId: 1, itemName: "Tinta epóxi preta fosca", type: "entrada", qty: 20, reason: "Compra PO-2241", date: "10/09/2025", user: "Carlos A." },
  { id: 2, itemId: 3, itemName: "Primer anticorrosivo", type: "saída", qty: 5, reason: "OS #0089", date: "11/09/2025", user: "Ricardo M." },
  { id: 3, itemId: 4, itemName: "Desengraxante industrial", type: "saída", qty: 7, reason: "OS #0090", date: "12/09/2025", user: "Ricardo M." },
  { id: 4, itemId: 2, itemName: "Tinta poliéster cinza", type: "saída", qty: 8, reason: "OS #0091", date: "12/09/2025", user: "Carlos A." },
];

const CATEGORIES = ["Todos", "Tintas", "Insumos", "Químicos", "Abrasivos", "EPI"];
type ModalType = "add-item" | "movement" | "history" | null;

export default function Inventory() {
  const [items, setItems] = useState<Item[]>(ITEMS_INIT);
  const [movements, setMovements] = useState<Movement[]>(MOVES_INIT);
  const [catFilter, setCatFilter] = useState("Todos");
  const [modal, setModal] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [showAlertsOnly, setShowAlertsOnly] = useState(false);

  const [itemForm, setItemForm] = useState({ name: "", category: "Tintas", supplier: "", unit: "kg", qty: "", minQty: "" });
  const [moveForm, setMoveForm] = useState({ type: "entrada" as "entrada" | "saída", qty: "", reason: "" });

  const alerts = items.filter((i) => i.qty <= i.minQty);

  const visible = items
    .filter((i) => catFilter === "Todos" || i.category === catFilter)
    .filter((i) => !showAlertsOnly || i.qty <= i.minQty);

  function addItem() {
    if (!itemForm.name) return;
    setItems((prev) => [...prev, {
      id: Date.now(), name: itemForm.name, category: itemForm.category,
      supplier: itemForm.supplier, unit: itemForm.unit,
      qty: parseInt(itemForm.qty) || 0, minQty: parseInt(itemForm.minQty) || 0,
      updatedAt: new Date().toLocaleDateString("pt-BR"),
    }]);
    setItemForm({ name: "", category: "Tintas", supplier: "", unit: "kg", qty: "", minQty: "" });
    setModal(null);
  }

  function registerMovement() {
    if (!selectedItem || !moveForm.qty) return;
    const qty = parseInt(moveForm.qty);
    setItems((prev) => prev.map((i) =>
      i.id === selectedItem.id
        ? { ...i, qty: moveForm.type === "entrada" ? i.qty + qty : Math.max(0, i.qty - qty), updatedAt: new Date().toLocaleDateString("pt-BR") }
        : i
    ));
    setMovements((prev) => [{
      id: Date.now(), itemId: selectedItem.id, itemName: selectedItem.name,
      type: moveForm.type, qty, reason: moveForm.reason, date: new Date().toLocaleDateString("pt-BR"), user: "Você",
    }, ...prev]);
    setMoveForm({ type: "entrada", qty: "", reason: "" });
    setModal(null);
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
          <button onClick={() => { setModal("history"); }} className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)] text-[12px] hover:border-[rgba(245,242,236,0.4)] transition-colors" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <History size={14} /> Histórico
          </button>
          <button onClick={() => setModal("add-item")} className="flex items-center gap-2 px-5 py-2.5 bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
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
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setCatFilter(c)}
            className={`px-4 py-2 text-[11px] tracking-[1.5px] transition-all ${catFilter === c ? "bg-[#e9b421] text-[#12100d]" : "border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.55)] hover:text-[rgba(245,242,236,0.9)]"}`}
            style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Table */}
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
              const alert = item.qty <= item.minQty;
              return (
                <tr key={item.id} className={`border-b border-[rgba(245,242,236,0.06)] hover:bg-[rgba(245,242,236,0.02)] transition-colors ${alert ? "bg-[rgba(233,180,33,0.03)]" : ""}`}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      {alert && <AlertTriangle size={13} className="text-[#e9b421] flex-shrink-0" />}
                      <p className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{item.name}</p>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.55)] border border-[rgba(245,242,236,0.12)] px-2 py-0.5" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{item.category.toUpperCase()}</span>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.55)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{item.supplier}</td>
                  <td className="px-5 py-4">
                    <span className={`text-[15px] ${alert ? "text-[#e9b421]" : "text-[#f5f2ec]"}`} style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                      {item.qty} <span className="text-[11px] text-[rgba(245,242,236,0.4)]">{item.unit}</span>
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[13px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{item.minQty} {item.unit}</td>
                  <td className="px-5 py-4 text-[12px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{item.updatedAt}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setSelectedItem(item); setMoveForm({ type: "entrada", qty: "", reason: "" }); setModal("movement"); }}
                        className="flex items-center gap-1 px-3 py-1.5 border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.6)] text-[11px] hover:border-[#e9b421] hover:text-[#e9b421] transition-all"
                        style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                        <Package size={11} /> Movimentar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add item modal */}
      {modal === "add-item" && createPortal(
        <Drawer title="Cadastrar item" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-5">
            <DF label="NOME DO ITEM"><input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })} placeholder="Ex.: Tinta epóxi preta RAL 9005" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <div className="grid grid-cols-2 gap-4">
              <DF label="CATEGORIA">
                <select value={itemForm.category} onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  {["Tintas","Insumos","Químicos","Abrasivos","EPI"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </DF>
              <DF label="UNIDADE">
                <select value={itemForm.unit} onChange={(e) => setItemForm({ ...itemForm, unit: e.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  {["kg","L","un","par","cx","rolo"].map((u) => <option key={u}>{u}</option>)}
                </select>
              </DF>
            </div>
            <DF label="FORNECEDOR"><input type="text" value={itemForm.supplier} onChange={(e) => setItemForm({ ...itemForm, supplier: e.target.value })} placeholder="Razão social do fornecedor" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <div className="grid grid-cols-2 gap-4">
              <DF label="QUANTIDADE INICIAL"><input type="number" min="0" value={itemForm.qty} onChange={(e) => setItemForm({ ...itemForm, qty: e.target.value })} placeholder="0" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
              <DF label="ESTOQUE MÍNIMO"><input type="number" min="0" value={itemForm.minQty} onChange={(e) => setItemForm({ ...itemForm, minQty: e.target.value })} placeholder="0" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            </div>
          </div>
          <DrawerFooter onCancel={() => setModal(null)} onConfirm={addItem} confirmLabel="Cadastrar item" />
        </Drawer>,
        document.body
      )}

      {/* Movement modal */}
      {modal === "movement" && selectedItem && createPortal(
        <Drawer title={`Movimentar: ${selectedItem.name}`} onClose={() => setModal(null)}>
          <div className="flex flex-col gap-5">
            <div className="p-4 border border-[rgba(245,242,236,0.1)] flex items-center justify-between">
              <span className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Saldo atual</span>
              <span className="text-[20px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{selectedItem.qty} {selectedItem.unit}</span>
            </div>

            <DF label="TIPO DE MOVIMENTAÇÃO">
              <div className="grid grid-cols-2 gap-2">
                {(["entrada", "saída"] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setMoveForm({ ...moveForm, type: t })}
                    className={`h-[44px] flex items-center justify-center gap-2 text-[13px] border transition-all ${moveForm.type === t ? "border-[#e9b421] bg-[rgba(233,180,33,0.1)] text-[#e9b421]" : "border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.5)]"}`}
                    style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                    {t === "entrada" ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </DF>

            <DF label={`QUANTIDADE (${selectedItem.unit})`}><input type="number" min="1" value={moveForm.qty} onChange={(e) => setMoveForm({ ...moveForm, qty: e.target.value })} placeholder="0" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
            <DF label="MOTIVO / REFERÊNCIA"><input type="text" value={moveForm.reason} onChange={(e) => setMoveForm({ ...moveForm, reason: e.target.value })} placeholder="Ex.: OS #0092, Compra PO-2250" className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></DF>
          </div>
          <DrawerFooter onCancel={() => setModal(null)} onConfirm={registerMovement} confirmLabel="Registrar movimentação" />
        </Drawer>,
        document.body
      )}

      {/* History modal */}
      {modal === "history" && createPortal(
        <Drawer title="Histórico de movimentações" onClose={() => setModal(null)}>
          <div className="flex flex-col gap-px bg-[rgba(245,242,236,0.06)]">
            {movements.map((m) => (
              <div key={m.id} className="bg-[#171511] px-4 py-4 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    {m.type === "entrada" ? <ArrowUp size={13} className="text-[#e9b421]" /> : <ArrowDown size={13} className="text-red-400" />}
                    <span className={`text-[12px] tracking-[1.5px] ${m.type === "entrada" ? "text-[#e9b421]" : "text-red-400"}`} style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{m.type.toUpperCase()}</span>
                  </div>
                  <p className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{m.itemName}</p>
                  <p className="text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{m.reason} · {m.user}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-4">
                  <p className={`text-[18px] ${m.type === "entrada" ? "text-[#e9b421]" : "text-[rgba(245,242,236,0.6)]"}`} style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                    {m.type === "entrada" ? "+" : "−"}{m.qty}
                  </p>
                  <p className="text-[11px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{m.date}</p>
                </div>
              </div>
            ))}
            {movements.length === 0 && <p className="p-8 text-center text-[rgba(245,242,236,0.35)] text-[14px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Nenhuma movimentação registrada.</p>}
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
      <button onClick={onCancel} className="flex-1 h-[48px] border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[13px] hover:border-[rgba(245,242,236,0.35)] transition-colors" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Cancelar</button>
      <button onClick={onConfirm} className="flex-1 h-[48px] bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{confirmLabel}</button>
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
