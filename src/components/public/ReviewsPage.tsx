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
      <div className="border-b border-site-text/12 pb-10 mb-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <p className="text-[13px] tracking-[2.86px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>AVALIAÇÕES</p>
            <h1 className="text-[48px] text-site-text leading-[1.05] tracking-[-1.44px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>O que dizem<br />quem já contratou</h1>
          </div>
          <div className="flex items-end gap-4">
            <p className="text-[54px] text-site-accent leading-none" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>5,0</p>
            <div>
              <p className="text-[22px] text-site-accent tracking-[3px]">{STAR.repeat(5)}</p>
              <p className="text-[13px] text-site-text/50" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Avaliações no Google</p>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-site-text/8 mb-px">
        {REVIEWS.map((r, i) => (
          <div key={i} className="bg-site-page p-8 flex flex-col">
            <p className="text-site-accent text-[16px] tracking-[2px] mb-5">{STAR.repeat(5)}</p>
            <p className="flex-1 text-[15px] text-site-text/85 leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{`“${r.text}”`}</p>
            <div className="mt-6 pt-5 border-t border-site-text/10">
              <p className="text-[15px] text-site-text" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{r.name}</p>
              <p className="text-[12px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{r.service} · Avaliação no Google</p>
            </div>
          </div>
        ))}
      </div>

      {/* Leave review form */}
      <div className="mt-16 grid md:grid-cols-2 gap-px bg-site-text/8">
        {/* Left col */}
        <div className="bg-site-page p-10">
          <p className="text-[12px] tracking-[2.5px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SUA VEZ</p>
          <h2 className="text-[30px] text-site-text leading-[1.2] tracking-[-0.6px] mb-5" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Já foi atendido pela Eldo?</h2>
          <p className="text-[15px] text-site-text/60 leading-[1.7] mb-6" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Sua avaliação ajuda quem está decidindo onde pintar. Leva menos de um minuto.
          </p>
          <ul className="flex flex-col gap-3">
            {["Seu e-mail não aparece no site", "Avaliação publicada com seu nome", "Qualquer tipo de serviço conta"].map((item) => (
              <li key={item} className="flex items-center gap-3 text-[14px] text-site-text/75" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><path d="M15 4.5L6.75 12.75L3 9" stroke="var(--site-accent)" strokeWidth="1.875" strokeLinecap="square"/></svg>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-site-card p-10 flex flex-col gap-5 border-l border-site-text/8">
          {/* Star rating */}
          <div>
            <p className="text-[11px] tracking-[2px] text-site-text/50 mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SUA NOTA</p>
            <div className="flex gap-1">
              {[1,2,3,4,5].map((n) => (
                <button type="button" key={n} onClick={() => setForm({ ...form, rating: n })}
                  className={`text-[28px] transition-colors ${n <= form.rating ? "text-site-accent" : "text-site-text/20"}`}>
                  {STAR}
                </button>
              ))}
            </div>
          </div>

          <Field label="NOME">
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Como devemos publicar"
              className="w-full h-[46px] px-4 bg-site-page border border-site-text/18 text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent transition-colors"
              style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          </Field>

          <Field label="SERVIÇO CONTRATADO">
            <input type="text" value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}
              placeholder="Ex.: portão, máquina, estrutura"
              className="w-full h-[46px] px-4 bg-site-page border border-site-text/18 text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent transition-colors"
              style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          </Field>

          <Field label="SUA AVALIAÇÃO">
            <textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} rows={4}
              placeholder="Conte como foi o atendimento, o prazo e o resultado da pintura"
              className="w-full px-4 py-3 bg-site-page border border-site-text/18 text-site-text text-[14px] placeholder-site-text/30 outline-none focus:border-site-accent transition-colors resize-none"
              style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
          </Field>

          {submitted && (
            <p className="text-[13px] text-site-accent" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
              Avaliação enviada! Obrigado pelo seu feedback.
            </p>
          )}

          <button type="submit" className="h-[52px] rounded-full bg-site-accent text-site-page text-[15px] hover:opacity-90 transition-opacity"
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
      <label className="text-[11px] tracking-[2px] text-site-text/50" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}
