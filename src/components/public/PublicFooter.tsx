import type { PublicPage } from "./PublicSite";
import logoImg from "@/imports/image.png";

interface Props { setPage: (p: PublicPage) => void; }

export default function PublicFooter({ setPage }: Props) {
  return (
    <footer className="border-t border-[rgba(245,242,236,0.08)] mt-4" style={{ background: "#0d0b09", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="max-w-[1240px] mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <button onClick={() => { setPage("home"); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-3 mb-5 text-left">
            <div className="w-[44px] h-[44px] overflow-hidden flex-shrink-0">
              <img
                src={logoImg.src}
                alt="Eldo Pintura Eletrostática"
                className="w-full h-full object-contain"
                style={{ filter: "invert(1)", mixBlendMode: "screen" }}
              />
            </div>
            <div>
              <p className="text-[#f5f2ec] text-[14px] tracking-[2.5px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>ELDO</p>
              <p className="text-[rgba(245,242,236,0.4)] text-[9px] tracking-[2px]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PINTURA ELETROSTÁTICA</p>
            </div>
          </button>
          <p className="text-[13px] text-[rgba(245,242,236,0.4)] leading-[1.75]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Especialistas em pintura eletrostática a pó para estruturas metálicas, portões, máquinas e mobiliário industrial.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-[10px] tracking-[2.5px] text-[rgba(245,242,236,0.35)] mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>NAVEGAÇÃO</p>
          <div className="flex flex-col gap-2">
            {[
              { id: "home"       as PublicPage, label: "Início" },
              { id: "events"     as PublicPage, label: "Eventos" },
              { id: "contact-pj" as PublicPage, label: "Solicitar Orçamento" },
            ].map((l) => (
              <button key={l.id} onClick={() => setPage(l.id)}
                className="text-left text-[13px] text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.85)] transition-colors"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                {l.label}
              </button>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[10px] tracking-[2.5px] text-[rgba(245,242,236,0.35)] mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTATO</p>
          <div className="flex flex-col gap-2 text-[13px] text-[rgba(245,242,236,0.5)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            <span>(11) 99999-9999</span>
            <span>contato@eldo.com.br</span>
            <span>Seg–Sex · 07h–17h</span>
          </div>
        </div>
      </div>
      <div className="border-t border-[rgba(245,242,236,0.05)] px-6 py-5 max-w-[1240px] mx-auto">
        <p className="text-[10px] tracking-[1.5px] text-[rgba(245,242,236,0.2)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          © 2025 ELDO PINTURA ELETROSTÁTICA — TODOS OS DIREITOS RESERVADOS
        </p>
      </div>
    </footer>
  );
}
