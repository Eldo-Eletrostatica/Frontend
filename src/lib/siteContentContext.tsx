import { createContext, useContext, useState, type ReactNode } from "react";

export interface LandingCategoryContent {
  id: number;
  title: string;
}

export interface LandingProjectContent {
  id: number;
  title: string;
  categoryId: number;
  material: string;
  finish: string;
  color: string;
  deadline: string;
  description: string;
  beforeImg: string;
  afterImg: string;
  tags: string[];
}

export interface EventContent {
  id: number;
  year: string;
  month: string;
  tag: string;
  title: string;
  description: string;
  img: string;
}

export interface SiteContent {
  showAutomaticSimulator: boolean;
  landing: {
    heroEyebrow: string;
    heroTitle: string;
    heroAccent: string;
    heroDescription: string;
    heroImage: string;
    portfolioTitle: string;
    reviewsTitle: string;
    contactTitle: string;
    categories: LandingCategoryContent[];
    projects: LandingProjectContent[];
  };
  events: {
    eyebrow: string;
    title: string;
    description: string;
    items: EventContent[];
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  showAutomaticSimulator: true,
  landing: {
    heroEyebrow: "PINTURA ELETROSTÁTICA A PÓ",
    heroTitle: "Acabamento que resiste",
    heroAccent: "ao tempo.",
    heroDescription: "Especialistas em pintura eletrostática a pó para estruturas metálicas, portões, máquinas e mobiliário industrial. Mais de 15 anos recuperando e protegendo metal com precisão industrial.",
    heroImage: "",
    portfolioTitle: "Trabalhos realizados",
    reviewsTitle: "O que dizem quem já contratou",
    contactTitle: "Peça seu orçamento sem compromisso",
    categories: [
      { id: 1, title: "Estrutura Metálica" },
      { id: 2, title: "Portões e Grades" },
      { id: 3, title: "Máquinas Industriais" },
      { id: 4, title: "Mobiliário" },
    ],
    projects: [
      {
        id: 1, title: "Estrutura metálica industrial", categoryId: 1,
        material: "Aço carbono", finish: "Pó epóxi fosco", color: "RAL 7016 Cinza antracito", deadline: "5 dias úteis",
        description: "Recuperação e pintura eletrostática de perfis estruturais com corrosão superficial. Pré-tratamento completo com decapagem mecânica, desengraxe químico e cura térmica controlada.",
        beforeImg: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=600&h=420&fit=crop&auto=format",
        afterImg: "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600&h=420&fit=crop&auto=format",
        tags: ["Pintura eletrostática a pó", "Limpeza mecânica", "Cura térmica"],
      },
      {
        id: 2, title: "Portão residencial articulado", categoryId: 2,
        material: "Ferro forjado", finish: "Pó poliéster brilhante", color: "RAL 9005 Preto intenso", deadline: "3 dias úteis",
        description: "Portão com ferrugem superficial e pintura degradada. Processo completo de decapagem, primer anticorrosivo e acabamento em pó poliéster de alta durabilidade.",
        beforeImg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=420&fit=crop&auto=format",
        afterImg: "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=420&fit=crop&auto=format",
        tags: ["Poliéster brilhante", "Anticorrosivo", "Primer"],
      },
      {
        id: 3, title: "Máquina agrícola — chassi", categoryId: 3,
        material: "Aço galvanizado", finish: "Pó epóxi semibrilho", color: "RAL 6018 Verde amarelado", deadline: "7 dias úteis",
        description: "Chassi de colheitadeira com desgaste severo após safra. Jateamento abrasivo e pintura eletrostática em duas demãos para resistência ao campo.",
        beforeImg: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&h=420&fit=crop&auto=format",
        afterImg: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=600&h=420&fit=crop&auto=format",
        tags: ["Jateamento abrasivo", "Anti-ferrugem", "Dupla demão"],
      },
      {
        id: 4, title: "Mobiliário metálico corporativo", categoryId: 4,
        material: "Aço inox escovado", finish: "Pó poliéster texturizado", color: "RAL 9003 Branco sinal", deadline: "4 dias úteis",
        description: "Conjunto de mesas e armários metálicos para escritório corporativo. Textura fina que disfarça marcas de uso e facilita limpeza industrial.",
        beforeImg: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&h=420&fit=crop&auto=format",
        afterImg: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=420&fit=crop&auto=format",
        tags: ["Texturizado", "Escritório", "Poliéster"],
      },
      {
        id: 5, title: "Grade de proteção perimetral", categoryId: 2,
        material: "Ferro soldado", finish: "Pó epóxi fosco", color: "RAL 7021 Preto acinzentado", deadline: "6 dias úteis",
        description: "Grade de 180 metros lineares para área fabril. Processo em linha com jig de suspensão, garantindo uniformidade de espessura em toda a extensão.",
        beforeImg: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&h=420&fit=crop&auto=format",
        afterImg: "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&h=420&fit=crop&auto=format",
        tags: ["Grande volume", "Epóxi fosco", "Linha suspensa"],
      },
      {
        id: 6, title: "Rack industrial para datacenter", categoryId: 1,
        material: "Aço ABNT 1020", finish: "Pó epóxi condutivo", color: "RAL 7035 Cinza claro", deadline: "4 dias úteis",
        description: "Racks para datacenter com exigência de dissipação eletrostática. Pintura especial com carga condutiva e certificação de resistividade medida por peça.",
        beforeImg: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=600&h=420&fit=crop&auto=format",
        afterImg: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&h=420&fit=crop&auto=format",
        tags: ["Condutivo", "Datacenter", "Certificado"],
      },
    ],
  },
  events: {
    eyebrow: "AÇÕES E EVENTOS",
    title: "Onde a Eldo esteve",
    description: "Feiras do setor, visitas técnicas e ações de formação. Registro público das atividades da empresa fora da fábrica.",
    items: [
      { id: 1, year: "2025", month: "AGO", tag: "FEIRA INDUSTRIAL", title: "Expometal São Paulo 2025", description: "A Eldo marcou presença na maior feira de metalurgia do Brasil com estande próprio, demonstrações ao vivo do processo eletrostático e atendimento a mais de 340 visitantes qualificados em três dias de evento.", img: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=380&fit=crop&auto=format" },
      { id: 2, year: "2025", month: "MAR", tag: "VISITA TÉCNICA", title: "Visita técnica à fábrica da Volvo Caminhões", description: "Equipe técnica participou de benchmarking com o departamento de acabamento superficial da Volvo em Curitiba, absorvendo práticas de controle de qualidade e metodologia de inspeção de aderência em linha.", img: "https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&h=380&fit=crop&auto=format" },
      { id: 3, year: "2024", month: "NOV", tag: "FORMAÇÃO", title: "Workshop: Tintas em pó de alta performance", description: "Capacitação interna com engenheiros da Jotun Brasil sobre formulações epóxi-poliéster para ambientes corrosivos. A equipe de 12 funcionários recebeu certificação técnica reconhecida pelo fabricante.", img: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600&h=380&fit=crop&auto=format" },
    ],
  },
};

interface SiteContentContextValue {
  content: SiteContent;
  setContent: (content: SiteContent) => void;
}

const SiteContentContext = createContext<SiteContentContextValue>({ content: DEFAULT_SITE_CONTENT, setContent: () => {} });

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  return <SiteContentContext.Provider value={{ content, setContent }}>{children}</SiteContentContext.Provider>;
}

export function useSiteContent() {
  return useContext(SiteContentContext);
}
