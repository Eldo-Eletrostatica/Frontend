"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import logoImg from "@/imports/image.png";
import { ROUTES } from "@/lib/routes";
import { PUBLIC_LINKS } from "./publicLinks";


export default function PublicNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Link does the navigation; clicking the current page only scrolls back up.
  function handleNavigate(href: string) {
    if (href === pathname) window.scrollTo({ top: 0, behavior: "smooth" });
    setOpen(false);
  }

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[rgba(245,242,236,0.1)]"
        style={{
          background: "rgba(18,16,13,0.96)",
          backdropFilter: "blur(12px)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="max-w-[1240px] mx-auto px-5 h-[64px] flex items-center justify-between">
          {/* Logo */}
          <Link href={ROUTES.home} onClick={() => handleNavigate(ROUTES.home)} className="flex items-center gap-3 flex-shrink-0">
            <div className="w-[36px] h-[36px] flex items-center justify-center overflow-hidden flex-shrink-0">
              <img
                src={logoImg.src}
                alt="Eldo Pintura Eletrostática"
                className="w-full h-full object-contain"
                style={{ filter: "invert(1)", mixBlendMode: "screen" }}
              />
            </div>
            <div>
              <p className="text-[#f5f2ec] text-[13px] tracking-[2.1px] leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>ELDO</p>
              <p className="text-[rgba(245,242,236,0.5)] text-[8px] tracking-[2.4px]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PINTURA ELETROSTÁTICA</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => handleNavigate(l.href)}
                className={`text-[13px] transition-colors ${pathname === l.href ? "text-[#e9b421]" : "text-[rgba(245,242,236,0.65)] hover:text-[rgba(245,242,236,0.95)]"}`}
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right area */}
          <div className="flex items-center gap-2">
            <Link href={ROUTES.tracking}
              className="flex items-center gap-1.5 px-3 py-2 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)] text-[11px] hover:border-[#e9b421] hover:text-[#e9b421] transition-all"
              style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              <span className="hidden sm:inline">Acompanhar serviço</span>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] ml-1"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
            >
              <span className={`block w-5 h-[1.5px] bg-[#f5f2ec] transition-all duration-200 ${open ? "rotate-45 translate-y-[6.5px]" : ""}`} />
              <span className={`block w-5 h-[1.5px] bg-[#f5f2ec] transition-all duration-200 ${open ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-[1.5px] bg-[#f5f2ec] transition-all duration-200 ${open ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-y-0 right-0 w-full max-w-[320px] flex flex-col border-l border-[rgba(245,242,236,0.1)]"
            style={{
              background: "#171511",
              paddingTop: "calc(64px + env(safe-area-inset-top))",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo in drawer */}
            <Link href={ROUTES.home} onClick={() => handleNavigate(ROUTES.home)} className="w-full flex items-center gap-3 px-6 pt-8 pb-6 border-b border-[rgba(245,242,236,0.08)] text-left">
              <div className="w-[42px] h-[42px] overflow-hidden flex-shrink-0">
                <img src={logoImg.src} alt="Eldo" className="w-full h-full object-contain"
                  style={{ filter: "invert(1)", mixBlendMode: "screen" }} />
              </div>
              <div>
                <p className="text-[#f5f2ec] text-[13px] tracking-[2px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>ELDO</p>
                <p className="text-[rgba(245,242,236,0.4)] text-[9px] tracking-[2px]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PINTURA ELETROSTÁTICA</p>
              </div>
            </Link>

            {/* Nav links */}
            <nav className="flex flex-col px-4 pt-4 pb-4 gap-1 border-b border-[rgba(245,242,236,0.08)]">
              {PUBLIC_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => handleNavigate(l.href)}
                  className={`flex items-center justify-between h-[52px] px-4 text-[15px] transition-colors ${
                    pathname === l.href
                      ? "text-[#e9b421] bg-[rgba(233,180,33,0.06)]"
                      : "text-[rgba(245,242,236,0.75)] hover:text-[#f5f2ec] hover:bg-[rgba(245,242,236,0.04)]"
                  }`}
                  style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                  {l.label}
                  {pathname === l.href && <span className="w-1.5 h-1.5 rounded-full bg-[#e9b421]" />}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col px-6 pt-6 gap-3">
              <Link href={ROUTES.tracking} onClick={() => handleNavigate(ROUTES.tracking)}
                className="flex items-center gap-2 h-[48px] px-4 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)] text-[13px] hover:border-[#e9b421] hover:text-[#e9b421] transition-all"
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                Acompanhar serviço
              </Link>

              <Link href={ROUTES.quote} onClick={() => handleNavigate(ROUTES.quote)}
                className="h-[48px] rounded-full bg-[#e9b421] text-[#12100d] text-[14px] hover:opacity-90 transition-opacity"
                style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
                Solicitar Orçamento
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
