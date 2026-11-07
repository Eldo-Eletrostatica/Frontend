"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BucketImage from "./BucketImage";
import PublicNotice from "./PublicNotice";
import { X } from "lucide-react";
import type { PortfolioProject } from "./publicContent";

const ALL_PORTFOLIO_CATEGORIES = "Todos";

// The glossary orders the portfolioCategory filter alphabetically.
function listPortfolioCategories(portfolioProjects: PortfolioProject[]): string[] {
  const portfolioCategories = new Set(portfolioProjects.map((portfolioProject) => portfolioProject.category));
  return [...portfolioCategories].sort((first, second) => first.localeCompare(second, "pt-BR"));
}

interface PortfolioGalleryProps {
  title: string;
  // null when the API could not be reached.
  portfolioProjects: PortfolioProject[] | null;
}

export default function PortfolioGallery({ title, portfolioProjects }: PortfolioGalleryProps) {
  const [selectedPortfolioCategory, setSelectedPortfolioCategory] = useState(ALL_PORTFOLIO_CATEGORIES);
  const [selectedPortfolioProject, setSelectedPortfolioProject] = useState<PortfolioProject | null>(null);

  const portfolioCategories = listPortfolioCategories(portfolioProjects ?? []);
  const visiblePortfolioProjects = selectedPortfolioCategory === ALL_PORTFOLIO_CATEGORIES
    ? portfolioProjects ?? []
    : (portfolioProjects ?? []).filter((portfolioProject) => portfolioProject.category === selectedPortfolioCategory);

  return (
    <section id="portfolio" className="max-w-[1240px] mx-auto px-6 pt-20 pb-16">
      <div className="border-b border-site-text/12 pb-10 mb-10">
        <p className="text-[11px] tracking-[3px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PORTFÓLIO</p>
        <h2 className="text-[40px] text-site-text leading-[1.05] tracking-[-1px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
          {title}
        </h2>
      </div>

      {portfolioProjects === null || portfolioProjects.length === 0 ? (
        <PublicNotice
          title={portfolioProjects === null ? "Não foi possível carregar o portfólio" : "Nenhum projeto publicado ainda"}
          description={portfolioProjects === null
            ? "Tente novamente em alguns minutos."
            : "Em breve você verá aqui os trabalhos realizados pela nossa equipe."}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {[ALL_PORTFOLIO_CATEGORIES, ...portfolioCategories].map((portfolioCategory) => (
              <button key={portfolioCategory} type="button" onClick={() => setSelectedPortfolioCategory(portfolioCategory)}
                aria-pressed={selectedPortfolioCategory === portfolioCategory}
                className={`px-4 py-1.5 text-[11px] tracking-[1.5px] transition-all ${selectedPortfolioCategory === portfolioCategory ? "bg-site-accent text-site-page" : "border border-site-text/15 text-site-text/55 hover:border-site-text/35"}`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                {portfolioCategory === ALL_PORTFOLIO_CATEGORIES ? "TODOS OS PROJETOS" : portfolioCategory.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-site-text/8">
            {visiblePortfolioProjects.map((portfolioProject) => (
              <button key={portfolioProject.showcaseItemId} type="button" onClick={() => setSelectedPortfolioProject(portfolioProject)}
                className="relative group overflow-hidden text-left bg-site-card">
                {/* The tinted box is the placeholder while the image loads. */}
                <div className="relative h-[220px] overflow-hidden bg-site-text/5">
                  <BucketImage src={portfolioProject.imageUrl} alt={portfolioProject.title} fill
                    sizes="(min-width: 1024px) 413px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-site-page/85 to-transparent" />
                  <span className="absolute top-3 left-3 text-[10px] tracking-[2px] px-2 py-1 bg-site-page/70 text-site-text/70"
                    style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                    {portfolioProject.category.toUpperCase()}
                  </span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[15px] text-site-text mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{portfolioProject.title}</p>
                  <p className="text-[12px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{portfolioProject.serviceType}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedPortfolioProject && (
        <PortfolioProjectDetail portfolioProject={selectedPortfolioProject} onClose={() => setSelectedPortfolioProject(null)} />
      )}
    </section>
  );
}

interface PortfolioProjectPhoto {
  label: string;
  url: string;
}

// Before and after photos are optional; with neither, the cover stands in.
function listPortfolioProjectPhotos(portfolioProject: PortfolioProject): PortfolioProjectPhoto[] {
  const photos: PortfolioProjectPhoto[] = [];
  if (portfolioProject.beforeUrl) photos.push({ label: "Antes", url: portfolioProject.beforeUrl });
  if (portfolioProject.afterUrl) photos.push({ label: "Depois", url: portfolioProject.afterUrl });
  return photos.length > 0 ? photos : [{ label: "Capa", url: portfolioProject.imageUrl }];
}

function PortfolioProjectDetail({ portfolioProject, onClose }: { portfolioProject: PortfolioProject; onClose: () => void }) {
  const photos = listPortfolioProjectPhotos(portfolioProject);
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex] ?? photos[0];

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-black/75" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="project-detail-title"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] flex flex-col border-l border-site-text/10 overflow-y-auto bg-site-card">
        <div className="flex items-center justify-between px-7 py-5 border-b border-site-text/8 sticky top-0 z-10 bg-site-card">
          <div>
            <p className="text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{portfolioProject.category.toUpperCase()}</p>
            <p id="project-detail-title" className="text-[17px] text-site-text mt-0.5" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{portfolioProject.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-site-text/40 hover:text-site-text/90"><X size={20} /></button>
        </div>

        <div className="relative h-[300px] flex-shrink-0 bg-site-text/5">
          <BucketImage key={photo.url} src={photo.url} alt={`${portfolioProject.title}: ${photo.label.toLowerCase()}`} fill sizes="560px" className="object-cover" />
          {photos.length > 1 && (
            <div className="absolute inset-0 flex items-end p-4 gap-2">
              {photos.map((item, index) => (
                <button key={item.label} type="button" onClick={() => setPhotoIndex(index)}
                  aria-pressed={index === photoIndex}
                  className={`px-4 py-1.5 text-[11px] tracking-[1.5px] transition-all ${index === photoIndex ? "bg-site-accent text-site-page" : "bg-site-page/70 text-site-text/70"}`}
                  style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                  {item.label.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          {photos.length === 1 && photo.label !== "Capa" && (
            <span className="absolute left-4 bottom-4 px-4 py-1.5 text-[11px] tracking-[1.5px] bg-site-page/70 text-site-text/70"
              style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
              {photo.label.toUpperCase()}
            </span>
          )}
        </div>

        <div className="px-7 py-7 flex flex-col gap-5">
          <p className="text-[14px] text-site-text/75 leading-[1.7] whitespace-pre-line" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{portfolioProject.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "TIPO DE SERVIÇO", value: portfolioProject.serviceType },
              { label: "MATERIAIS", value: portfolioProject.materials },
            ].map((field) => (
              <div key={field.label} className="px-4 py-3 border border-site-text/8 bg-site-page">
                <p className="text-[10px] tracking-[2px] text-site-text/35 mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{field.label}</p>
                <p className="text-[13px] text-site-text break-words" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{field.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
