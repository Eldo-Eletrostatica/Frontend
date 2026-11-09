// Shapes of the public data, mirroring the Backend responses.

export interface PortfolioProject {
  showcaseItemId: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  serviceType: string;
  materials: string;
  beforeUrl: string | null;
  afterUrl: string | null;
  createdAt: string;
}

export interface PaginatedPortfolioProjects {
  items: PortfolioProject[];
  total: number;
  page: number;
  limit: number;
  hasNextPage: boolean;
}

export interface CompanyEvent {
  showcaseItemId: string;
  title: string;
  description: string;
  imageUrl: string;
  // Calendar day, YYYY-MM-DD.
  eventDate: string;
  createdAt: string;
}

export interface VisualSettings {
  colors: {
    accent: string;
    pageBackground: string;
    cardBackground: string;
    text: string;
  };
  logo: {
    text: string;
    imageUrl: string | null;
  };
  banner: {
    eyebrow: string;
    title: string;
    highlight: string;
    description: string;
    imageUrl: string | null;
  };
  sectionTitles: {
    portfolio: string;
    reviews: string;
    contact: string;
  };
  eventsHeader: {
    eyebrow: string;
    title: string;
    description: string;
  };
}

// Same values as the Backend default, used only when the API cannot be
// reached, so the site still opens with the Eldo identity.
export const DEFAULT_VISUAL_SETTINGS: VisualSettings = {
  colors: {
    accent: "#e9b421",
    pageBackground: "#12100d",
    cardBackground: "#171511",
    text: "#f5f2ec",
  },
  logo: {
    text: "ELDO",
    imageUrl: null,
  },
  banner: {
    eyebrow: "PINTURA ELETROSTÁTICA A PÓ",
    title: "Acabamento que resiste",
    highlight: "ao tempo.",
    description:
      "Especialistas em pintura eletrostática a pó para estruturas metálicas, portões, máquinas e mobiliário industrial. Mais de 15 anos recuperando e protegendo metal com precisão industrial.",
    imageUrl: null,
  },
  sectionTitles: {
    portfolio: "Trabalhos realizados",
    reviews: "O que dizem quem já contratou",
    contact: "Peça seu orçamento sem compromisso",
  },
  eventsHeader: {
    eyebrow: "AÇÕES E EVENTOS",
    title: "Onde a Eldo esteve",
    description:
      "Feiras do setor, visitas técnicas e ações de formação. Registro público das atividades da empresa fora da fábrica.",
  },
};

export interface GoogleReview {
  authorName: string;
  authorProfileUrl: string | null;
  authorPhotoUrl: string | null;
  rating: number;
  comment: string;
  publishedAt: string;
  reviewUrl: string | null;
}

export interface GoogleReviews {
  isAvailable: boolean;
  googleProfileUrl: string | null;
  reviews: GoogleReview[];
}
