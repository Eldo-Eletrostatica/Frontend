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
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Voltar ao topo" title="Voltar ao topo" className="w-11 h-11 rounded-full border border-[rgba(245,242,236,0.18)] bg-[rgba(18,16,13,0.92)] text-[#e9b421] flex items-center justify-center shadow-lg hover:border-[#e9b421] transition-colors">
        <ArrowUp size={17} />
      </button>
      {!nearBottom && (
        <button type="button" onClick={() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" })} aria-label="Ir até o final" title="Ir até o final" className="w-11 h-11 rounded-full border border-[rgba(245,242,236,0.18)] bg-[rgba(18,16,13,0.92)] text-[rgba(245,242,236,0.7)] flex items-center justify-center shadow-lg hover:border-[#e9b421] hover:text-[#e9b421] transition-colors">
          <ArrowDown size={17} />
        </button>
      )}
    </div>
  );
}
