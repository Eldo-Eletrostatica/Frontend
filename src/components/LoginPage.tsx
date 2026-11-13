"use client";

import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { useVisualSettings } from "@/lib/siteSettings/VisualSettingsProvider";
import BrandLogo from "./BrandLogo";

const UNEXPECTED_ERROR_MESSAGE = "Não foi possível entrar. Tente novamente.";

interface Props {
  // Rejects with an ApiError whose message is shown, such as the 401 and 429 ones.
  onLogin: (email: string, password: string) => Promise<void>;
  onBack?: () => void;
}

export default function LoginPage({ onLogin, onBack }: Props) {
  const { visualSettings } = useVisualSettings();
  const brandName = (visualSettings.logo.text.trim() || "Eldo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setError("");
    setLoading(true);
    try {
      await onLogin(email, password);
    } catch (loginError) {
      setError(loginError instanceof ApiError ? loginError.message : UNEXPECTED_ERROR_MESSAGE);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-site-page">
      <div className="hidden lg:flex flex-col justify-between w-[420px] h-screen px-14 py-16 border-r border-site-text/8">
        <BrandLogo onClick={onBack} size={46} />
        <div>
          <p className="text-[13px] tracking-[2.86px] text-site-accent mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ÁREA RESTRITA</p>
          <p className="text-site-text text-[34px] leading-[1.2] tracking-[-0.68px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Gestão interna<br />{brandName}</p>
          <p className="mt-5 text-[15px] leading-[1.6] text-site-text/50" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Acesso exclusivo para funcionários autorizados. Em caso de problemas, contate o administrador do sistema.</p>
        </div>
        <p className="text-[12px] tracking-[1.5px] text-site-text/25" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>© {new Date().getFullYear()} {brandName.toUpperCase()} PINTURA ELETROSTÁTICA</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-site-text/45 hover:text-site-accent transition-colors mb-10 text-[13px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              <ArrowLeft size={14} /> Voltar ao site
            </button>
          )}
          <div className="lg:hidden mb-10"><BrandLogo onClick={onBack} size={46} /></div>
          <p className="text-[13px] tracking-[2.34px] text-site-text/50 mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ENTRAR NA ÁREA INTERNA</p>
          <h1 className="text-[32px] text-site-text leading-[1.2] tracking-[-0.64px] mb-10" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Bem-vindo de volta</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] tracking-[2.16px] text-site-text/55" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>E-MAIL</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@eldo.com.br"
                className="h-[50px] px-4 bg-site-card border border-site-text/18 text-site-text text-[15px] placeholder-site-text/30 outline-none transition-colors focus:border-site-accent"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] tracking-[2.16px] text-site-text/55" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SENHA</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-[50px] px-4 pr-12 bg-site-card border border-site-text/18 text-site-text text-[15px] placeholder-site-text/30 outline-none transition-colors focus:border-site-accent"
                  style={{ fontFamily: "'Barlow:Regular', sans-serif" }}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-site-text/40 hover:text-site-text/80 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-[13px] text-site-accent" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{error}</p>}
            <button type="submit" disabled={loading} className="mt-2 h-[56px] rounded-full bg-site-accent flex items-center justify-center gap-3 text-site-page text-[15px] tracking-[0.5px] transition-opacity hover:opacity-90 disabled:opacity-60" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
              {loading ? "Verificando..." : "Entrar"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="mt-8 text-[13px] text-site-text/40 text-center leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Esqueceu a senha? Contate o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
