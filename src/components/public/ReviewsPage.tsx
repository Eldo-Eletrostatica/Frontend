import { useState } from "react";

const REVIEWS = [
  { name: "Daniel Alves",    text: "Excelente trabalho, pontuais e muito atenciosos. Recomendo demais! A pintura ficou muito boa e do jeito que foi pedido.", service: "Portão residencial" },
  { name: "Iuri Andre",      text: "Profissional extremamente qualificado. Analisou e sugeriu o melhor serviço para minhas máquinas — tinta preta eletrostática fosca, ficou idêntico ao de fábrica!", service: "Máquinas industriais" },
  { name: "Bruna Gama",      text: "A qualidade do serviço foi de primeira e o prazo combinado foi cumprido com eficiência. Recomendo para quem busca um serviço de confiança e alta qualidade!", service: "Grade perimetral" },
  { name: "Luciano Sousa",   text: "Uma empresa comprometida com qualidade e pontualidade, sem contar o atendimento bem-humorado e descontraído. Excelentes profissionais.", service: "Estrutura metálica" },
  { name: "Patrícia Melo",   text: "Levei um lote de 40 cadeiras metálicas para recuperação. Todas saíram com acabamento uniforme, sem escorrimento. Impecável.", service: "Mobiliário corporativo" },
  { name: "Rodrigo Faria",   text: "Serviço rápido e preço justo. Eles foram honestos sobre o que dava pra fazer e o resultado superou a expectativa.", service: "Rack industrial" },
];

const STAR = "★";

export default function ReviewsPage() {
  const [form, setForm] = useState({ rating: 5, name: "", service: "", text: "" });
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.text) return;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 4000);
    setForm({ rating: 5, name: "", service: "", text: "" });
  }

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-20">
      {/* Header */}
      <div className="border-b border-[rgba(245,242,236,0.12)] pb-10 mb-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[13px] tracking-[2.86px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>AVALIAÇÕES</p>
            <h1 className="text-[48px] text-[#f5f2ec] leading-[1.05] tracking-[-1.44px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>O que dizem<br />quem já contratou</h1>
          </div>
          <div className="flex items-end gap-4">
            <p className="text-[54px] text-[#e9b421] leading-none" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>5,0</p>
            <div>
              <p className="text-[22px] text-[#e9b421] tracking-[3px]">{STAR.repeat(5)}</p>
              <p className="text-[13px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Avaliações no Google</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(245,242,236,0.08)] mb-px">
        {REVIEWS.map((r, i) => (
          <div key={i} className="bg-[#12100d] p-8 flex flex-col">
            <p className="text-[#e9b421] text-[16px] tracking-[2px] mb-5">{STAR.repeat(5)}</p>
            <p className="flex-1 text-[15px] text-[rgba(245,242,236,0.85)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{`“${r.text}”`}</p>
            <div className="mt-6 pt-5 border-t border-[rgba(245,242,236,0.1)]">
              <p className="text-[15px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{r.name}</p>
              <p className="text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{r.service} · Avaliação no Google</p>
            </div>
          </div>
        ))}
      </div>

      {/* Leave review form */}
      <div className="mt-16 grid md:grid-cols-2 gap-px bg-[rgba(245,242,236,0.08)]">
        {/* Left col */}
        <div className="bg-[#12100d] p-10">
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SUA VEZ</p>
          <h2 className="text-[30px] text-[#f5f2ec] leading-[1.2] tracking-[-0.6px] mb-5" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Já foi atendido pela Eldo?</h2>
          <p className="text-[15px] text-[rgba(245,242,236,0.6)] leading-[1.7] mb-6" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Sua avaliação ajuda quem está decidindo onde pintar. Leva menos de um minuto.
          </p>
          <ul className="flex flex-col gap-3">
            {["Seu e-mail não aparece no site", "Avaliação publicada com seu nome", "Qualquer tipo de serviço conta"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[14px] text-[rgba(245,242,236,0.75)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M15 4.5L6.75 12.75L3 9" stroke="#E9B421" strokeWidth="1.875" strokeLinecap="square"/></svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-[#171511] p-10 flex flex-col gap-5 border-l border-[rgba(245,242,236,0.08)]">
          {/* Star rating */}
          <div>
            <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.5)] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SUA NOTA</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })}
                  className={`text-[28px] transition-colors ${n <= form.rating ? "text-[#e9b421]" : "text-[rgba(245,242,236,0.2)]"}`}>
                  {STAR}
                </button>
              ))}
            </div>
          </div>

          <Field label="NOME">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Como devemos publicar"
              className="w-full h-[46px] px-4 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors"
              style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          </Field>

          <Field label="SERVIÇO CONTRATADO">
            <input type="text" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}
              placeholder="Ex.: portão, máquina, estrutura"
              className="w-full h-[46px] px-4 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors"
              style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          </Field>

          <Field label="SUA AVALIAÇÃO">
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4}
              placeholder="Conte como foi o atendimento, o prazo e o resultado da pintura"
              className="w-full px-4 py-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors resize-none"
              style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          </Field>

          {submitted && (
            <p className="text-[13px] text-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Avaliação enviada! Obrigado pelo seu feedback.
            </p>
          )}

          <button type="submit" className="h-[52px] rounded-full bg-[#e9b421] text-[#12100d] text-[15px] hover:opacity-90 transition-opacity"
            style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            Enviar avaliação
          </button>
        </form>
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
