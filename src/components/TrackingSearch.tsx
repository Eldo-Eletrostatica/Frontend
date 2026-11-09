"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { sendApiRequest } from "@/lib/api/client";
import { ApiError } from "@/lib/api/ApiError";
import {
  SERVICE_ORDER_STATUS_DESCRIPTIONS,
  SERVICE_ORDER_STATUS_LABELS,
  SERVICE_ORDER_STEPS,
  type ServiceOrderProgress,
  type ServiceOrderTracking,
  type TrackingLookup,
} from "./tracking/types";
import EldoLogo from "./EldoLogo";

interface Props {
  onFound: (lookup: TrackingLookup) => void;
  onBack: () => void;
}

type SearchMode = "cnpj" | "trackingCode";

const FALLBACK_ERROR = "Não foi possível consultar agora. Tente novamente.";
const NO_OPEN_SERVICE_ORDERS = "Nenhuma OS em andamento para este CNPJ.";

// The tracking code alphabet has only capital letters and digits, excluding 0, O, 1, and I (ADR 0001).
const TRACKING_CODE_PATTERN = /^[2-9A-HJ-NP-Z]{8}$/;

function normalizeTrackingCode(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

function toErrorMessage(error: unknown, mode: SearchMode): string {
  if (!(error instanceof ApiError)) return FALLBACK_ERROR;
  if (error.status === 404 || error.message.toLowerCase().includes("not found")) {
    return mode === "trackingCode" ? "Nenhuma ordem de serviço encontrada para este protocolo." : NO_OPEN_SERVICE_ORDERS;
  }
  return error.message;
}

async function findTracking(mode: SearchMode, value: string): Promise<TrackingLookup | null> {
  if (mode === "trackingCode") {
    const trackingCode = normalizeTrackingCode(value);
    const serviceOrder = await sendApiRequest<ServiceOrderTracking>(`/service-orders/tracking/${encodeURIComponent(trackingCode)}`);
    return { kind: "trackingCode", serviceOrder };
  }
  const cnpjDigits = value.replace(/\D/g, "");
  const serviceOrders = await sendApiRequest<ServiceOrderProgress[]>(`/service-orders/tracking?cnpj=${encodeURIComponent(cnpjDigits)}`);
  return serviceOrders.length > 0 ? { kind: "cnpj", cnpj: cnpjDigits, serviceOrders } : null;
}

export default function TrackingSearch({ onFound, onBack }: Props) {
  const [mode, setMode] = useState<SearchMode>("cnpj");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (mode === "cnpj") {
      const cnpjDigits = value.replace(/\D/g, "");
      if (cnpjDigits.length !== 14) {
        setError("O CNPJ precisa ter 14 dígitos.");
        return;
      }
    } else {
      const trackingCode = normalizeTrackingCode(value);
      if (trackingCode.length !== 8) {
        setError("O protocolo precisa ter exatamente 8 caracteres.");
        return;
      }
      if (/[01OI]/.test(trackingCode)) {
        setError("O protocolo não contém os dígitos 0 e 1 nem as letras O e I.");
        return;
      }
      if (!TRACKING_CODE_PATTERN.test(trackingCode)) {
        setError("O protocolo contém caracteres inválidos.");
        return;
      }
    }

    setIsLoading(true);
    try {
      const lookup = await findTracking(mode, value);
      if (lookup) onFound(lookup);
      else setError(NO_OPEN_SERVICE_ORDERS);
    } catch (searchError) {
      setError(toErrorMessage(searchError, mode));
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "w-full h-[52px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[15px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors tracking-wider";

  return (
    <div className="min-h-screen flex" style={{ background: "#12100d" }}>
      {/* Brand panel */}
      <div className="hidden lg:flex w-[480px] flex-col justify-between p-14 border-r border-[rgba(245,242,236,0.08)]"
        style={{ background: "linear-gradient(160deg, #171511 0%, #12100d 100%)" }}>
        <button onClick={onBack} className="flex items-center gap-2 text-[rgba(245,242,236,0.4)] hover:text-[rgba(245,242,236,0.8)] transition-colors text-[12px] tracking-[2px] w-fit"
          style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          ← VOLTAR AO SITE
        </button>

        <div>
          <EldoLogo className="mb-10" imageClassName="w-[52px] h-[52px]" subtitle="ACOMPANHAR SERVIÇO" />
          <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ELDO · ACOMPANHAR SERVIÇO</p>
          <h1 className="text-[40px] text-[#f5f2ec] leading-[1.1] tracking-[-1px] mb-6" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Acompanhe<br />seu serviço<br />em tempo real
          </h1>
          <p className="text-[14px] text-[rgba(245,242,236,0.5)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Consulte o andamento das suas ordens de serviço sem precisar entrar em contato. Busque pelo CNPJ da empresa ou pelo protocolo que você recebeu quando a venda foi lançada.
          </p>
        </div>

        <ol className="flex flex-col gap-3">
          {SERVICE_ORDER_STEPS.map((status, index) => (
            <li key={status} className="flex items-center gap-4 px-4 py-3 border border-[rgba(245,242,236,0.07)]" style={{ background: "rgba(245,242,236,0.02)" }}>
              <span className="text-[12px] text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>{index + 1}</span>
              <div>
                <p className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.7)]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>{SERVICE_ORDER_STATUS_LABELS[status].toUpperCase()}</p>
                <p className="text-[12px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{SERVICE_ORDER_STATUS_DESCRIPTIONS[status]}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <button onClick={onBack} className="lg:hidden self-start mb-10 text-[rgba(245,242,236,0.4)] hover:text-[rgba(245,242,236,0.8)] transition-colors text-[11px] tracking-[2px]"
          style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          ← VOLTAR
        </button>

        <div className="w-full max-w-[420px]">
          <EldoLogo className="lg:hidden mb-10" imageClassName="w-[44px] h-[44px]" subtitle="ACOMPANHAR SERVIÇO" />
          <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ACOMPANHAR SERVIÇO</p>
          <h2 className="text-[32px] text-[#f5f2ec] tracking-[-0.5px] mb-2" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Consultar OS</h2>
          <p className="text-[14px] text-[rgba(245,242,236,0.45)] mb-10" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Nenhum cadastro necessário: busque pelo CNPJ ou pelo protocolo.
          </p>

          {/* Mode toggle */}
          <div className="flex mb-6 border border-[rgba(245,242,236,0.12)]">
            {(["cnpj", "trackingCode"] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setMode(m); setValue(""); setError(""); }}
                className={`flex-1 py-2.5 text-[12px] tracking-[1.5px] transition-all ${mode === m ? "bg-[#e9b421] text-[#12100d]" : "text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.8)]"}`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                {m === "cnpj" ? "CNPJ DA EMPRESA" : "PROTOCOLO"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)]"
                style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                {mode === "cnpj" ? "CNPJ" : "PROTOCOLO DA OS"}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                placeholder={mode === "cnpj" ? "00.000.000/0001-00" : "8 caracteres, ex.: ABCD2345"}
                maxLength={mode === "cnpj" ? 18 : 8}
                className={inputClass}
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                autoFocus
              />
              {error && (
                <p className="text-[12px] text-red-400" role="alert" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{error}</p>
              )}
            </div>

            <button type="submit" disabled={!value.trim() || isLoading}
              className="flex items-center justify-center gap-2 h-[52px] bg-[#e9b421] text-[#12100d] text-[14px] disabled:opacity-40 hover:opacity-90 transition-opacity mt-2"
              style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
              {isLoading ? (
                <span className="w-4 h-4 border-2 border-[#12100d] border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Search size={16} /> Buscar ordens de serviço</>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
