"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, FileBarChart2, LogOut, Menu, X, Package, Wrench, ShoppingBag, Palette, MessageSquare, HandCoins, Calculator } from "lucide-react";
import { useAuth, type Role } from "@/lib/auth/AuthProvider";
import { buildLoginPath } from "@/lib/auth/loginRedirect";
import { ROUTES } from "@/lib/routes";
import EldoLogo from "./EldoLogo";

interface NavItem { href: string; label: string; icon: React.ReactNode; roles: Role[]; group: string; }

const NAV: NavItem[] = [
  { href: ROUTES.dashboard,     label: "Dashboard",     icon: <LayoutDashboard size={16} />, roles: ["admin","manager"],               group: "Análise" },
  { href: ROUTES.reports,       label: "Relatórios",    icon: <FileBarChart2 size={16} />,   roles: ["admin","manager"],               group: "Análise" },
  { href: ROUTES.serviceOrders, label: "Serviços",      icon: <Wrench size={16} />,          roles: ["admin","manager","employee"], group: "Operação" },
  { href: ROUTES.inventory,     label: "Estoque",       icon: <Package size={16} />,         roles: ["admin","manager","employee"], group: "Operação" },
  { href: ROUTES.sales,         label: "Vendas",        icon: <ShoppingBag size={16} />,     roles: ["admin","manager","employee"], group: "Comercial" },
  { href: ROUTES.commissions,   label: "Comissões",     icon: <HandCoins size={16} />,      roles: ["admin","manager","employee"], group: "Comercial" },
  { href: ROUTES.contactRequests, label: "Contatos",    icon: <MessageSquare size={16} />,   roles: ["admin","manager","employee"], group: "Comercial" },
  { href: ROUTES.employees,     label: "Funcionários",  icon: <Users size={16} />,           roles: ["admin"],                        group: "Admin" },
  { href: ROUTES.quoteTable,    label: "Tabela de orçamento", icon: <Calculator size={16} />, roles: ["admin"],                        group: "Admin" },
  { href: ROUTES.siteEditor,    label: "Editor do site",icon: <Palette size={16} />,         roles: ["admin"],                        group: "Admin" },
];

const ROLE_LABEL: Record<Role, string> = { admin: "Administrador", manager: "Gestor", employee: "Funcionário" };

// Hiding a screen here only spares the employee a refusal: the Backend
// guards decide what each role can really do.
export default function InternalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentEmployee, hasLoaded, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  // Leaving on purpose goes to the plain login; losing the session keeps the
  // current screen in "next" to come back to it.
  const isLoggingOutRef = useRef(false);

  const allowed = currentEmployee ? NAV.filter((n) => n.roles.includes(currentEmployee.role)) : [];
  const isCurrentRouteAllowed = allowed.some((n) => n.href === pathname);
  const firstAllowedHref = allowed[0]?.href;

  useEffect(() => {
    if (!hasLoaded) return;
    if (!currentEmployee) {
      const { pathname: currentPath, search } = window.location;
      router.replace(isLoggingOutRef.current ? ROUTES.internalLogin : buildLoginPath(`${currentPath}${search}`));
    } else if (!isCurrentRouteAllowed && firstAllowedHref) {
      router.replace(firstAllowedHref);
    }
  }, [hasLoaded, currentEmployee, isCurrentRouteAllowed, firstAllowedHref, router]);

  function handleLogout() {
    isLoggingOutRef.current = true;
    // The provider clears the local session even when the request fails, and
    // the effect above then leads to the login either way.
    logout().catch(() => {});
  }

  if (!currentEmployee || !isCurrentRouteAllowed) {
    return <div className="min-h-screen" style={{ background: "#12100d" }} />;
  }

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
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-[13px] transition-all text-left rounded-none mb-0.5
                      ${active ? "bg-[rgba(233,180,33,0.1)] text-[#e9b421]" : "text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.85)] hover:bg-[rgba(245,242,236,0.03)]"}`}
                    style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-5 py-4 border-t border-[rgba(245,242,236,0.07)]">
          <div className="flex items-center justify-between">
            <div className="overflow-hidden">
              <p className="text-[13px] text-[#f5f2ec] truncate" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{currentEmployee.name}</p>
              <p className="text-[10px] tracking-[1.5px] text-[rgba(245,242,236,0.35)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                {ROLE_LABEL[currentEmployee.role].toUpperCase()}
              </p>
            </div>
            <button onClick={handleLogout} className="text-[rgba(245,242,236,0.35)] hover:text-[#e9b421] transition-colors ml-2 flex-shrink-0" title="Sair">
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
          <button onClick={handleLogout} className="text-[rgba(245,242,236,0.4)]"><X size={20} /></button>
        </header>

        <main className="flex-1 overflow-auto px-6 py-8 lg:px-10 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
