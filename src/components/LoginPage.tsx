import { useState } from "react";
import { Eye, EyeOff, ArrowRight, ArrowLeft } from "lucide-react";
import EldoLogo from "./EldoLogo";

interface Props {
  onLogin: (email: string, password: string) => void;
  onBack?: () => void;
}

export default function LoginPage({ onLogin, onBack }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) { setError("Preencha e-mail e senha."); return; }
    setError("");
    setLoading(true);
    setTimeout(() => { setLoading(false); onLogin(email, password); }, 600);
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "#12100d" }}>
      <div className="hidden lg:flex flex-col justify-between w-[420px] h-screen px-14 py-16 border-r border-[rgba(245,242,236,0.08)]">
        <EldoLogo onClick={onBack} imageClassName="w-[46px] h-[46px]" />
        <div>
          <p className="text-[13px] tracking-[2.86px] text-[#e9b421] mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ÁREA RESTRITA</p>
          <p className="text-[#f5f2ec] text-[34px] leading-[1.2] tracking-[-0.68px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Gestão interna<br />Eldo</p>
          <p className="mt-5 text-[15px] leading-[1.6] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Acesso exclusivo para funcionários autorizados. Em caso de problemas, contate o administrador do sistema.</p>
        </div>
        <p className="text-[12px] tracking-[1.5px] text-[rgba(245,242,236,0.25)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>© 2025 ELDO PINTURA ELETROSTÁTICA</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-[420px]">
          {onBack && (
            <button onClick={onBack} className="flex items-center gap-2 text-[rgba(245,242,236,0.45)] hover:text-[#e9b421] transition-colors mb-10 text-[13px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              <ArrowLeft size={14} /> Voltar ao site
            </button>
          )}
          <div className="lg:hidden mb-10"><EldoLogo onClick={onBack} imageClassName="w-[46px] h-[46px]" /></div>
          <p className="text-[13px] tracking-[2.34px] text-[rgba(245,242,236,0.5)] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ENTRAR NA ÁREA INTERNA</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px] mb-10" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Bem-vindo de volta</h1>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[12px] tracking-[2.16px] text-[rgba(245,242,236,0.55)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>E-MAIL</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@eldo.com.br"
                className="h-[50px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[15px] placeholder-[rgba(245,242,236,0.3)] outline-none transition-colors focus:border-[#e9b421]"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[12px] tracking-[2.16px] text-[rgba(245,242,236,0.55)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SENHA</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                  className="w-full h-[50px] px-4 pr-12 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[15px] placeholder-[rgba(245,242,236,0.3)] outline-none transition-colors focus:border-[#e9b421]"
                  style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(245,242,236,0.4)] hover:text-[rgba(245,242,236,0.8)] transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <p className="text-[13px] text-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{error}</p>}
            <button type="submit" disabled={loading} className="mt-2 h-[56px] rounded-full bg-[#e9b421] flex items-center justify-center gap-3 text-[#12100d] text-[15px] tracking-[0.5px] transition-opacity hover:opacity-90 disabled:opacity-60" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
              {loading ? "Verificando..." : "Entrar"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
          <p className="mt-8 text-[13px] text-[rgba(245,242,236,0.4)] text-center leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Esqueceu a senha? Contate o administrador.<br />
            <span className="opacity-60">Use admin@, gestor@ ou funcionario@ para testar</span>
          </p>
        </div>
      </div>
    </div>
  );
}
