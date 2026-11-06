"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BucketImage from "./BucketImage";
import { X } from "lucide-react";
import type { PortfolioProject } from "./publicContent";

const ALL_CATEGORIES = "Todos";

// The glossary orders the category filter alphabetically.
function listCategories(projects: PortfolioProject[]): string[] {
  const categories = new Set(projects.map((project) => project.category));
  return [...categories].sort((first, second) => first.localeCompare(second, "pt-BR"));
}

interface PortfolioGalleryProps {
  title: string;
  // null when the API could not be reached.
  projects: PortfolioProject[] | null;
}

export default function PortfolioGallery({ title, projects }: PortfolioGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORIES);
  const [selectedProject, setSelectedProject] = useState<PortfolioProject | null>(null);

  const categories = listCategories(projects ?? []);
  const visibleProjects = selectedCategory === ALL_CATEGORIES
    ? projects ?? []
    : (projects ?? []).filter((project) => project.category === selectedCategory);

  return (
    <section id="portfolio" className="max-w-[1240px] mx-auto px-6 pt-20 pb-16">
      <div className="border-b border-site-text/12 pb-10 mb-10">
        <p className="text-[11px] tracking-[3px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PORTFÓLIO</p>
        <h2 className="text-[40px] text-site-text leading-[1.05] tracking-[-1px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>
          {title}
        </h2>
      </div>

      {projects === null || projects.length === 0 ? (
        <div className="py-16 px-6 text-center border border-site-text/8 bg-site-card">
          <p className="text-[18px] text-site-text mb-2" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            {projects === null ? "Não foi possível carregar o portfólio" : "Nenhum projeto publicado ainda"}
          </p>
          <p className="text-[14px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {projects === null
              ? "Tente novamente em alguns minutos."
              : "Em breve você verá aqui os trabalhos realizados pela nossa equipe."}
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-8">
            {[ALL_CATEGORIES, ...categories].map((category) => (
              <button key={category} type="button" onClick={() => setSelectedCategory(category)}
                aria-pressed={selectedCategory === category}
                className={`px-4 py-1.5 text-[11px] tracking-[1.5px] transition-all ${selectedCategory === category ? "bg-site-accent text-site-page" : "border border-site-text/15 text-site-text/55 hover:border-site-text/35"}`}
                style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>
                {category === ALL_CATEGORIES ? "TODOS OS PROJETOS" : category.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-site-text/8">
            {visibleProjects.map((project) => (
              <button key={project.showcaseItemId} type="button" onClick={() => setSelectedProject(project)}
                className="relative group overflow-hidden text-left bg-site-card">
                {/* The tinted box is the placeholder while the image loads. */}
                <div className="relative h-[220px] overflow-hidden bg-site-text/5">
                  <BucketImage src={project.imageUrl} alt={project.title} fill
                    sizes="(min-width: 1024px) 413px, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-site-page/85 to-transparent" />
                  <span className="absolute top-3 left-3 text-[10px] tracking-[2px] px-2 py-1 bg-site-page/70 text-site-text/70"
                    style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>
                    {project.category.toUpperCase()}
                  </span>
                </div>
                <div className="px-5 py-4">
                  <p className="text-[15px] text-site-text mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{project.title}</p>
                  <p className="text-[12px] text-site-text/45" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{project.serviceType}</p>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {selectedProject && (
        <PortfolioProjectDetail project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </section>
  );
}

interface ProjectPhoto {
  label: string;
  url: string;
}

// Before and after photos are optional; with neither, the cover stands in.
function listProjectPhotos(project: PortfolioProject): ProjectPhoto[] {
  const photos: ProjectPhoto[] = [];
  if (project.beforeUrl) photos.push({ label: "Antes", url: project.beforeUrl });
  if (project.afterUrl) photos.push({ label: "Depois", url: project.afterUrl });
  return photos.length > 0 ? photos : [{ label: "Capa", url: project.imageUrl }];
}

function PortfolioProjectDetail({ project, onClose }: { project: PortfolioProject; onClose: () => void }) {
  const photos = listProjectPhotos(project);
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
            <p className="text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{project.category.toUpperCase()}</p>
            <p id="project-detail-title" className="text-[17px] text-site-text mt-0.5" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{project.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar" className="text-site-text/40 hover:text-site-text/90"><X size={20} /></button>
        </div>

        <div className="relative h-[300px] flex-shrink-0 bg-site-text/5">
          <BucketImage key={photo.url} src={photo.url} alt={`${project.title}: ${photo.label.toLowerCase()}`} fill sizes="560px" className="object-cover" />
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
          <p className="text-[14px] text-site-text/75 leading-[1.7] whitespace-pre-line" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{project.description}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: "TIPO DE SERVIÇO", value: project.serviceType },
              { label: "MATERIAIS", value: project.materials },
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
