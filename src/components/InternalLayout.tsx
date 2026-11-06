import { useState } from "react";
import { LayoutDashboard, Users, FileBarChart2, LogOut, Menu, X, Package, Wrench, ShoppingBag, Palette } from "lucide-react";
import type { Role } from "../App";
import Dashboard from "./Dashboard";
import Employees from "./Employees";
import Reports from "./Reports";
import Inventory from "./Inventory";
import Services from "./Services";
import Sales from "./Sales";
import SiteEditor from "./SiteEditor";
import EldoLogo from "./EldoLogo";

type View = "dashboard" | "employees" | "reports" | "inventory" | "services" | "sales" | "site-editor";

interface NavItem { id: View; label: string; icon: React.ReactNode; roles: Role[]; group: string; }

const NAV: NavItem[] = [
  { id: "dashboard",   label: "Dashboard",    icon: <LayoutDashboard size={16} />, roles: ["admin","gestor"],               group: "Análise" },
  { id: "reports",     label: "Relatórios",   icon: <FileBarChart2 size={16} />,   roles: ["admin","gestor"],               group: "Análise" },
  { id: "services",    label: "Serviços",     icon: <Wrench size={16} />,          roles: ["admin","gestor","funcionario"], group: "Operação" },
  { id: "inventory",   label: "Estoque",      icon: <Package size={16} />,         roles: ["admin","gestor","funcionario"], group: "Operação" },
  { id: "sales",       label: "Vendas",       icon: <ShoppingBag size={16} />,     roles: ["admin","gestor","funcionario"], group: "Comercial" },
  { id: "employees",   label: "Funcionários", icon: <Users size={16} />,           roles: ["admin"],                        group: "Admin" },
  { id: "site-editor", label: "Editor do site",icon: <Palette size={16} />,        roles: ["admin"],                        group: "Admin" },
];

interface Props {
  currentUser: { name: string; role: Role };
  onLogout: () => void;
}

const ROLE_LABEL: Record<Role, string> = { admin: "Administrador", gestor: "Gestor", funcionario: "Funcionário" };

export default function InternalLayout({ currentUser, onLogout }: Props) {
  const [view, setView] = useState<View>("dashboard");
  const [menuOpen, setMenuOpen] = useState(false);

  const allowed = NAV.filter((n) => n.roles.includes(currentUser.role));
  const groups = Array.from(new Set(allowed.map((n) => n.group)));

  return (
    <div className="min-h-screen flex" style={{ background: "#12100d" }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col w-[220px] border-r border-[rgba(245,242,236,0.07)] transition-transform duration-200
          ${menuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static`}
        style={{ background: "#12100d" }}
      >
        {/* Logo */}
        <div className="px-6 pt-6 pb-6 border-b border-[rgba(245,242,236,0.07)]">
          <EldoLogo imageClassName="w-[38px] h-[38px]" subtitle="ÁREA INTERNA" />
        </div>

        {/* Nav groups */}
        <nav className="flex-1 px-3 py-5 flex flex-col gap-5 overflow-y-auto">
          {groups.map((group) => (
            <div key={group}>
              <p className="px-3 mb-1 text-[10px] tracking-[2px] text-[rgba(245,242,236,0.25)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                {group.toUpperCase()}
              </p>
              {allowed.filter((n) => n.group === group).map((item) => {
                const active = view === item.id;
                return (
                  <button key={item.id} onClick={() => { setView(item.id); setMenuOpen(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] transition-all text-left rounded-none mb-0.5
                      ${active ? "bg-[rgba(233,180,33,0.1)] text-[#e9b421]" : "text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.85)] hover:bg-[rgba(245,242,236,0.03)]"}`}
                    style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-[rgba(245,242,236,0.07)]">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-[13px] text-[#f5f2ec] truncate capitalize" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{currentUser.name}</p>
              <p className="text-[10px] tracking-[1.5px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                {ROLE_LABEL[currentUser.role].toUpperCase()}
              </p>
            </div>
            <button onClick={onLogout} className="text-[rgba(245,242,236,0.35)] hover:text-[#e9b421] transition-colors ml-2 flex-shrink-0" title="Sair">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {menuOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setMenuOpen(false)} />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-[rgba(245,242,236,0.07)]">
          <button onClick={() => setMenuOpen(true)} className="text-[rgba(245,242,236,0.7)]"><Menu size={20} /></button>
          <EldoLogo imageClassName="w-[32px] h-[32px]" subtitle="ÁREA INTERNA" />
          <button onClick={onLogout} className="text-[rgba(245,242,236,0.4)]"><X size={20} /></button>
        </header>

        <main className="flex-1 overflow-auto px-6 py-8 lg:px-10 lg:py-10">
          {view === "dashboard"   && <Dashboard role={currentUser.role} />}
          {view === "employees"   && currentUser.role === "admin" && <Employees />}
          {view === "reports"     && <Reports role={currentUser.role} />}
          {view === "inventory"   && <Inventory />}
          {view === "services"    && <Services />}
          {view === "sales"       && <Sales />}
          {view === "site-editor" && currentUser.role === "admin" && <SiteEditor />}
        </main>
      </div>
    </div>
  );
}
