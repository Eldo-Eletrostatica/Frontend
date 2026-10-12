import { createContext, useContext, useState, type ReactNode } from "react";

export interface ServiceRule {
  id: number;
  name: string;
  pricePerM2: number;
  active: boolean;
}

export interface MaterialRule {
  id: number;
  name: string;
  multiplier: number;
  active: boolean;
}

export interface PricingConfig {
  serviceRules: ServiceRule[];
  materialRules: MaterialRule[];
  minArea: number;
  disclaimer: string;
}

interface PricingCtx {
  config: PricingConfig;
  setConfig: (c: PricingConfig) => void;
}

const DEFAULT: PricingConfig = {
  serviceRules: [
    { id: 1, name: "Pintura epóxi fosco",         pricePerM2: 42, active: true  },
    { id: 2, name: "Pintura epóxi brilhante",      pricePerM2: 45, active: true  },
    { id: 3, name: "Pintura poliéster fosco",       pricePerM2: 38, active: true  },
    { id: 4, name: "Pintura poliéster brilhante",   pricePerM2: 40, active: true  },
    { id: 5, name: "Pintura termorrígida",           pricePerM2: 55, active: true  },
    { id: 6, name: "Pintura condutiva/antiestática", pricePerM2: 72, active: false },
  ],
  materialRules: [
    { id: 1, name: "Aço carbono",      multiplier: 1.00, active: true  },
    { id: 2, name: "Ferro forjado",    multiplier: 1.05, active: true  },
    { id: 3, name: "Aço galvanizado",  multiplier: 1.08, active: true  },
    { id: 4, name: "Aço inox",         multiplier: 1.15, active: true  },
    { id: 5, name: "Alumínio",         multiplier: 1.20, active: true  },
    { id: 6, name: "Cobre/latão",      multiplier: 1.35, active: false },
  ],
  minArea: 0.5,
  disclaimer: "Estimativa automática com base na tabela de preços vigente. O valor final pode variar após inspeção da peça.",
};

const Ctx = createContext<PricingCtx>({ config: DEFAULT, setConfig: () => {} });

export function PricingProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<PricingConfig>(DEFAULT);
  return <Ctx.Provider value={{ config, setConfig }}>{children}</Ctx.Provider>;
}

export function usePricing() {
  return useContext(Ctx);
}

export function calcEstimate(
  config: PricingConfig,
  serviceName: string,
  materialName: string,
  area: number,
  qty: number
): number {
  const svc = config.serviceRules.find((r) => r.name === serviceName && r.active);
  const mat = config.materialRules.find((r) => r.name === materialName && r.active);
  const base = svc?.pricePerM2 ?? 42;
  const mult = mat?.multiplier ?? 1.0;
  return Math.round(base * mult * area * qty);
}
