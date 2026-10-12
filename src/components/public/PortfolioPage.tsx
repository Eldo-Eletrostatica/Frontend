import { useState } from "react";
import { X, ArrowRight } from "lucide-react";
import { createPortal } from "react-dom";

interface Project {
  id: number;
  title: string;
  category: string;
  material: string;
  finish: string;
  color: string;
  deadline: string;
  description: string;
  beforeImg: string;
  afterImg: string;
  tags: string[];
}

const PROJECTS: Project[] = [
  {
    id: 1, title: "Estrutura metálica industrial", category: "ESTRUTURA METÁLICA",
    material: "Aço carbono", finish: "Pó epóxi fosco", color: "RAL 7016 Cinza antracito", deadline: "5 dias úteis",
    description: "Recuperação e pintura eletrostática de perfis estruturais com corrosão superficial. Pré-tratamento completo com decapagem mecânica, desengraxe químico, cura térmica controlada e inspeção de aderência peça por peça.",
    beforeImg: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=420&fit=crop&auto=format",
    afterImg:  "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=420&fit=crop&auto=format",
    tags: ["Pintura eletrostática a pó", "Limpeza mecânica", "Cura térmica"],
  },
  {
    id: 2, title: "Portão residencial articulado", category: "PORTÕES E GRADES",
    material: "Ferro forjado", finish: "Pó poliéster brilhante", color: "RAL 9005 Preto intenso", deadline: "3 dias úteis",
    description: "Portão com ferrugem superficial e pintura antiga degradada. Processo completo de decapagem, primer anticorrosivo e acabamento em pó poliéster de alta durabilidade.",
    beforeImg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=420&fit=crop&auto=format",
    afterImg:  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=420&fit=crop&auto=format",
    tags: ["Poliéster brilhante", "Anticorrosivo", "Primer"],
  },
  {
    id: 3, title: "Máquina agrícola — chassi", category: "MÁQUINAS INDUSTRIAIS",
    material: "Aço galvanizado", finish: "Pó epóxi semibrilho", color: "RAL 6018 Verde amarelado", deadline: "7 dias úteis",
    description: "Chassi de colheitadeira com desgaste severo após safra. Jateamento abrasivo, tratamento anti-ferrugem e pintura eletrostática em duas demãos para garantir resistência ao campo.",
    beforeImg: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=420&fit=crop&auto=format",
    afterImg:  "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&h=420&fit=crop&auto=format",
    tags: ["Jateamento abrasivo", "Anti-ferrugem", "Dupla demão"],
  },
  {
    id: 4, title: "Mobiliário metálico corporativo", category: "MOBILIÁRIO",
    material: "Aço inox escovado", finish: "Pó poliéster texturizado", color: "RAL 9003 Branco sinal", deadline: "4 dias úteis",
    description: "Conjunto de mesas e armários metálicos para escritório corporativo. Textura fina que disfarça marcas de uso e facilita limpeza industrial.",
    beforeImg: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=420&fit=crop&auto=format",
    afterImg:  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=420&fit=crop&auto=format",
    tags: ["Texturizado", "Escritório", "Poliéster"],
  },
  {
    id: 5, title: "Grade de proteção perimetral", category: "PORTÕES E GRADES",
    material: "Ferro soldado", finish: "Pó epóxi fosco", color: "RAL 7021 Preto acinzentado", deadline: "6 dias úteis",
    description: "Grade de 180 metros lineares para área fabril. Processo em linha com jig de suspensão, garantindo uniformidade de espessura em toda a extensão.",
    beforeImg: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=420&fit=crop&auto=format",
    afterImg:  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=420&fit=crop&auto=format",
    tags: ["Grande volume", "Epóxi fosco", "Linha suspensa"],
  },
  {
    id: 6, title: "Rack industrial para datacenter", category: "ESTRUTURA METÁLICA",
    material: "Aço ABNT 1020", finish: "Pó epóxi condutivo", color: "RAL 7035 Cinza claro", deadline: "4 dias úteis",
    description: "Racks para datacenter com exigência de dissipação eletrostática. Pintura especial com carga condutiva e certificação de resistividade medida por peça.",
    beforeImg: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=420&fit=crop&auto=format",
    afterImg:  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=420&fit=crop&auto=format",
    tags: ["Condutivo", "Datacenter", "Certificado"],
  },
];

const CATEGORIES = ["Todos", "Estrutura Metálica", "Portões e Grades", "Máquinas Industriais", "Mobiliário"];

export default function PortfolioPage() {
  const [filter, setFilter] = useState("Todos");
  const [detail, setDetail] = useState<Project | null>(null);

  const visible = filter === "Todos"
    ? PROJECTS
    : PROJECTS.filter((p) => p.category.toLowerCase().includes(filter.toLowerCase().split(" ")[0]));

  return (
    <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-20">
      {/* Header */}
      <div className="border-b border-[rgba(245,242,236,0.12)] pb-10 mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[13px] tracking-[2.86px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>VITRINE DE SERVIÇOS</p>
          <h1 className="text-[48px] text-[#f5f2ec] leading-[1.05] tracking-[-1.44px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Portfólio</h1>
        </div>
        <p className="text-[16px] text-[rgba(245,242,236,0.6)] leading-[1.65] max-w-[460px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Projetos reais de pintura eletrostática a pó. Cada caso mostra o antes, o processo e o resultado final com os parâmetros controlados.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-10">
        {CATEGORIES.map((c) => (
          <button key={c} onClick={() => setFilter(c)}
            className={`px-4 py-2 text-[11px] tracking-[1.5px] transition-all ${filter === c ? "bg-[#e9b421] text-[#12100d]" : "border border-[rgba(245,242,236,0.15)] text-[rgba(245,242,236,0.55)] hover:text-[rgba(245,242,236,0.9)]"}`}
            style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}
          >
            {c.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(245,242,236,0.08)]">
        {visible.map((p) => (
          <button key={p.id} onClick={() => setDetail(p)} className="group bg-[#12100d] text-left overflow-hidden">
            <div className="relative overflow-hidden h-[240px]">
              <img src={p.afterImg} alt={p.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[rgba(18,16,13,0.85)] to-transparent" />
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#e9b421] text-[#12100d] text-[10px] tracking-[1.8px]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                {p.category}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-[17px] text-[#f5f2ec] leading-[1.3] mb-2" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{p.title}</h3>
              <div className="flex items-center gap-2 text-[#e9b421] text-[12px] tracking-[1.5px] mt-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                VER DETALHES <ArrowRight size={12} />
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Detail modal */}
      {detail && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div className="absolute inset-0 bg-black/80" onClick={() => setDetail(null)} />
          <div className="relative w-full max-w-[900px] max-h-[90vh] overflow-y-auto border border-[rgba(245,242,236,0.12)]" style={{ background: "#12100d" }}>
            <button onClick={() => setDetail(null)} className="absolute top-5 right-5 z-10 text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.9)]">
              <X size={20} />
            </button>

            {/* Before / After */}
            <div className="grid grid-cols-2 gap-px bg-[rgba(245,242,236,0.1)]">
              <div className="relative">
                <img src={detail.beforeImg} alt="Antes" className="w-full h-[280px] object-cover" />
                <span className="absolute top-3 left-3 px-3 py-1 bg-[#f5f2ec] text-[#12100d] text-[11px] tracking-[1.3px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>ANTES</span>
              </div>
              <div className="relative">
                <img src={detail.afterImg} alt="Depois" className="w-full h-[280px] object-cover" />
                <span className="absolute top-3 left-3 px-3 py-1 bg-[#e9b421] text-[#12100d] text-[11px] tracking-[1.3px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>DEPOIS</span>
              </div>
            </div>

            <div className="p-8">
              <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{detail.category}</p>
              <h2 className="text-[28px] text-[#f5f2ec] tracking-[-0.56px] mb-5" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{detail.title}</h2>

              {/* Specs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[rgba(245,242,236,0.1)] border-t border-b border-[rgba(245,242,236,0.12)] py-px mb-6">
                {[
                  { label: "MATERIAL", value: detail.material },
                  { label: "ACABAMENTO", value: detail.finish },
                  { label: "COR", value: detail.color },
                  { label: "PRAZO", value: detail.deadline },
                ].map((s) => (
                  <div key={s.label} className="bg-[#12100d] px-4 py-4">
                    <p className="text-[10px] tracking-[2px] text-[rgba(245,242,236,0.45)] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{s.label}</p>
                    <p className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{s.value}</p>
                  </div>
                ))}
              </div>

              <p className="text-[15px] text-[rgba(245,242,236,0.7)] leading-[1.7] mb-6" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{detail.description}</p>

              <div className="flex flex-wrap gap-2">
                {detail.tags.map((t) => (
                  <span key={t} className="px-3 py-1 border border-[rgba(245,242,236,0.18)] text-[12px] text-[rgba(245,242,236,0.65)]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
