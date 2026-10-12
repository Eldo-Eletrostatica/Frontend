import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X, Star } from "lucide-react";
import logoImg from "@/imports/image.png";
import { useSiteContent, type LandingProjectContent } from "../../lib/siteContentContext";

const REVIEWS = [
  { name: "Daniel Alves",  text: "Excelente trabalho, pontuais e muito atenciosos. Recomendo demais! A pintura ficou muito boa e do jeito que foi pedido.", service: "Portão residencial" },
  { name: "Iuri Andre",    text: "Profissional extremamente qualificado. Analisou e sugeriu o melhor serviço para minhas máquinas — ficou idêntico ao de fábrica!", service: "Máquinas industriais" },
  { name: "Bruna Gama",    text: "A qualidade do serviço foi de primeira e o prazo combinado foi cumprido com eficiência. Recomendo para quem busca confiança e alta qualidade!", service: "Grade perimetral" },
  { name: "Luciano Sousa", text: "Uma empresa comprometida com qualidade e pontualidade, sem contar o atendimento bem-humorado e descontraído. Excelentes profissionais.", service: "Estrutura metálica" },
  { name: "Patrícia Melo", text: "Levei 40 cadeiras metálicas para recuperação. Todas saíram com acabamento uniforme, sem escorrimento. Impecável.", service: "Mobiliário corporativo" },
  { name: "Rodrigo Faria", text: "Serviço rápido e preço justo. Foram honestos sobre o que dava pra fazer e o resultado superou a expectativa.", service: "Rack industrial" },
];

/* ─── Component ─────────────────────────────────────────────────────────────── */

interface Props {
  onGoQuote: () => void;
}

export default function LandingPage({ onGoQuote }: Props) {
  const { content } = useSiteContent();
  const [catFilter, setCatFilter] = useState("Todos");
  const [detail, setDetail] = useState<(LandingProjectContent & { category: string }) | null>(null);
  const [afterView, setAfterView] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 5, name: "", service: "", text: "" });
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const [contactForm, setContactForm] = useState({ name: "", phone: "", email: "", description: "", consent: false });
  const [contactSubmitted, setContactSubmitted] = useState(false);

  const projects = content.landing.projects.map((project) => ({
    ...project,
    category: content.landing.categories.find((category) => category.id === project.categoryId)?.title ?? "Sem categoria",
  }));
  const visibleProjects = catFilter === "Todos"
    ? projects
    : projects.filter((p) => p.category === catFilter);

  function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!reviewForm.name || !reviewForm.text) return;
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
    setReviewForm({ rating: 5, name: "", service: "", text: "" });
  }

  function submitContact(e: React.FormEvent) {
    e.preventDefault();
    if (!contactForm.name || !contactForm.phone || !contactForm.description || !contactForm.consent) return;
    setContactSubmitted(true);
    setTimeout(() => setContactSubmitted(false), 5000);
    setContactForm({ name: "", phone: "", email: "", description: "", consent: false });
  }

  const inp = "w-full h-[46px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] transition-colors";

  return (
    <div>
      {/* ─── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, #1a1713 0%, #12100d 55%, #0f0d0b 100%)" }}>
        {/* Background texture lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, #f5f2ec 0px, #f5f2ec 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, #f5f2ec 0px, #f5f2ec 1px, transparent 1px, transparent 60px)" }} />

        <div className="relative max-w-[1240px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-6" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                {content.landing.heroEyebrow}
              </p>
              <h1 className="text-[48px] md:text-[60px] text-[#f5f2ec] leading-[1.0] tracking-[-1.5px] mb-6" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                {content.landing.heroTitle}<br /><span className="text-[#e9b421]">{content.landing.heroAccent}</span>
              </h1>
              <p className="text-[16px] text-[rgba(245,242,236,0.6)] leading-[1.8] mb-10 max-w-[460px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                {content.landing.heroDescription}
              </p>
              <div className="flex flex-wrap gap-3">
                <button onClick={onGoQuote}
                  className="flex items-center gap-2 h-[52px] px-8 rounded-full bg-[#e9b421] text-[#12100d] text-[14px] hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                  Solicitar Orçamento <ArrowRight size={16} />
                </button>
                <a href="#contato"
                  className="flex items-center h-[52px] px-8 border border-[rgba(245,242,236,0.2)] text-[rgba(245,242,236,0.8)] text-[14px] hover:border-[rgba(245,242,236,0.5)] transition-colors"
                  style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                  Falar com a equipe
                </a>
              </div>
            </div>

            {/* Logo display */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="relative">
                <div className="w-[220px] h-[220px] md:w-[280px] md:h-[280px] flex items-center justify-center"
                  style={{ background: "rgba(233,180,33,0.06)", border: "1px solid rgba(233,180,33,0.15)" }}>
                  <img
                    src={content.landing.heroImage || logoImg.src}
                    alt={content.landing.heroImage ? "Destaque da Eldo Pintura Eletrostática" : "Eldo Pintura Eletrostática — logotipo"}
                    className="w-[70%] h-[70%] object-contain"
                    style={content.landing.heroImage ? undefined : { filter: "invert(1)", mixBlendMode: "screen" }}
                  />
                </div>
                {/* Decorative accent line */}
                <div className="absolute -bottom-4 -right-4 w-full h-full border border-[rgba(233,180,33,0.12)]" style={{ zIndex: -1 }} />
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(245,242,236,0.06)] mt-16">
            {[
              { n: "+15 anos", label: "de experiência" },
              { n: "+8.000", label: "peças por ano" },
              { n: "5,0 ★", label: "no Google" },
              { n: "100%", label: "eletrostática a pó" },
            ].map((s) => (
              <div key={s.label} className="px-6 py-5" style={{ background: "rgba(18,16,13,0.7)" }}>
                <p className="text-[22px] text-[#e9b421] leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{s.n}</p>
                <p className="text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PORTFÓLIO ─────────────────────────────────────────────────────── */}
      <section id="portfolio" className="max-w-[1240px] mx-auto px-6 pt-20 pb-16">
        <div className="border-b border-[rgba(245,242,236,0.12)] pb-10 mb-10">
          <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PORTFÓLIO</p>
          <h2 className="text-[40px] text-[#f5f2ec] leading-[1.05] tracking-[-1px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
            {content.landing.portfolioTitle}
          </h2>
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap gap-2 mb-8">
          {["Todos", ...content.landing.categories.map((category) => category.title)].map((category) => (
            <button key={category} onClick={() => setCatFilter(category)}
              className={`px-4 py-1.5 text-[11px] tracking-[1.5px] transition-all ${catFilter === category ? "bg-[#e9b421] text-[#12100d]" : "border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.55)] hover:border-[rgba(245,242,236,0.35)]"}`}
              style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
              {category === "Todos" ? "TODOS OS PROJETOS" : category.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(245,242,236,0.08)]">
          {visibleProjects.map((p) => (
            <button key={p.id} onClick={() => { setDetail(p); setAfterView(false); }}
              className="relative group overflow-hidden text-left"
              style={{ background: "#171511" }}>
              <div className="relative h-[220px] overflow-hidden">
                <img src={p.afterImg} alt={p.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,16,13,0.85)] to-transparent" />
                <span className="absolute top-3 left-3 text-[10px] tracking-[2px] px-2 py-1 bg-[rgba(18,16,13,0.7)] text-[rgba(245,242,236,0.7)]"
                  style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                  {p.category.toUpperCase()}
                </span>
              </div>
              <div className="px-5 py-4">
                <p className="text-[15px] text-[#f5f2ec] mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{p.title}</p>
                <p className="text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{p.material} · {p.deadline}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ─── AVALIAÇÕES ────────────────────────────────────────────────────── */}
      <section id="avaliacoes" style={{ background: "#0f0d0b" }} className="py-20">
        <div className="max-w-[1240px] mx-auto px-6">
          <div className="border-b border-[rgba(245,242,236,0.1)] pb-10 mb-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>AVALIAÇÕES</p>
                <h2 className="text-[40px] text-[#f5f2ec] leading-[1.05] tracking-[-1px] max-w-[560px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{content.landing.reviewsTitle}</h2>
              </div>
              <div className="flex items-end gap-4 flex-shrink-0">
                <p className="text-[52px] text-[#e9b421] leading-none" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>5,0</p>
                <div>
                  <p className="text-[20px] text-[#e9b421] tracking-[4px]">★★★★★</p>
                  <p className="text-[12px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Avaliações no Google</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(245,242,236,0.07)] mb-px">
            {REVIEWS.map((r, i) => (
              <div key={i} className="p-7 flex flex-col" style={{ background: "#12100d" }}>
                <p className="text-[#e9b421] text-[15px] tracking-[2px] mb-4">★★★★★</p>
                <p className="flex-1 text-[14px] text-[rgba(245,242,236,0.8)] leading-[1.75]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{`“${r.text}”`}</p>
                <div className="mt-5 pt-4 border-t border-[rgba(245,242,236,0.1)]">
                  <p className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{r.name}</p>
                  <p className="text-[11px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{r.service} · Google</p>
                </div>
              </div>
            ))}
          </div>

          {/* Review form */}
          <div className="mt-12 grid md:grid-cols-2 gap-px bg-[rgba(245,242,236,0.07)]">
            <div className="p-8 md:p-10" style={{ background: "#12100d" }}>
              <p className="text-[11px] tracking-[2.5px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SUA VEZ</p>
              <h3 className="text-[26px] text-[#f5f2ec] leading-[1.2] tracking-[-0.5px] mb-4" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Já foi atendido pela Eldo?</h3>
              <p className="text-[14px] text-[rgba(245,242,236,0.55)] leading-[1.7] mb-6" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Sua avaliação ajuda quem está decidindo onde pintar. Leva menos de um minuto.
              </p>
              {["Seu e-mail não aparece no site", "Avaliação publicada com seu nome", "Qualquer tipo de serviço conta"].map((item) => (
                <div key={item} className="flex items-center gap-3 mb-3 text-[13px] text-[rgba(245,242,236,0.7)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                  <svg width="14" height="14" viewBox="0 0 18 18" fill="none"><path d="M15 4.5L6.75 12.75L3 9" stroke="#E9B421" strokeWidth="2" strokeLinecap="square"/></svg>
                  {item}
                </div>
              ))}
            </div>

            <form onSubmit={submitReview} className="p-8 md:p-10 flex flex-col gap-4 border-l border-[rgba(245,242,236,0.07)]" style={{ background: "#171511" }}>
              <div>
                <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>SUA NOTA</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map((s) => (
                    <button key={s} type="button" onClick={() => setReviewForm({ ...reviewForm, rating: s })}>
                      <Star size={22} className={s <= reviewForm.rating ? "text-[#e9b421] fill-[#e9b421]" : "text-[rgba(245,242,236,0.2)]"} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <LF label="NOME"><input type="text" value={reviewForm.name} onChange={(e) => setReviewForm({ ...reviewForm, name: e.target.value })} placeholder="Seu nome" className={inp} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></LF>
                <LF label="SERVIÇO"><input type="text" value={reviewForm.service} onChange={(e) => setReviewForm({ ...reviewForm, service: e.target.value })} placeholder="Ex: Portão" className={inp} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} /></LF>
              </div>
              <LF label="SUA AVALIAÇÃO">
                <textarea value={reviewForm.text} onChange={(e) => setReviewForm({ ...reviewForm, text: e.target.value })} rows={3}
                  placeholder="Conte como foi sua experiência..."
                  className="w-full px-4 py-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] resize-none transition-colors"
                  style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </LF>
              {reviewSubmitted ? (
                <div className="h-[48px] flex items-center justify-center bg-[rgba(52,211,153,0.1)] border border-emerald-500 text-emerald-400 text-[13px]"
                  style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                  ✓ Avaliação enviada — obrigado!
                </div>
              ) : (
                <button type="submit" className="h-[48px] bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 transition-opacity mt-1"
                  style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
                  Enviar avaliação
                </button>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* ─── CONTATO PF ────────────────────────────────────────────────────── */}
      <section id="contato" className="max-w-[1240px] mx-auto px-6 pt-20 pb-24">
        <div className="border-b border-[rgba(245,242,236,0.12)] pb-10 mb-12">
          <p className="text-[11px] tracking-[3px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTATO · PESSOA FÍSICA</p>
          <h2 className="text-[40px] text-[#f5f2ec] leading-[1.05] tracking-[-1px] max-w-[680px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{content.landing.contactTitle}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-[rgba(245,242,236,0.08)]">
          <form onSubmit={submitContact} className="p-8 md:p-10 flex flex-col gap-5" style={{ background: "#12100d" }}>
            <div className="grid grid-cols-2 gap-4">
              <LF label="NOME COMPLETO">
                <input type="text" value={contactForm.name} onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  placeholder="Seu nome" className={inp} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </LF>
              <LF label="TELEFONE (WHATSAPP)">
                <input type="tel" value={contactForm.phone} onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                  placeholder="(00) 00000-0000" className={inp} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </LF>
            </div>
            <LF label="E-MAIL">
              <input type="email" value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="seu@email.com" className={inp} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </LF>
            <LF label="DESCRIÇÃO DO QUE PRECISO">
              <textarea value={contactForm.description} onChange={(e) => setContactForm({ ...contactForm, description: e.target.value })} rows={4}
                placeholder="Que peça é, medidas aproximadas, quantidade e a cor que você quer. Se tiver foto, envie depois pelo WhatsApp."
                className="w-full px-4 py-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] placeholder-[rgba(245,242,236,0.3)] outline-none focus:border-[#e9b421] resize-none transition-colors"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </LF>
            <label className="flex items-start gap-3 cursor-pointer">
              <input type="checkbox" checked={contactForm.consent} onChange={(e) => setContactForm({ ...contactForm, consent: e.target.checked })} className="mt-1 accent-[#e9b421]" />
              <span className="text-[12px] text-[rgba(245,242,236,0.55)] leading-[1.6]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Autorizo o contato pelo WhatsApp informado e a guarda dos meus dados para fins de orçamento.
              </span>
            </label>
            {contactSubmitted ? (
              <div className="h-[52px] flex items-center justify-center bg-[rgba(52,211,153,0.08)] border border-emerald-500 text-emerald-400 text-[13px]"
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                ✓ Mensagem enviada — entraremos em contato em breve!
              </div>
            ) : (
              <button type="submit"
                className="flex items-center justify-center gap-2 h-[52px] rounded-full bg-[#e9b421] text-[#12100d] text-[14px] hover:opacity-90 transition-opacity"
                style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                Enviar mensagem <ArrowRight size={16} />
              </button>
            )}
          </form>

          {/* WhatsApp sidebar */}
          <div className="p-8 md:p-10 flex flex-col gap-6 border-l border-[rgba(245,242,236,0.08)]" style={{ background: "#171511" }}>
            <div>
              <p className="text-[11px] tracking-[2.5px] text-[rgba(245,242,236,0.4)] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>OU FALE DIRETO PELO WHATSAPP</p>
              <a href="https://wa.me/5511999999999"
                className="flex items-center gap-3 h-[52px] px-6 bg-[#25D366] text-white text-[14px] hover:opacity-90 transition-opacity"
                style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                (11) 99999-9999
              </a>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { label: "HORÁRIO DE ATENDIMENTO", value: "Seg–Sex, das 07h às 17h" },
                { label: "E-MAIL", value: "contato@eldo.com.br" },
                { label: "ENDEREÇO", value: "Rua Exemplo, 123 — São Paulo, SP" },
              ].map((f) => (
                <div key={f.label}>
                  <p className="text-[10px] tracking-[2px] text-[rgba(245,242,236,0.35)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{f.label}</p>
                  <p className="text-[14px] text-[rgba(245,242,236,0.7)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{f.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-[rgba(245,242,236,0.08)]">
              <p className="text-[12px] text-[rgba(245,242,236,0.4)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Para volumes maiores ou empresas, use o simulador de orçamento PJ — com cálculo automático por m² e tipo de material.
              </p>
              <button onClick={onGoQuote}
                className="flex items-center gap-2 mt-3 text-[12px] text-[#e9b421] hover:opacity-80 transition-opacity"
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                Solicitar Orçamento <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Portfolio detail modal ─────────────────────────────────────────── */}
      {detail && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-black/75" onClick={() => setDetail(null)} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] flex flex-col border-l border-[rgba(245,242,236,0.1)] overflow-y-auto"
            style={{ background: "#171511" }}>
            <div className="flex items-center justify-between px-7 py-5 border-b border-[rgba(245,242,236,0.08)] sticky top-0" style={{ background: "#171511" }}>
              <div>
                <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{detail.category.toUpperCase()}</p>
                <p className="text-[17px] text-[#f5f2ec] mt-0.5" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{detail.title}</p>
              </div>
              <button onClick={() => setDetail(null)} className="text-[rgba(245,242,236,0.4)] hover:text-[rgba(245,242,236,0.9)]"><X size={20} /></button>
            </div>

            {/* Before / After toggle */}
            <div className="relative h-[260px] flex-shrink-0">
              <img src={afterView ? detail.afterImg : detail.beforeImg} alt={afterView ? "Depois" : "Antes"}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 flex items-end p-4 gap-2">
                {["Antes", "Depois"].map((l, i) => (
                  <button key={l} onClick={() => setAfterView(i === 1)}
                    className={`px-4 py-1.5 text-[11px] tracking-[1.5px] transition-all ${(!afterView && i === 0) || (afterView && i === 1) ? "bg-[#e9b421] text-[#12100d]" : "bg-[rgba(18,16,13,0.7)] text-[rgba(245,242,236,0.7)]"}`}
                    style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <div className="px-7 py-7 flex flex-col gap-5">
              <p className="text-[14px] text-[rgba(245,242,236,0.75)] leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{detail.description}</p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "MATERIAL", value: detail.material },
                  { label: "ACABAMENTO", value: detail.finish },
                  { label: "COR", value: detail.color },
                  { label: "PRAZO", value: detail.deadline },
                ].map((f) => (
                  <div key={f.label} className="px-4 py-3 border border-[rgba(245,242,236,0.08)]" style={{ background: "#12100d" }}>
                    <p className="text-[10px] tracking-[2px] text-[rgba(245,242,236,0.35)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{f.label}</p>
                    <p className="text-[13px] text-[#f5f2ec]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{f.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {detail.tags.map((t) => (
                  <span key={t} className="text-[11px] tracking-[1.5px] px-3 py-1 border border-[rgba(233,180,33,0.3)] text-[rgba(233,180,33,0.8)]"
                    style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                    {t.toUpperCase()}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function LF({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)]"
        style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{label}</label>
      {children}
    </div>
  );
}
