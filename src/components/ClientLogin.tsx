import { useState } from "react";
import { Search } from "lucide-react";
import { useServices } from "../lib/servicesContext";
import type { ServiceOrder } from "../lib/servicesContext";
import EldoLogo from "./EldoLogo";

interface Props {
  onFound: (orders: ServiceOrder[], clientName: string) => void;
  onBack: () => void;
}

export default function ClientLogin({ onFound, onBack }: Props) {
  const { orders } = useServices();
  const [mode, setMode] = useState<"cnpj" | "code">("cnpj");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const query = value.trim().toUpperCase().replace(/\s/g, "");

      let found: ServiceOrder[] = [];

      if (mode === "cnpj") {
        found = orders.filter((o) => o.cnpj.replace(/\D/g, "") === query.replace(/\D/g, "") && o.cnpj !== "");
      } else {
        found = orders.filter((o) => o.code.toUpperCase() === query || o.saleCode.toUpperCase() === query);
      }

      if (!found.length) {
        setError(mode === "cnpj" ? "Nenhuma OS encontrada para este CNPJ." : "Código não encontrado. Verifique e tente novamente.");
        return;
      }

      onFound(found, found[0].client);
    }, 600);
  }

  const inp = "w-full h-[52px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[15px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors tracking-wider";

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
          <EldoLogo className="mb-10" imageClassName="w-[52px] h-[52px]" subtitle="ÁREA DO CLIENTE" />
          <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ELDO · ÁREA DO CLIENTE</p>
          <h1 className="text-[40px] text-[#f5f2ec] leading-[1.1] tracking-[-1px] mb-6" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Acompanhe<br />seu serviço<br />em tempo real
          </h1>
          <p className="text-[14px] text-[rgba(245,242,236,0.5)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Consulte o andamento das suas ordens de serviço sem precisar entrar em contato. Seus dados são buscados pelo CNPJ da empresa ou pelo código da OS/venda.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            { code: "OS-0089", client: "Metalúrgica Prata", status: "Em produção" },
            { code: "OS-0090", client: "Construmetal SP", status: "Em fila" },
          ].map((ex) => (
            <div key={ex.code} className="flex items-center justify-between px-4 py-3 border border-[rgba(245,242,236,0.07)]" style={{ background: "rgba(245,242,236,0.02)" }}>
              <div>
                <p className="text-[12px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{ex.code}</p>
                <p className="text-[13px] text-[rgba(245,242,236,0.7)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{ex.client}</p>
              </div>
              <span className="text-[11px] tracking-[1.5px] text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>{ex.status.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <button onClick={onBack} className="lg:hidden self-start mb-10 text-[rgba(245,242,236,0.4)] hover:text-[rgba(245,242,236,0.8)] transition-colors text-[11px] tracking-[2px]"
          style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          ← VOLTAR
        </button>

        <div className="w-full max-w-[420px]">
          <EldoLogo className="lg:hidden mb-10" imageClassName="w-[44px] h-[44px]" subtitle="ÁREA DO CLIENTE" />
          <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ÁREA DO CLIENTE</p>
          <h2 className="text-[32px] text-[#f5f2ec] tracking-[-0.5px] mb-2" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Consultar OS</h2>
          <p className="text-[14px] text-[rgba(245,242,236,0.45)] mb-10" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Nenhum cadastro necessário — busque pelo CNPJ ou código.
          </p>

          {/* Mode toggle */}
          <div className="flex mb-6 border border-[rgba(245,242,236,0.12)]">
            {(["cnpj", "code"] as const).map((m) => (
              <button key={m} onClick={() => { setMode(m); setValue(""); setError(""); }}
                className={`flex-1 py-2.5 text-[12px] tracking-[1.5px] transition-all ${mode === m ? "bg-[#e9b421] text-[#12100d]" : "text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.8)]"}`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                {m === "cnpj" ? "CNPJ DA EMPRESA" : "CÓDIGO OS / VENDA"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSearch} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)]"
                style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                {mode === "cnpj" ? "CNPJ" : "CÓDIGO DA OS OU VENDA"}
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => { setValue(e.target.value); setError(""); }}
                placeholder={mode === "cnpj" ? "00.000.000/0001-00" : "OS-0089 ou VD-0041"}
                className={inp}
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                autoFocus
              />
              {error && (
                <p className="text-[12px] text-red-400" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{error}</p>
              )}
            </div>

            <button type="submit" disabled={!value.trim() || loading}
              className="flex items-center justify-center gap-2 h-[52px] bg-[#e9b421] text-[#12100d] text-[14px] disabled:opacity-40 hover:opacity-90 transition-opacity mt-2"
              style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
              {loading ? (
                <span className="w-4 h-4 border-2 border-[#12100d] border-t-transparent rounded-full animate-spin" />
              ) : (
                <><Search size={16} /> Buscar ordens de serviço</>
              )}
            </button>
          </form>

          <div className="mt-10 border-t border-[rgba(245,242,236,0.08)] pt-8">
            <p className="text-[12px] text-[rgba(245,242,236,0.35)] leading-[1.8] text-center" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Para testes: CNPJ <strong className="text-[rgba(245,242,236,0.55)]">12.345.678/0001-90</strong><br />
              ou código <strong className="text-[rgba(245,242,236,0.55)]">OS-0089</strong> / <strong className="text-[rgba(245,242,236,0.55)]">VD-0041</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
