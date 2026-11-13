"use client";

import { useEffect, useState } from "react";
import { ArrowDown, ArrowUp } from "lucide-react";

export default function ScrollShortcuts() {
  const [scrollY, setScrollY] = useState(0);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    function update() {
      setScrollY(window.scrollY);
      setCanScroll(document.documentElement.scrollHeight > window.innerHeight + 160);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  if (!canScroll || scrollY < 120) return null;

  const nearBottom = window.innerHeight + scrollY >= document.documentElement.scrollHeight - 160;

  return (
    <div className="fixed right-5 bottom-6 z-30 flex flex-col gap-2" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Voltar ao topo" title="Voltar ao topo" className="w-11 h-11 rounded-full border border-site-text/18 bg-site-page/92 text-site-accent flex items-center justify-center shadow-lg hover:border-site-accent transition-colors">
        <ArrowUp size={17} />
      </button>
      {!nearBottom && (
        <button type="button" onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })} aria-label="Ir até o final" title="Ir até o final" className="w-11 h-11 rounded-full border border-site-text/18 bg-site-page/92 text-site-text/70 flex items-center justify-center shadow-lg hover:border-site-accent hover:text-site-accent transition-colors">
          <ArrowDown size={17} />
        </button>
      )}
    </div>
  );
}
