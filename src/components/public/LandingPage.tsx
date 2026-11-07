import Image from "next/image";
import BucketImage from "./BucketImage";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import bundledLogo from "@/imports/image.png";
import { ROUTES } from "@/lib/routes";
import ContactRequestForm from "./ContactRequestForm";
import GoogleReviewsSection from "./GoogleReviewsSection";
import PortfolioGallery from "./PortfolioGallery";
import type { PortfolioProject, VisualSettings } from "./publicContent";

const COMPANY_STATS = [
  { value: "+15 anos", label: "de experiência" },
  { value: "+8.000", label: "peças por ano" },
  { value: "100%", label: "eletrostática a pó" },
];

interface LandingPageProps {
  visualSettings: VisualSettings;
  // null when the API could not be reached.
  portfolioProjects: PortfolioProject[] | null;
}

// Server-rendered page; the filter, the modals, the reviews and the contact
// form are the client components it composes.
export default function LandingPage({ visualSettings, portfolioProjects }: LandingPageProps) {
  const { banner, sectionTitles } = visualSettings;

  return (
    <div>
      {/* ─── BANNER ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: "linear-gradient(160deg, var(--site-card-background) 0%, var(--site-page-background) 55%, var(--site-deep-background) 100%)" }}>
        {/* Background texture lines */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(0deg, var(--site-text) 0px, var(--site-text) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(90deg, var(--site-text) 0px, var(--site-text) 1px, transparent 1px, transparent 60px)" }} />

        <div className="relative max-w-[1240px] mx-auto px-6 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <p className="text-[11px] tracking-[3px] text-site-accent mb-6" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                {banner.eyebrow}
              </p>
              <h1 className="text-[48px] md:text-[60px] text-site-text leading-[1.0] tracking-[-1.5px] mb-6" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                {banner.title}<br /><span className="text-site-accent">{banner.highlight}</span>
              </h1>
              <p className="text-[16px] text-site-text/60 leading-[1.8] mb-10 max-w-[460px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                {banner.description}
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href={ROUTES.quote}
                  className="flex items-center gap-2 h-[52px] px-8 rounded-full bg-site-accent text-site-page text-[14px] hover:opacity-90 transition-opacity"
                  style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                  Solicitar Orçamento <ArrowRight size={16} />
                </Link>
                <a href="#contato"
                  className="flex items-center h-[52px] px-8 border border-site-text/20 text-site-text/80 text-[14px] hover:border-site-text/50 transition-colors"
                  style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                  Falar com a equipe
                </a>
              </div>
            </div>

            {/* Banner image, or the bundled logo when none is published */}
            <div className="flex items-center justify-center md:justify-end">
              <div className="relative">
                <div className="relative w-[220px] h-[220px] md:w-[280px] md:h-[280px] flex items-center justify-center overflow-hidden bg-site-accent/6 border border-site-accent/15">
                  {banner.imageUrl ? (
                    <BucketImage src={banner.imageUrl} alt={`${banner.title} ${banner.highlight}`} fill priority
                      sizes="(min-width: 768px) 280px, 220px" className="object-cover" />
                  ) : (
                    <Image src={bundledLogo} alt={`Logotipo ${visualSettings.logo.text}`} priority
                      sizes="(min-width: 768px) 196px, 154px" className="w-[70%] h-[70%] object-contain"
                      style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
                  )}
                </div>
                {/* Decorative accent line */}
                <div className="absolute -bottom-4 -right-4 w-full h-full border border-site-accent/12" style={{ zIndex: -1 }} />
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-site-text/6 mt-16">
            {COMPANY_STATS.map((stat) => (
              <div key={stat.label} className="px-6 py-5 bg-site-page/70">
                <p className="text-[22px] text-site-accent leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{stat.value}</p>
                <p className="text-[12px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PortfolioGallery title={sectionTitles.portfolio} portfolioProjects={portfolioProjects} />

      <GoogleReviewsSection title={sectionTitles.reviews} />

      {/* ─── CONTATO PF ────────────────────────────────────────────────────── */}
      <section id="contato" className="max-w-[1240px] mx-auto px-6 pt-20 pb-24">
        <div className="border-b border-site-text/12 pb-10 mb-12">
          <p className="text-[11px] tracking-[3px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTATO · PESSOA FÍSICA</p>
          <h2 className="text-[40px] text-site-text leading-[1.05] tracking-[-1px] max-w-[680px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{sectionTitles.contact}</h2>
        </div>

        <div className="grid md:grid-cols-2 gap-px bg-site-text/8">
          <ContactRequestForm />

          {/* WhatsApp sidebar */}
          <div className="p-8 md:p-10 flex flex-col gap-6 bg-site-card">
            <div>
              <p className="text-[11px] tracking-[2.5px] text-site-text/40 mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>OU FALE DIRETO PELO WHATSAPP</p>
              <a href="https://wa.me/5511999999999"
                className="flex items-center gap-3 h-[52px] px-6 bg-[#25D366] text-white text-[14px] hover:opacity-90 transition-opacity"
                style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                <svg viewBox="0 0 24 24" width="20" height="20" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                (11) 99999-9999
              </a>
            </div>

            <div className="flex flex-col gap-4">
              {[
                { label: "HORÁRIO DE ATENDIMENTO", value: "Seg a Sex, das 07h às 17h" },
                { label: "E-MAIL", value: "contato@eldo.com.br" },
                { label: "ENDEREÇO", value: "Rua Exemplo, 123, São Paulo, SP" },
              ].map((field) => (
                <div key={field.label}>
                  <p className="text-[10px] tracking-[2px] text-site-text/35 mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{field.label}</p>
                  <p className="text-[14px] text-site-text/70" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{field.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 border-t border-site-text/8">
              <p className="text-[12px] text-site-text/40 leading-[1.7]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Para volumes maiores ou empresas, use o simulador de orçamento PJ, com cálculo automático por m² e tipo de material.
              </p>
              <Link href={ROUTES.quote}
                className="flex items-center gap-2 mt-3 text-[12px] text-site-accent hover:opacity-80 transition-opacity"
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                Solicitar Orçamento <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
