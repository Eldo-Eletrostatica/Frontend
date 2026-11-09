import Link from "next/link";
import { PUBLIC_LINKS } from "./publicLinks";
import { ROUTES } from "@/lib/routes";
import type { VisualSettings } from "./publicContent";
import SiteLogo from "./SiteLogo";

export default function PublicFooter({ logo }: { logo: VisualSettings["logo"] }) {
  return (
    <footer className="border-t border-site-text/8 mt-4" style={{ background: "var(--site-deep-background)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
      <div className="max-w-[1240px] mx-auto px-6 py-14 grid md:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <Link href={ROUTES.home} className="flex items-center gap-3 mb-5 text-left">
            <SiteLogo logo={logo} size={44} textClassName="text-[14px] tracking-[2.5px]" taglineClassName="text-site-text/40 text-[9px] tracking-[2px]" />
          </Link>
          <p className="text-[13px] text-site-text/40 leading-[1.75]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            Especialistas em pintura eletrostática a pó para estruturas metálicas, portões, máquinas e mobiliário industrial.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <p className="text-[10px] tracking-[2.5px] text-site-text/35 mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>NAVEGAÇÃO</p>
          <div className="flex flex-col gap-2">
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href}
                className="text-left text-[13px] text-site-text/50 hover:text-site-text/85 transition-colors"
                style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[10px] tracking-[2.5px] text-site-text/35 mb-4" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONTATO</p>
          <div className="flex flex-col gap-2 text-[13px] text-site-text/50" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            <span>(11) 99999-9999</span>
            <span>contato@eldo.com.br</span>
            <span>Seg–Sex · 07h–17h</span>
          </div>
        </div>
      </div>
      <div className="border-t border-site-text/5 px-6 py-5 max-w-[1240px] mx-auto">
        <p className="text-[10px] tracking-[1.5px] text-site-text/20" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
          © {new Date().getFullYear()} {logo.text.toUpperCase()} PINTURA ELETROSTÁTICA · TODOS OS DIREITOS RESERVADOS
        </p>
      </div>
    </footer>
  );
}
