import { useState } from "react";
import { createPortal } from "react-dom";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";
import type { Employee, Role } from "../App";

const INITIAL: Employee[] = [
  { id: 1, name: "Carlos Andrade", email: "carlos.andrade@eldo.com.br", role: "admin", status: "ativo", lastAccess: "12/09/2025 09:41" },
  { id: 2, name: "Fernanda Lopes", email: "fernanda.lopes@eldo.com.br", role: "gestor", status: "ativo", lastAccess: "11/09/2025 16:20" },
  { id: 3, name: "Ricardo Melo", email: "ricardo.melo@eldo.com.br", role: "funcionario", status: "ativo", lastAccess: "10/09/2025 08:05" },
  { id: 4, name: "Aline Souza", email: "aline.souza@eldo.com.br", role: "gestor", status: "inativo", lastAccess: "28/08/2025 14:30" },
  { id: 5, name: "Thiago Pires", email: "thiago.pires@eldo.com.br", role: "funcionario", status: "ativo", lastAccess: "12/09/2025 07:58" },
];

const ROLE_LABELS: Record<Role, string> = { admin: "Administrador", gestor: "Gestor", funcionario: "Funcionário" };

type ModalMode = "add" | "edit" | null;

const EMPTY: Omit<Employee, "id" | "lastAccess"> = { name: "", email: "", role: "funcionario", status: "ativo" };

export default function Employees() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<ModalMode>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Omit<Employee, "id" | "lastAccess">>(EMPTY);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() {
    setForm(EMPTY);
    setEditing(null);
    setModal("add");
  }

  function openEdit(e: Employee) {
    setForm({ name: e.name, email: e.email, role: e.role, status: e.status });
    setEditing(e);
    setModal("edit");
  }

  function save() {
    if (!form.name || !form.email) return;
    if (modal === "add") {
      setEmployees((prev) => [
        ...prev,
        { id: Date.now(), ...form, lastAccess: "—" },
      ]);
    } else if (editing) {
      setEmployees((prev) =>
        prev.map((e) => (e.id === editing.id ? { ...e, ...form } : e))
      );
    }
    setModal(null);
  }

  function confirmDelete() {
    if (deleteTarget !== null) {
      setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget));
      setDeleteTarget(null);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            CONTROLE DE ACESSO
          </p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Funcionários
          </h1>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 bg-[#e9b421] text-[#12100d] text-[13px] tracking-[0.5px] hover:opacity-90 transition-opacity"
          style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
        >
          <Plus size={16} /> Novo funcionário
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-[400px]">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(245,242,236,0.35)]" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-[44px] pl-10 pr-4 bg-[#171511] border border-[rgba(245,242,236,0.15)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors"
          style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
        />
      </div>

      {/* Table */}
      <div className="border border-[rgba(245,242,236,0.08)] overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[rgba(245,242,236,0.1)]">
              {["NOME", "E-MAIL", "PERMISSÃO", "STATUS", "ÚLTIMO ACESSO", ""].map((h) => (
                <th
                  key={h}
                  className="px-5 py-4 text-left text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]"
                  style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp, i) => (
              <tr
                key={emp.id}
                className={`border-b border-[rgba(245,242,236,0.06)] hover:bg-[rgba(245,242,236,0.02)] transition-colors ${i % 2 === 0 ? "" : "bg-[rgba(245,242,236,0.015)]"}`}
              >
                <td className="px-5 py-4">
                  <p className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{emp.name}</p>
                </td>
                <td className="px-5 py-4">
                  <p className="text-[13px] text-[rgba(245,242,236,0.6)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{emp.email}</p>
                </td>
                <td className="px-5 py-4">
                  <RoleTag role={emp.role} />
                </td>
                <td className="px-5 py-4">
                  <StatusDot status={emp.status} />
                </td>
                <td className="px-5 py-4">
                  <p className="text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{emp.lastAccess}</p>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3 justify-end">
                    <button onClick={() => openEdit(emp)} className="text-[rgba(245,242,236,0.35)] hover:text-[#e9b421] transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(emp.id)} className="text-[rgba(245,242,236,0.35)] hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-[14px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  Nenhum funcionário encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[12px] text-[rgba(245,242,236,0.3)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
        {filtered.length} {filtered.length === 1 ? "funcionário" : "funcionários"}
      </p>

      {/* Add / Edit drawer */}
      {modal && createPortal(
        <>
          <div className="fixed inset-0 z-40 bg-black/60" onClick={() => setModal(null)} />
          <aside
            className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[480px] border-l border-[rgba(245,242,236,0.12)]"
            style={{ background: "#171511" }}
          >
            {/* Drawer header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-[rgba(245,242,236,0.08)]">
              <div>
                <p className="text-[11px] tracking-[2px] text-[#e9b421] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                  {modal === "add" ? "NOVO CADASTRO" : "EDITAR CADASTRO"}
                </p>
                <h2 className="text-[22px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                  {modal === "add" ? "Novo funcionário" : "Editar funcionário"}
                </h2>
              </div>
              <button
                onClick={() => setModal(null)}
                className="text-[rgba(245,242,236,0.35)] hover:text-[rgba(245,242,236,0.9)] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Drawer body — scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
              <Field label="NOME COMPLETO">
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome do funcionário"
                  className="input-base"
                  style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                />
              </Field>

              <Field label="E-MAIL">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="funcionario@eldo.com.br"
                  className="input-base"
                  style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                />
              </Field>

              {/* Permissão + Status lado a lado */}
              <div className="grid grid-cols-2 gap-4">
                <Field label="PERMISSÃO">
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                    className="input-base"
                    style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                  >
                    <option value="funcionario">Funcionário</option>
                    <option value="gestor">Gestor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </Field>
                <Field label="STATUS">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value as "ativo" | "inativo" })}
                    className="input-base"
                    style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                  >
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </Field>
              </div>

              {/* Role description */}
              <div className="border border-[rgba(245,242,236,0.07)] px-5 py-4">
                <p className="text-[11px] tracking-[1.8px] text-[rgba(245,242,236,0.4)] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                  SOBRE ESTE NÍVEL
                </p>
                <p className="text-[13px] text-[rgba(245,242,236,0.55)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  {form.role === "admin"
                    ? "Acesso total: dashboard, relatórios, gestão de funcionários e configurações do sistema."
                    : form.role === "gestor"
                    ? "Acesso ao dashboard e exportação de relatórios. Sem acesso à gestão de funcionários."
                    : "Acesso básico à área interna. Sem dashboard, relatórios ou gestão de equipe."}
                </p>
              </div>
            </div>

            {/* Drawer footer — fixed */}
            <div className="px-8 py-6 border-t border-[rgba(245,242,236,0.08)] flex gap-3">
              <button
                onClick={() => setModal(null)}
                className="flex-1 h-[48px] border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[13px] hover:border-[rgba(245,242,236,0.35)] transition-colors"
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
              >
                Cancelar
              </button>
              <button
                onClick={save}
                className="flex-1 h-[48px] bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity"
                style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
              >
                {modal === "add" ? "Criar conta" : "Salvar alterações"}
              </button>
            </div>
          </aside>
        </>,
        document.body
      )}

      {/* Delete confirm */}
      {deleteTarget !== null && createPortal(
        <Modal title="Excluir funcionário" onClose={() => setDeleteTarget(null)}>
          <p className="text-[15px] text-[rgba(245,242,236,0.7)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Esta ação removerá o acesso do funcionário permanentemente. Deseja continuar?
          </p>
          <div className="flex justify-end gap-3 mt-8">
            <button
              onClick={() => setDeleteTarget(null)}
              className="px-5 py-2.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[13px] hover:border-[rgba(245,242,236,0.35)] transition-colors"
              style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              className="px-5 py-2.5 bg-red-600 text-white text-[13px] hover:opacity-90 transition-opacity"
              style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
            >
              Excluir
            </button>
          </div>
        </Modal>,
        document.body
      )}

      <style>{`.input-base { width: 100%; height: 46px; padding: 0 14px; background: #171511; border: 1px solid rgba(245,242,236,0.18); color: #f5f2ec; font-size: 14px; outline: none; transition: border-color 0.15s; } .input-base:focus { border-color: #e9b421; } .input-base option { background: #1a1713; }`}</style>
    </div>
  );
}

function RoleTag({ role }: { role: Role }) {
  const colors: Record<Role, string> = {
    admin: "bg-[#e9b421] text-[#12100d]",
    gestor: "bg-[rgba(233,180,33,0.18)] text-[#e9b421]",
    funcionario: "bg-[rgba(245,242,236,0.08)] text-[rgba(245,242,236,0.6)]",
  };
  return (
    <span
      className={`inline-block px-3 py-1 text-[11px] tracking-[1.5px] ${colors[role]}`}
      style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
    >
      {ROLE_LABELS[role].toUpperCase()}
    </span>
  );
}

function StatusDot({ status }: { status: "ativo" | "inativo" }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-1.5 h-1.5 rounded-full ${status === "ativo" ? "bg-[#e9b421]" : "bg-[rgba(245,242,236,0.2)]"}`} />
      <span
        className="text-[12px] tracking-[1.5px] text-[rgba(245,242,236,0.55)]"
        style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}
      >
        {status.toUpperCase()}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-[480px] border border-[rgba(245,242,236,0.12)] p-8" style={{ background: "#171511" }}>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[20px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            {title}
          </h2>
          <button onClick={onClose} className="text-[rgba(245,242,236,0.4)] hover:text-[rgba(245,242,236,0.9)] transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
