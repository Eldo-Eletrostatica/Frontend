import { useState } from "react";
import LoginPage from "./components/LoginPage";
import InternalLayout from "./components/InternalLayout";
import PublicSite from "./components/public/PublicSite";
import ClientLogin from "./components/ClientLogin";
import ClientPortal from "./components/ClientPortal";
import type { ServiceOrder } from "./lib/servicesContext";

export type View = "dashboard" | "employees" | "reports" | "inventory" | "services" | "sales" | "site-editor";
export type Role = "admin" | "gestor" | "funcionario";

export interface Employee {
  id: number;
  name: string;
  email: string;
  role: Role;
  status: "ativo" | "inativo";
  lastAccess: string;
}

export type AppSection = "public" | "login" | "internal" | "client-login" | "client-portal";

export default function App() {
  const [section, setSection] = useState<AppSection>("public");
  const [currentUser, setCurrentUser] = useState<{ name: string; role: Role } | null>(null);
  const [clientOrders, setClientOrders] = useState<ServiceOrder[]>([]);
  const [clientName, setClientName] = useState("");

  function handleEmployeeLogin(email: string) {
    const role: Role = email.includes("admin") ? "admin" : email.includes("gestor") ? "gestor" : "funcionario";
    setCurrentUser({ name: email.split("@")[0].replace(".", " "), role });
    setSection("internal");
  }

  function handleClientFound(orders: ServiceOrder[], name: string) {
    setClientOrders(orders);
    setClientName(name);
    setSection("client-portal");
  }

  if (section === "internal" && currentUser) {
    return (
      <InternalLayout
        currentUser={currentUser}
        onLogout={() => { setSection("public"); setCurrentUser(null); }}
      />
    );
  }

  if (section === "login") {
    return <LoginPage onLogin={handleEmployeeLogin} onBack={() => setSection("public")} />;
  }

  if (section === "client-login") {
    return <ClientLogin onFound={handleClientFound} onBack={() => setSection("public")} />;
  }

  if (section === "client-portal") {
    return (
      <ClientPortal
        orders={clientOrders}
        clientName={clientName}
        onBack={() => setSection("public")}
      />
    );
  }

  return (
    <PublicSite
      onGoInternal={() => setSection("login")}
      onGoClientArea={() => setSection("client-login")}
    />
  );
}
