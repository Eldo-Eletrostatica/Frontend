import { createContext, useContext, useState, type ReactNode } from "react";

export type ServiceStatus = "fila" | "producao" | "finalizacao" | "concluido";

export interface ServiceOrder {
  id: number;
  code: string;
  client: string;
  cnpj: string;
  scope: string;
  deadline: string;
  createdAt: string;
  status: ServiceStatus;
  responsible: string;
  notes: string;
  saleCode: string;
}

interface ServicesCtx {
  orders: ServiceOrder[];
  addOrder: (data: Omit<ServiceOrder, "id" | "code">) => ServiceOrder;
  updateStatus: (id: number, status: ServiceStatus) => void;
}

export const STATUS_CONFIG: Record<ServiceStatus, { label: string; step: number }> = {
  fila:        { label: "Em fila",     step: 0 },
  producao:    { label: "Em produção", step: 1 },
  finalizacao: { label: "Finalização", step: 2 },
  concluido:   { label: "Concluído",   step: 3 },
};

const DEFAULT_ORDERS: ServiceOrder[] = [
  { id: 1, code: "OS-0089", client: "Metalúrgica Prata Ltda", cnpj: "12.345.678/0001-90", scope: "12 grades industriais — epóxi RAL 9005", deadline: "2025-09-18", createdAt: "2025-09-08", status: "producao", responsible: "Ricardo M.", notes: "", saleCode: "VD-0041" },
  { id: 2, code: "OS-0090", client: "Construmetal SP",        cnpj: "23.456.789/0001-01", scope: "Estrutura cobertura 180m² — poliéster RAL 7016", deadline: "2025-09-20", createdAt: "2025-09-09", status: "fila", responsible: "Carlos A.", notes: "Cliente quer entrega em palete", saleCode: "VD-0042" },
  { id: 3, code: "OS-0091", client: "João Pedro Silva",       cnpj: "",                   scope: "Portão residencial duplo — preto brilhante", deadline: "2025-09-15", createdAt: "2025-09-10", status: "finalizacao", responsible: "Ricardo M.", notes: "", saleCode: "VD-0043" },
  { id: 4, code: "OS-0088", client: "Agropecuária Horizonte", cnpj: "45.678.901/0001-23", scope: "Chassi colheitadeira — verde RAL 6018", deadline: "2025-09-12", createdAt: "2025-09-05", status: "concluido", responsible: "Carlos A.", notes: "Aprovado em inspeção", saleCode: "VD-0044" },
  { id: 5, code: "OS-0092", client: "Datacenter Nuvem S.A.", cnpj: "56.789.012/0001-34", scope: "24 racks condutivos — cinza RAL 7035", deadline: "2025-09-25", createdAt: "2025-09-11", status: "fila", responsible: "Thiago P.", notes: "Exige certificado de resistividade", saleCode: "VD-0045" },
];

const Ctx = createContext<ServicesCtx>({
  orders: DEFAULT_ORDERS,
  addOrder: () => DEFAULT_ORDERS[0],
  updateStatus: () => {},
});

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<ServiceOrder[]>(DEFAULT_ORDERS);

  function addOrder(data: Omit<ServiceOrder, "id" | "code">): ServiceOrder {
    const id = Date.now();
    const code = `OS-${String(id).slice(-4)}`;
    const order: ServiceOrder = { id, code, ...data };
    setOrders((prev) => [order, ...prev]);
    return order;
  }

  function updateStatus(id: number, status: ServiceStatus) {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
  }

  return <Ctx.Provider value={{ orders, addOrder, updateStatus }}>{children}</Ctx.Provider>;
}

export function useServices() {
  return useContext(Ctx);
}
