"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/routes";
import BrandLogo from "@/components/BrandLogo";
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
        className="sticky top-0 z-40 border-b border-site-text/10"
        style={{
          background: "color-mix(in srgb, var(--site-page-background) 96%, transparent)",
          backdropFilter: "blur(12px)",
          paddingTop: "env(safe-area-inset-top)",
        }}
      >
        <div className="max-w-[1240px] mx-auto px-5 h-[64px] flex items-center justify-between">
          {/* Logo */}
          <Link href={ROUTES.home} onClick={() => handleNavigate(ROUTES.home)} className="flex items-center gap-3 flex-shrink-0">
            <BrandLogo bare size={36} textClassName="text-[13px] tracking-[2.1px] leading-tight" taglineClassName="text-site-text/50 text-[8px] tracking-[2.4px]" />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {PUBLIC_LINKS.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => handleNavigate(l.href)}
                className={`text-[13px] transition-colors ${pathname === l.href ? "text-site-accent" : "text-site-text/65 hover:text-site-text/95"}`}
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right area */}
          <div className="flex items-center gap-2">
            <Link href={ROUTES.tracking}
              className="flex items-center gap-1.5 px-3 py-2 border border-site-text/18 text-site-text/70 text-[11px] hover:border-site-accent hover:text-site-accent transition-all"
              style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
              <span className="hidden sm:inline">Acompanhar serviço</span>
            </Link>

            {/* Hamburger */}
            <button
              onClick={() => setOpen((v) => !v)}
              className="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-[5px] ml-1"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
            >
              <span className={`block w-5 h-[1.5px] bg-site-text transition-all duration-200 ${open ? "rotate-45 translate-y-[6.5px]" : ""}`} />
              <span className={`block w-5 h-[1.5px] bg-site-text transition-all duration-200 ${open ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-[1.5px] bg-site-text transition-all duration-200 ${open ? "-rotate-45 -translate-y-[6.5px]" : ""}`} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-30 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="absolute inset-y-0 right-0 w-full max-w-[320px] flex flex-col border-l border-site-text/10"
            style={{
              background: "var(--site-card-background)",
              paddingTop: "calc(64px + env(safe-area-inset-top))",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Logo in drawer */}
            <Link href={ROUTES.home} onClick={() => handleNavigate(ROUTES.home)} className="w-full flex items-center gap-3 px-6 pt-8 pb-6 border-b border-site-text/8 text-left">
              <BrandLogo bare size={42} textClassName="text-[13px] tracking-[2px]" taglineClassName="text-site-text/40 text-[9px] tracking-[2px]" />
            </Link>

            {/* Nav links */}
            <nav className="flex flex-col px-4 pt-4 pb-4 gap-1 border-b border-site-text/8">
              {PUBLIC_LINKS.map((l) => (
                <Link key={l.href} href={l.href} onClick={() => handleNavigate(l.href)}
                  className={`flex items-center justify-between h-[52px] px-4 text-[15px] transition-colors ${
                    pathname === l.href
                      ? "text-site-accent bg-site-accent/6"
                      : "text-site-text/75 hover:text-site-text hover:bg-site-text/4"
                  }`}
                  style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                  {l.label}
                  {pathname === l.href && <span className="w-1.5 h-1.5 rounded-full bg-site-accent" />}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col px-6 pt-6 gap-3">
              <Link href={ROUTES.tracking} onClick={() => handleNavigate(ROUTES.tracking)}
                className="flex items-center gap-2 h-[48px] px-4 border border-site-text/18 text-site-text/70 text-[13px] hover:border-site-accent hover:text-site-accent transition-all"
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                Acompanhar serviço
              </Link>

              <Link href={ROUTES.quote} onClick={() => handleNavigate(ROUTES.quote)}
                className="flex items-center justify-center h-[48px] px-4 rounded-full bg-site-accent text-site-page text-[14px] text-center hover:opacity-90 transition-opacity"
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
