"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { sendApiRequest } from "@/lib/api/client";
import { useAuth, type Employee, type Role } from "@/lib/auth/AuthProvider";
import { buildLoginPath } from "@/lib/auth/loginRedirect";
import { INVALID_EMAIL_MESSAGE, isValidEmail } from "@/lib/validation/email";

// Same limits as the Backend employee DTOs.
const EMPLOYEE_NAME_MAX_LENGTH = 120;
const EMAIL_MAX_LENGTH = 254;
const PASSWORD_MIN_LENGTH = 6;
const PASSWORD_MAX_LENGTH = 128;

const UNEXPECTED_LOAD_ERROR_MESSAGE = "Não foi possível carregar os funcionários. Tente novamente.";
const UNEXPECTED_SAVE_ERROR_MESSAGE = "Não foi possível salvar os dados do funcionário. Tente novamente.";
const UNEXPECTED_DELETE_ERROR_MESSAGE = "Não foi possível excluir o funcionário. Tente novamente.";

const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrador",
  manager: "Gestor",
  employee: "Funcionário",
};

const ROLE_DESCRIPTIONS: Record<Role, string> = {
  admin: "Acesso total: dashboard, relatórios, gestão de funcionários e configurações do sistema.",
  manager: "Acesso ao dashboard e exportação de relatórios. Sem acesso à gestão de funcionários.",
  employee: "Acesso básico à área interna. Sem dashboard, relatórios ou gestão de equipe.",
};

type DrawerMode = "add" | "edit" | null;

interface EmployeeFormFields {
  name: string;
  email: string;
  password: string;
  role: Role;
}

type FieldErrors = Partial<Record<keyof EmployeeFormFields, string>>;

type ListState =
  | { kind: "loading" }
  | { kind: "loaded"; employees: Employee[] }
  | { kind: "failed"; message: string };

const EMPTY_FORM: EmployeeFormFields = {
  name: "",
  email: "",
  password: "",
  role: "employee",
};

function sortEmployeesByName(employees: Employee[]): Employee[] {
  return [...employees].sort((first, second) => first.name.localeCompare(second.name, "pt-BR"));
}

function validateEmployeeForm(fields: EmployeeFormFields, mode: Exclude<DrawerMode, null>): FieldErrors {
  const errors: FieldErrors = {};

  if (!fields.name.trim()) {
    errors.name = "O nome é obrigatório.";
  }

  if (!fields.email.trim()) {
    errors.email = "Informe o e-mail do funcionário.";
  } else if (!isValidEmail(fields.email)) {
    errors.email = INVALID_EMAIL_MESSAGE;
  }

  if (mode === "add" && !fields.password) {
    errors.password = "Informe a senha inicial.";
  } else if (fields.password.length > 0 && fields.password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  }

  return errors;
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && error.status === 401;
}

function readErrorMessage(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function getBorderClassName(error: string | undefined): string {
  return error ? "border-red-400" : "border-site-text/18";
}

export default function Employees() {
  const { currentEmployee, logout, updateCurrentEmployee } = useAuth();
  const [listState, setListState] = useState<ListState>({ kind: "loading" });
  const [reloadCount, setReloadCount] = useState(0);
  const [search, setSearch] = useState("");

  const [drawerMode, setDrawerMode] = useState<DrawerMode>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [form, setForm] = useState<EmployeeFormFields>(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Employee | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const redirectToLogin = useCallback(() => {
    const { pathname, search: query } = window.location;
    window.location.assign(buildLoginPath(`${pathname}${query}`));
  }, []);

  useEffect(() => {
    let isCurrent = true;
    sendApiRequest<Employee[]>("/employees")
      .then((employees) => {
        if (isCurrent) setListState({ kind: "loaded", employees: sortEmployeesByName(employees) });
      })
      .catch((error: unknown) => {
        if (!isCurrent) return;
        if (isUnauthorized(error)) {
          redirectToLogin();
          return;
        }
        setListState({ kind: "failed", message: readErrorMessage(error, UNEXPECTED_LOAD_ERROR_MESSAGE) });
      });
    return () => {
      isCurrent = false;
    };
  }, [reloadCount, redirectToLogin]);

  function reloadEmployees() {
    setListState({ kind: "loading" });
    setReloadCount((count) => count + 1);
  }

  function openAddDrawer() {
    setForm(EMPTY_FORM);
    setEditingEmployee(null);
    setFieldErrors({});
    setSubmitError("");
    setIsPasswordVisible(false);
    setDrawerMode("add");
  }

  function openEditDrawer(employee: Employee) {
    setForm({
      name: employee.name,
      email: employee.email,
      password: "",
      role: employee.role,
    });
    setEditingEmployee(employee);
    setFieldErrors({});
    setSubmitError("");
    setIsPasswordVisible(false);
    setDrawerMode("edit");
  }

  function closeDrawer() {
    if (isSaving) return;
    setDrawerMode(null);
    setEditingEmployee(null);
    setFieldErrors({});
    setSubmitError("");
  }

  function updateField<Field extends keyof EmployeeFormFields>(field: Field, value: EmployeeFormFields[Field]) {
    setForm((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  async function submitEmployeeForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!drawerMode) return;

    const validationErrors = validateEmployeeForm(form, drawerMode);
    setFieldErrors(validationErrors);
    setSubmitError("");
    if (Object.keys(validationErrors).length > 0) return;

    setIsSaving(true);
    try {
      if (drawerMode === "add") {
        const created = await sendApiRequest<Employee>("/employees", {
          method: "POST",
          body: {
            name: form.name.trim(),
            email: form.email.trim(),
            password: form.password,
            role: form.role,
          },
        });
        setListState((current) => {
          if (current.kind !== "loaded") return current;
          return {
            kind: "loaded",
            employees: sortEmployeesByName([...current.employees, created]),
          };
        });
      } else if (editingEmployee) {
        const body: { name: string; email: string; role: Role; password?: string } = {
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
        };
        if (form.password) {
          body.password = form.password;
        }
        const updated = await sendApiRequest<Employee>(`/employees/${editingEmployee.employeeId}`, {
          method: "PATCH",
          body,
        });
        setListState((current) => {
          if (current.kind !== "loaded") return current;
          const nextEmployees = current.employees.map((item) =>
            item.employeeId === updated.employeeId ? updated : item,
          );
          return { kind: "loaded", employees: sortEmployeesByName(nextEmployees) };
        });
        if (updated.employeeId === currentEmployee?.employeeId) {
          updateCurrentEmployee(updated);
        }
      }
      setDrawerMode(null);
      setEditingEmployee(null);
    } catch (error) {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      if (error instanceof ApiError && error.status === 404 && editingEmployee) {
        setListState((current) => {
          if (current.kind !== "loaded") return current;
          return {
            kind: "loaded",
            employees: current.employees.filter((item) => item.employeeId !== editingEmployee.employeeId),
          };
        });
      }
      setSubmitError(readErrorMessage(error, UNEXPECTED_SAVE_ERROR_MESSAGE));
    } finally {
      setIsSaving(false);
    }
  }

  function openDeleteModal(employee: Employee) {
    setDeleteTarget(employee);
    setDeleteError("");
  }

  function closeDeleteModal() {
    if (isDeleting) return;
    setDeleteTarget(null);
    setDeleteError("");
  }

  async function confirmDeleteEmployee() {
    if (!deleteTarget) return;

    setIsDeleting(true);
    setDeleteError("");
    try {
      await sendApiRequest<void>(`/employees/${deleteTarget.employeeId}`, {
        method: "DELETE",
      });
      if (deleteTarget.employeeId === currentEmployee?.employeeId) {
        await logout();
        return;
      }
      setListState((current) => {
        if (current.kind !== "loaded") return current;
        return {
          kind: "loaded",
          employees: current.employees.filter((item) => item.employeeId !== deleteTarget.employeeId),
        };
      });
      setDeleteTarget(null);
    } catch (error) {
      if (isUnauthorized(error)) {
        redirectToLogin();
        return;
      }
      if (error instanceof ApiError && error.status === 404) {
        setListState((current) => {
          if (current.kind !== "loaded") return current;
          return {
            kind: "loaded",
            employees: current.employees.filter((item) => item.employeeId !== deleteTarget.employeeId),
          };
        });
        setDeleteTarget(null);
        return;
      }
      setDeleteError(readErrorMessage(error, UNEXPECTED_DELETE_ERROR_MESSAGE));
    } finally {
      setIsDeleting(false);
    }
  }

  const normalizedQuery = search.trim().toLowerCase();
  const filteredEmployees =
    listState.kind === "loaded"
      ? listState.employees.filter(
          (employee) =>
            employee.name.toLowerCase().includes(normalizedQuery) ||
            employee.email.toLowerCase().includes(normalizedQuery),
        )
      : [];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-site-accent mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
            CONTROLE DE ACESSO
          </p>
          <h1 className="text-[32px] text-site-text leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Funcionários
          </h1>
        </div>
        <button
          type="button"
          onClick={openAddDrawer}
          className="flex items-center gap-2 px-5 py-3 bg-site-accent text-site-page text-[13px] tracking-[0.5px] hover:opacity-90 transition-opacity"
          style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
        >
          <Plus size={16} /> Novo funcionário
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-[400px]">
        <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-site-text/35" />
        <input
          type="text"
          placeholder="Buscar por nome ou e-mail"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full h-[44px] pl-10 pr-4 bg-site-card border border-site-text/15 text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent transition-colors"
          style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
        />
      </div>

      {listState.kind === "loading" && (
        <p className="px-5 py-10 text-center text-[14px] text-site-text/35 border border-site-text/8" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Carregando funcionários...
        </p>
      )}

      {listState.kind === "failed" && (
        <div role="alert" className="px-5 py-10 text-center border border-red-500/30">
          <p className="text-[14px] text-red-300 mb-4" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {listState.message}
          </p>
          <button
            type="button"
            onClick={reloadEmployees}
            className="px-5 py-2.5 border border-site-text/20 text-[13px] text-site-text hover:border-site-accent hover:text-site-accent transition-colors"
            style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {listState.kind === "loaded" && (
        <>
          <div className="border border-site-text/8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-site-text/10">
                  {["NOME", "E-MAIL", "PERMISSÃO", ""].map((header) => (
                    <th
                      key={header}
                      className="px-5 py-4 text-left text-[11px] tracking-[2px] text-site-text/40"
                      style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee, index) => (
                  <tr
                    key={employee.employeeId}
                    data-employee-id={employee.employeeId}
                    className={`border-b border-site-text/6 hover:bg-site-text/2 transition-colors ${index % 2 === 0 ? "" : "bg-site-text/2"}`}
                  >
                    <td className="px-5 py-4">
                      <p className="text-[14px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
                        {employee.name}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-[13px] text-site-text/60" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                        {employee.email}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <RoleTag role={employee.role} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 justify-end">
                        <button
                          type="button"
                          onClick={() => openEditDrawer(employee)}
                          aria-label={`Editar ${employee.name}`}
                          title="Editar funcionário"
                          className="text-site-text/35 hover:text-site-accent transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteModal(employee)}
                          aria-label={`Excluir ${employee.name}`}
                          title="Excluir funcionário"
                          className="text-site-text/35 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-[14px] text-site-text/35"
                      style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                    >
                      Nenhum funcionário encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12px] text-site-text/30" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {filteredEmployees.length} {filteredEmployees.length === 1 ? "funcionário" : "funcionários"}
          </p>
        </>
      )}

      {/* Add / Edit drawer */}
      {drawerMode &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40 bg-black/60" onClick={closeDrawer} />
            <aside className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[480px] border-l border-site-text/12 bg-site-card">
              {/* Drawer header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-site-text/8">
                <div>
                  <p className="text-[11px] tracking-[2px] text-site-accent mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                    {drawerMode === "add" ? "NOVO CADASTRO" : "EDITAR CADASTRO"}
                  </p>
                  <h2 className="text-[22px] text-site-text" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                    {drawerMode === "add" ? "Novo funcionário" : "Editar funcionário"}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeDrawer}
                  disabled={isSaving}
                  aria-label="Fechar painel"
                  className="text-site-text/35 hover:text-site-text/90 transition-colors disabled:opacity-40"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitEmployeeForm} noValidate className="flex-1 flex flex-col min-h-0">
                {/* Drawer body */}
                <div className="flex-1 overflow-y-auto px-8 py-8 flex flex-col gap-6">
                  <Field label="NOME COMPLETO" htmlFor="employee-name" error={fieldErrors.name}>
                    <input
                      id="employee-name"
                      type="text"
                      maxLength={EMPLOYEE_NAME_MAX_LENGTH}
                      value={form.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      aria-invalid={Boolean(fieldErrors.name)}
                      placeholder="Nome do funcionário"
                      className={`input-base ${getBorderClassName(fieldErrors.name)}`}
                      style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                    />
                  </Field>

                  <Field label="E-MAIL" htmlFor="employee-email" error={fieldErrors.email}>
                    <input
                      id="employee-email"
                      type="email"
                      maxLength={EMAIL_MAX_LENGTH}
                      value={form.email}
                      onChange={(event) => updateField("email", event.target.value)}
                      aria-invalid={Boolean(fieldErrors.email)}
                      placeholder="funcionario@eldo.com.br"
                      className={`input-base ${getBorderClassName(fieldErrors.email)}`}
                      style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                    />
                  </Field>

                  <Field
                    label={drawerMode === "add" ? "SENHA INICIAL" : "NOVA SENHA (OPCIONAL)"}
                    htmlFor="employee-password"
                    error={fieldErrors.password}
                  >
                    <div className="relative">
                      <input
                        id="employee-password"
                        type={isPasswordVisible ? "text" : "password"}
                        maxLength={PASSWORD_MAX_LENGTH}
                        value={form.password}
                        onChange={(event) => updateField("password", event.target.value)}
                        aria-invalid={Boolean(fieldErrors.password)}
                        placeholder={drawerMode === "add" ? "Mínimo de 6 caracteres" : "Deixe em branco para manter a atual"}
                        className={`input-base pr-11 ${getBorderClassName(fieldErrors.password)}`}
                        style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                      />
                      <button
                        type="button"
                        onClick={() => setIsPasswordVisible((visible) => !visible)}
                        aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-site-text/40 hover:text-site-text/85 transition-colors"
                      >
                        {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>

                  <Field label="PERMISSÃO" htmlFor="employee-role">
                    <select
                      id="employee-role"
                      value={form.role}
                      onChange={(event) => updateField("role", event.target.value as Role)}
                      className="input-base border-site-text/18"
                      style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                    >
                      <option value="employee">Funcionário</option>
                      <option value="manager">Gestor</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </Field>

                  {/* Role description */}
                  <div className="border border-site-text/7 px-5 py-4">
                    <p className="text-[11px] tracking-[1.8px] text-site-text/40 mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                      SOBRE ESTE NÍVEL
                    </p>
                    <p className="text-[13px] text-site-text/55 leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                      {ROLE_DESCRIPTIONS[form.role]}
                    </p>
                  </div>

                  {submitError && (
                    <p
                      role="alert"
                      className="px-4 py-3 border border-red-500/40 bg-red-500/10 text-[13px] text-red-300"
                      style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                    >
                      {submitError}
                    </p>
                  )}
                </div>

                {/* Drawer footer */}
                <div className="px-8 py-6 border-t border-site-text/8 flex gap-3">
                  <button
                    type="button"
                    onClick={closeDrawer}
                    disabled={isSaving}
                    className="flex-1 h-[48px] border border-site-text/18 text-site-text/60 text-[13px] hover:border-site-text/35 transition-colors disabled:opacity-50"
                    style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 h-[48px] bg-site-accent text-site-page text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
                    style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
                  >
                    {isSaving ? "Salvando..." : drawerMode === "add" ? "Criar conta" : "Salvar alterações"}
                  </button>
                </div>
              </form>
            </aside>
          </>,
          document.body,
        )}

      {/* Delete confirm */}
      {deleteTarget !== null &&
        createPortal(
          <Modal title="Excluir funcionário" onClose={closeDeleteModal}>
            <p className="text-[15px] text-site-text/70 leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Esta ação removerá o acesso de <strong className="text-site-text">{deleteTarget.name}</strong> à área interna. O histórico de vendas realizadas por esta conta será preservado. Deseja continuar?
            </p>
            {deleteError && (
              <p
                role="alert"
                className="mt-4 px-4 py-3 border border-red-500/40 bg-red-500/10 text-[13px] text-red-300"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
              >
                {deleteError}
              </p>
            )}
            <div className="flex justify-end gap-3 mt-8">
              <button
                type="button"
                onClick={closeDeleteModal}
                disabled={isDeleting}
                className="px-5 py-2.5 border border-site-text/18 text-site-text/60 text-[13px] hover:border-site-text/35 transition-colors disabled:opacity-50"
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteEmployee}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-red-600 text-white text-[13px] hover:opacity-90 transition-opacity disabled:opacity-60"
                style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </div>
          </Modal>,
          document.body,
        )}
    </div>
  );
}

function RoleTag({ role }: { role: Role }) {
  const colors: Record<Role, string> = {
    admin: "bg-site-accent text-site-page",
    manager: "bg-site-accent/18 text-site-accent",
    employee: "bg-site-text/8 text-site-text/60",
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

function Field({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-[11px] tracking-[2px] text-site-text/50" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
        {label}
      </label>
      {children}
      {error && (
        <p className="text-[12px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-[480px] border border-site-text/12 bg-site-card p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[20px] text-site-text" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fechar janela" className="text-site-text/40 hover:text-site-text/90 transition-colors">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
