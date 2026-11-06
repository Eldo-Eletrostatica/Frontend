import { useState } from "react";
import { ArrowRight } from "lucide-react";

export default function ContactPFPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", description: "", consent: false });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.description || !form.consent) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
    setForm({ name: "", phone: "", email: "", description: "", consent: false });
  }

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-20">
      <div className="border-b border-[rgba(245,242,236,0.12)] pb-10 mb-14">
        <p className="text-[13px] tracking-[2.86px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTATO · PESSOA FÍSICA</p>
        <h1 className="text-[48px] text-[#f5f2ec] leading-[1.05] tracking-[-1.44px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Peça seu orçamento<br />sem compromisso</h1>
      </div>

      <div className="grid md:grid-cols-2 gap-px bg-[rgba(245,242,236,0.08)]">
        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#12100d] p-10 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4">
            <Field label="NOME COMPLETO">
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Seu nome" className="inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </Field>
            <Field label="TELEFONE (WHATSAPP)">
              <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(00) 00000-0000" className="inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </Field>
          </div>

          <Field label="E-MAIL">
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="seu@email.com" className="inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          </Field>

          <Field label="DESCRIÇÃO DO QUE PRECISO">
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={5}
              placeholder="Que peça é, medidas aproximadas, quantidade e a cor que você quer. Se tiver foto, anexe depois pelo WhatsApp."
              className="w-full px-4 py-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors resize-none"
              style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            <p className="text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Quanto mais detalhe, mais preciso o orçamento.
            </p>
          </Field>

          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              className="mt-1 accent-[#e9b421]" />
            <span className="text-[13px] text-[rgba(245,242,236,0.6)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Autorizo o contato pelo WhatsApp informado e a guarda dos meus dados para fins de orçamento.
            </span>
          </label>

          {submitted && (
            <p className="text-[13px] text-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Pedido enviado! Em breve entraremos em contato pelo WhatsApp.
            </p>
          )}

          <button type="submit" className="h-[58px] rounded-full bg-[#e9b421] flex items-center justify-center gap-3 text-[#12100d] text-[16px] hover:opacity-90 transition-opacity"
            style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Enviar pedido de orçamento <ArrowRight size={18} />
          </button>
        </form>

        {/* Sidebar */}
        <div className="bg-[#171511] border-l border-[rgba(245,242,236,0.08)] flex flex-col divide-y divide-[rgba(245,242,236,0.08)]">
          <div className="p-10">
            <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PREFERE FALAR AGORA</p>
            <a href="https://wa.me/5500000000000" className="flex items-center gap-3 h-[54px] rounded-full px-6 bg-[#25d366] text-[#08210f] text-[15px] hover:opacity-90 transition-opacity" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
              <svg width="20" height="20" viewBox="0 0 21 21" fill="none"><path d="M10.5 1.75C5.67 1.75 1.75 5.67 1.75 10.5c0 1.6.42 3.1 1.15 4.4L1.75 19.25l4.45-1.14c1.27.69 2.73 1.09 4.3 1.09 4.83 0 8.75-3.92 8.75-8.75S15.33 1.75 10.5 1.75zm4.37 12.6c-.19.53-.94.96-1.47 1.08-.39.08-.9.15-2.61-.56-2.19-.9-3.6-3.14-3.71-3.28-.1-.14-.86-1.15-.86-2.19 0-1.04.54-1.55.73-1.76.2-.21.43-.27.57-.27h.42c.14 0 .33-.05.5.39.19.46.64 1.57.7 1.68.06.11.09.24.02.38-.07.14-.1.23-.21.35-.1.12-.22.27-.31.36-.1.1-.2.22-.09.43.12.21.53.87 1.13 1.41.78.7 1.44.91 1.64.99.21.08.33.07.45-.04.12-.12.52-.6.66-.81.14-.21.28-.17.47-.1.19.07 1.2.57 1.41.67.21.1.35.14.4.22.05.07.05.41-.14.93z" fill="#08210F"/></svg>
              Chamar no WhatsApp
            </a>
          </div>

          <div className="p-10">
            <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>RESPOSTA MÉDIA</p>
            <p className="text-[36px] text-[#e9b421] leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>02 h</p>
            <p className="text-[13px] text-[rgba(245,242,236,0.5)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Respondemos em até 2 horas no horário comercial.</p>
          </div>

          <div className="p-10">
            <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ATENDIMENTO</p>
            <div className="flex flex-col gap-2 text-[14px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              {[["Segunda a sexta", "07h – 17h"], ["Sábado", "07h – 12h"], ["Domingo", "Fechado"]].map(([d, h]) => (
                <div key={d} className="flex justify-between">
                  <span className="text-[rgba(245,242,236,0.65)]">{d}</span>
                  <span className={h === "Fechado" ? "text-[rgba(245,242,236,0.35)]" : "text-[#f5f2ec]"}>{h}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-10">
            <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>ONDE ESTAMOS</p>
            <p className="text-[14px] text-[rgba(245,242,236,0.7)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Rua dos Metalúrgicos, 850<br />Distrito Industrial · São Paulo
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}

// tailwind inline style for shared input — injected via style tag
const _style = `
.inp { width: 100%; height: 46px; padding: 0 14px; background: #171511; border: 1px solid rgba(245,242,236,0.18); color: #f5f2ec; font-size: 14px; outline: none; transition: border-color .15s; }
.inp:focus { border-color: #e9b421; }
.inp::placeholder { color: rgba(245,242,236,0.3); }
`;
if (typeof document !== "undefined" && !document.getElementById("inp-style")) {
  const s = document.createElement("style");
  s.id = "inp-style";
  s.textContent = _style;
  document.head.appendChild(s);
}
