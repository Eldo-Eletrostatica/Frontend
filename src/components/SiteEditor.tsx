"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Eye, RotateCcw, Check, Palette, Image as ImageIcon, Type, CalendarDays, Upload, Plus, Trash2, Pencil, X, LayoutList } from "lucide-react";
import { ApiError } from "@/lib/api/ApiError";
import { CACHE_TAGS } from "@/lib/api/server";
import { revalidatePublicData } from "@/lib/api/revalidate";
import {
  DEFAULT_VISUAL_SETTINGS,
  type CompanyEvent,
  type PortfolioProject,
  type VisualSettings,
} from "@/components/public/publicContent";
import {
  discardVisualDraft,
  fetchVisualDraft,
  publishVisualSettings,
  restoreDefaultVisualSettings,
  updateVisualDraft,
  uploadVisualImage,
} from "@/lib/siteSettings/api";
import {
  createCompanyEvent,
  createPortfolioProject,
  deleteCompanyEvent,
  deletePortfolioCategory,
  deletePortfolioProject,
  listAdminPortfolioProjects,
  listCompanyEvents,
  listPortfolioCategories,
  renamePortfolioCategory,
  updateCompanyEvent,
  updatePortfolioProject,
  uploadShowcaseImage,
  type CompanyEventInput,
  type PortfolioProjectInput,
} from "@/lib/showcase/api";

const TABS = ["Cores", "Logotipo", "Banner", "Seções", "Portfólio", "Eventos"] as const;
type Tab = (typeof TABS)[number];

const PRESET_COLORS = [
  { name: "Ouro (padrão)", accent: "#e9b421", pageBackground: "#12100d" },
  { name: "Azul industrial", accent: "#3b82f6", pageBackground: "#0c1220" },
  { name: "Verde técnico", accent: "#22c55e", pageBackground: "#0a1a10" },
  { name: "Vermelho aço", accent: "#ef4444", pageBackground: "#1a0c0c" },
  { name: "Platina", accent: "#d4d4d4", pageBackground: "#111111" },
];

const LOAD_ERROR = "Não foi possível carregar o editor. Tente novamente.";
const SHOWCASE_ERROR = "Não foi possível carregar a vitrine. Tente novamente.";
const MIN_CATEGORIES = 4;
const MAX_CATEGORIES = 6;
const MAX_PROJECTS_PER_CATEGORY = 3;
const MIN_EVENTS = 3;
const MAX_EVENTS = 10;

type LoadState<T> =
  | { kind: "loading" }
  | { kind: "loaded"; data: T }
  | { kind: "failed"; message: string };

interface ProjectForm {
  showcaseItemId: string | null;
  title: string;
  description: string;
  category: string;
  serviceType: string;
  materials: string;
  imageUrl: string;
  beforeUrl: string;
  afterUrl: string;
}

interface EventForm {
  showcaseItemId: string | null;
  title: string;
  description: string;
  imageUrl: string;
  eventDate: string;
}

const EMPTY_PROJECT: ProjectForm = {
  showcaseItemId: null,
  title: "",
  description: "",
  category: "",
  serviceType: "",
  materials: "",
  imageUrl: "",
  beforeUrl: "",
  afterUrl: "",
};

const EMPTY_EVENT: EventForm = {
  showcaseItemId: null,
  title: "",
  description: "",
  imageUrl: "",
  eventDate: "",
};

function errorMessageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function formatDate(date: string): string {
  const [year, month, day] = date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : date;
}

export default function SiteEditor() {
  const [tab, setTab] = useState<Tab>("Cores");
  const [visualState, setVisualState] = useState<LoadState<VisualSettings>>({ kind: "loading" });
  const [draft, setDraft] = useState<VisualSettings>(DEFAULT_VISUAL_SETTINGS);
  const [savedDraft, setSavedDraft] = useState<VisualSettings>(DEFAULT_VISUAL_SETTINGS);
  const [preview, setPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");

  const [categoriesState, setCategoriesState] = useState<LoadState<string[]>>({ kind: "loading" });
  const [projectsState, setProjectsState] = useState<LoadState<PortfolioProject[]>>({ kind: "loading" });
  const [eventsState, setEventsState] = useState<LoadState<CompanyEvent[]>>({ kind: "loading" });
  const [showcaseError, setShowcaseError] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [projectForm, setProjectForm] = useState<ProjectForm | null>(null);
  const [eventForm, setEventForm] = useState<EventForm | null>(null);

  useEffect(() => {
    let isCurrent = true;
    fetchVisualDraft()
      .then((settings) => {
        if (!isCurrent) return;
        setVisualState({ kind: "loaded", data: settings });
        setDraft(settings);
        setSavedDraft(settings);
      })
      .catch((error: unknown) => {
        if (isCurrent) setVisualState({ kind: "failed", message: errorMessageOf(error, LOAD_ERROR) });
      });
    return () => {
      isCurrent = false;
    };
  }, []);

  const loadShowcase = useCallback(() => {
    setShowcaseError("");
    setCategoriesState({ kind: "loading" });
    setProjectsState({ kind: "loading" });
    setEventsState({ kind: "loading" });
    listPortfolioCategories()
      .then((categories) => setCategoriesState({ kind: "loaded", data: categories }))
      .catch((error: unknown) => setCategoriesState({ kind: "failed", message: errorMessageOf(error, SHOWCASE_ERROR) }));
    listAdminPortfolioProjects()
      .then((projects) => setProjectsState({ kind: "loaded", data: projects }))
      .catch((error: unknown) => setProjectsState({ kind: "failed", message: errorMessageOf(error, SHOWCASE_ERROR) }));
    listCompanyEvents()
      .then((events) => setEventsState({ kind: "loaded", data: events }))
      .catch((error: unknown) => setEventsState({ kind: "failed", message: errorMessageOf(error, SHOWCASE_ERROR) }));
  }, []);

  const isDirty = JSON.stringify(draft) !== JSON.stringify(savedDraft);

  // The showcase is only fetched when its tab opens, not on every visit to
  // the editor.
  function selectTab(nextTab: Tab) {
    setTab(nextTab);
    if (nextTab === "Portfólio" || nextTab === "Eventos") loadShowcase();
  }

  function updateDraft(patch: Partial<VisualSettings>) {
    setDraft((current) => ({ ...current, ...patch }));
    setMessage("");
    setActionError("");
  }

  async function uploadImage(
    file: File | undefined,
    apply: (url: string) => void,
    uploader: (file: File) => Promise<string> = uploadVisualImage,
  ) {
    if (!file) return;
    setActionError("");
    try {
      const url = await uploader(file);
      apply(url);
    } catch (error) {
      setActionError(errorMessageOf(error, "Não foi possível enviar a imagem. Use PNG, JPEG ou WebP de até 5 MB."));
    }
  }

  async function saveDraft() {
    setIsSaving(true);
    setActionError("");
    setMessage("");
    try {
      const saved = await updateVisualDraft(draft);
      setDraft(saved);
      setSavedDraft(saved);
      setMessage("Rascunho salvo. O site publicado continua igual até você publicar.");
    } catch (error) {
      setActionError(errorMessageOf(error, "Não foi possível salvar o rascunho."));
    } finally {
      setIsSaving(false);
    }
  }

  async function publish() {
    setIsSaving(true);
    setActionError("");
    setMessage("");
    try {
      await updateVisualDraft(draft);
      const published = await publishVisualSettings();
      setDraft(published);
      setSavedDraft(published);
      await revalidatePublicData(CACHE_TAGS.visualSettings).catch(() => {});
      setMessage("Alterações publicadas. O site já mostra a nova identidade visual.");
    } catch (error) {
      setActionError(errorMessageOf(error, "Não foi possível publicar as alterações."));
    } finally {
      setIsSaving(false);
    }
  }

  async function discard() {
    setIsSaving(true);
    setActionError("");
    setMessage("");
    try {
      const published = await discardVisualDraft();
      setDraft(published);
      setSavedDraft(published);
      setMessage("Rascunho descartado. A configuração publicada foi mantida.");
    } catch (error) {
      setActionError(errorMessageOf(error, "Não foi possível descartar o rascunho."));
    } finally {
      setIsSaving(false);
    }
  }

  async function restoreDefault() {
    if (!window.confirm("Restaurar a configuração visual padrão? O site e o rascunho voltam à aparência original.")) return;
    setIsSaving(true);
    setActionError("");
    setMessage("");
    try {
      const restored = await restoreDefaultVisualSettings();
      setDraft(restored);
      setSavedDraft(restored);
      await revalidatePublicData(CACHE_TAGS.visualSettings).catch(() => {});
      setMessage("Configuração padrão restaurada.");
    } catch (error) {
      setActionError(errorMessageOf(error, "Não foi possível restaurar a configuração padrão."));
    } finally {
      setIsSaving(false);
    }
  }

  // The Backend stores the category as text on each project (ADR 0005), so a
  // new category is born with its first project.
  function addCategory() {
    const name = newCategory.trim();
    if (!name) return;
    setNewCategory("");
    openProjectForm(undefined, name);
    setMessage("Crie o primeiro projeto desta categoria para publicá-la.");
  }

  async function saveCategoryRename(category: string) {
    const name = editingCategoryName.trim();
    if (!name || name === category) {
      setEditingCategory(null);
      return;
    }
    setShowcaseError("");
    try {
      await renamePortfolioCategory(category, name);
      setEditingCategory(null);
      loadShowcase();
      await revalidatePublicData(CACHE_TAGS.portfolioProjects).catch(() => {});
      setMessage("Categoria renomeada.");
    } catch (error) {
      setShowcaseError(errorMessageOf(error, "Não foi possível renomear a categoria."));
    }
  }

  async function removeCategory(category: string) {
    if (!window.confirm(`Remover a categoria "${category}"? Os projetos dela também são removidos.`)) return;
    setShowcaseError("");
    try {
      await deletePortfolioCategory(category);
      loadShowcase();
      await revalidatePublicData(CACHE_TAGS.portfolioProjects).catch(() => {});
      setMessage("Categoria removida.");
    } catch (error) {
      setShowcaseError(errorMessageOf(error, "Não foi possível remover a categoria."));
    }
  }

  function openProjectForm(project?: PortfolioProject, presetCategory?: string) {
    setActionError("");
    const categories = categoriesState.kind === "loaded" ? categoriesState.data : [];
    setProjectForm(project
      ? {
          showcaseItemId: project.showcaseItemId,
          title: project.title,
          description: project.description,
          category: project.category,
          serviceType: project.serviceType,
          materials: project.materials,
          imageUrl: project.imageUrl,
          beforeUrl: project.beforeUrl ?? "",
          afterUrl: project.afterUrl ?? "",
        }
      : { ...EMPTY_PROJECT, category: presetCategory ?? categories[0] ?? "" });
  }

  async function submitProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!projectForm) return;
    if (!projectForm.title.trim() || !projectForm.description.trim() || !projectForm.category || !projectForm.serviceType.trim() || !projectForm.materials.trim() || !projectForm.imageUrl) {
      setActionError("Preencha título, descrição, categoria, tipo de serviço, materiais e a imagem de capa.");
      return;
    }
    setIsSaving(true);
    setActionError("");
    try {
      const body: PortfolioProjectInput = {
        title: projectForm.title.trim(),
        description: projectForm.description.trim(),
        category: projectForm.category,
        serviceType: projectForm.serviceType.trim(),
        materials: projectForm.materials.trim(),
        imageUrl: projectForm.imageUrl,
        beforeUrl: projectForm.beforeUrl || null,
        afterUrl: projectForm.afterUrl || null,
      };
      if (projectForm.showcaseItemId) {
        await updatePortfolioProject(projectForm.showcaseItemId, body);
      } else {
        await createPortfolioProject(body);
      }
      setProjectForm(null);
      loadShowcase();
      await revalidatePublicData(CACHE_TAGS.portfolioProjects).catch(() => {});
      setMessage("Projeto salvo.");
    } catch (error) {
      setActionError(errorMessageOf(error, "Não foi possível salvar o projeto."));
    } finally {
      setIsSaving(false);
    }
  }

  async function removeProject(project: PortfolioProject) {
    if (!window.confirm(`Remover o projeto "${project.title}"?`)) return;
    setShowcaseError("");
    try {
      await deletePortfolioProject(project.showcaseItemId);
      loadShowcase();
      await revalidatePublicData(CACHE_TAGS.portfolioProjects).catch(() => {});
      setMessage("Projeto removido.");
    } catch (error) {
      setShowcaseError(errorMessageOf(error, "Não foi possível remover o projeto."));
    }
  }

  function openEventForm(event?: CompanyEvent) {
    setActionError("");
    setEventForm(event
      ? {
          showcaseItemId: event.showcaseItemId,
          title: event.title,
          description: event.description,
          imageUrl: event.imageUrl,
          eventDate: event.eventDate,
        }
      : EMPTY_EVENT);
  }

  async function submitEvent(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (!eventForm) return;
    if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.imageUrl || !eventForm.eventDate) {
      setActionError("Preencha título, descrição, data e imagem do evento.");
      return;
    }
    setIsSaving(true);
    setActionError("");
    try {
      const body: CompanyEventInput = {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        imageUrl: eventForm.imageUrl,
        eventDate: eventForm.eventDate,
      };
      if (eventForm.showcaseItemId) {
        await updateCompanyEvent(eventForm.showcaseItemId, body);
      } else {
        await createCompanyEvent(body);
      }
      setEventForm(null);
      loadShowcase();
      await revalidatePublicData(CACHE_TAGS.companyEvents).catch(() => {});
      setMessage("Evento salvo.");
    } catch (error) {
      setActionError(errorMessageOf(error, "Não foi possível salvar o evento."));
    } finally {
      setIsSaving(false);
    }
  }

  async function removeEvent(event: CompanyEvent) {
    if (!window.confirm(`Remover o evento "${event.title}"?`)) return;
    setShowcaseError("");
    try {
      await deleteCompanyEvent(event.showcaseItemId);
      loadShowcase();
      await revalidatePublicData(CACHE_TAGS.companyEvents).catch(() => {});
      setMessage("Evento removido.");
    } catch (error) {
      setShowcaseError(errorMessageOf(error, "Não foi possível remover o evento."));
    }
  }

  const categories = categoriesState.kind === "loaded" ? categoriesState.data : [];
  const projects = projectsState.kind === "loaded" ? projectsState.data : [];
  const events = eventsState.kind === "loaded" ? eventsState.data : [];
  const projectsPerCategory = new Map(categories.map((category) => [category, projects.filter((project) => project.category === category).length]));

  if (visualState.kind === "loading") {
    return <p className="py-16 text-center text-[14px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Carregando editor...</p>;
  }
  if (visualState.kind === "failed") {
    return <p role="alert" className="py-16 text-center text-[14px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{visualState.message}</p>;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONFIGURAÇÕES VISUAIS</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Editor do Site</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setPreview(!preview)}
            className={`flex items-center gap-2 px-4 py-2.5 border text-[13px] transition-colors ${preview ? "border-[#e9b421] text-[#e9b421]" : "border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)]"}`}
            style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <Eye size={14} /> {preview ? "Fechar prévia" : "Pré-visualizar"}
          </button>
          <button onClick={discard} disabled={isSaving} className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.55)] text-[13px] hover:border-[rgba(245,242,236,0.35)] disabled:opacity-40" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <X size={13} /> Descartar rascunho
          </button>
          <button onClick={restoreDefault} disabled={isSaving} className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.55)] text-[13px] hover:border-[rgba(245,242,236,0.35)] disabled:opacity-40" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <RotateCcw size={13} /> Restaurar padrão
          </button>
          <button onClick={saveDraft} disabled={!isDirty || isSaving}
            className={`flex items-center gap-2 px-4 py-2.5 border text-[13px] ${isDirty && !isSaving ? "border-[#e9b421] text-[#e9b421] hover:bg-[rgba(233,180,33,0.08)]" : "border-[rgba(245,242,236,0.12)] text-[rgba(245,242,236,0.3)] cursor-not-allowed"}`}
            style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            Salvar rascunho
          </button>
          <button onClick={publish} disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#e9b421] text-[#12100d] text-[13px] hover:opacity-90 disabled:opacity-50"
            style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            <Check size={14} /> {isSaving ? "Salvando..." : "Publicar alterações"}
          </button>
        </div>
      </div>

      {message && (
        <div className="flex items-center gap-3 px-5 py-3 mb-6 border border-emerald-500/30 bg-emerald-500/5">
          <Check size={14} className="text-emerald-400" />
          <p className="text-[13px] text-emerald-400" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>{message}</p>
        </div>
      )}
      {actionError && <p role="alert" className="mb-6 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{actionError}</p>}
      {showcaseError && <p role="alert" className="mb-6 px-4 py-3 border border-red-500/40 text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{showcaseError}</p>}
      {isDirty && (
        <p className="mb-6 text-[12px] text-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          Há alterações não salvas no rascunho. Salve ou publique para aplicá-las.
        </p>
      )}

      <div className={`grid ${preview ? "xl:grid-cols-2" : ""} gap-8`}>
        <div>
          {/* Tabs */}
          <div className="flex flex-wrap border-b border-[rgba(245,242,236,0.1)] mb-6">
            {TABS.map((option) => (
              <button key={option} onClick={() => selectTab(option)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] border-b-2 transition-all ${tab === option ? "border-[#e9b421] text-[#e9b421]" : "border-transparent text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.8)]"}`}
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                {option === "Cores" && <Palette size={13} />}
                {option === "Logotipo" && <Type size={13} />}
                {option === "Banner" && <ImageIcon size={13} />}
                {option === "Seções" && <LayoutList size={13} />}
                {option === "Portfólio" && <ImageIcon size={13} />}
                {option === "Eventos" && <CalendarDays size={13} />}
                {option}
              </button>
            ))}
          </div>

          {tab === "Cores" && (
            <div className="flex flex-col gap-8">
              <div>
                <SectionLabel>TEMAS PREDEFINIDOS</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {PRESET_COLORS.map((preset) => (
                    <button key={preset.name}
                      onClick={() => updateDraft({ colors: { ...draft.colors, accent: preset.accent, pageBackground: preset.pageBackground } })}
                      className={`flex items-center gap-3 px-3 py-3 border transition-all text-left ${draft.colors.accent === preset.accent && draft.colors.pageBackground === preset.pageBackground ? "border-[#e9b421]" : "border-[rgba(245,242,236,0.12)] hover:border-[rgba(245,242,236,0.3)]"}`}>
                      <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: preset.accent }} />
                      <span className="text-[12px] text-[rgba(245,242,236,0.7)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-5">
                {([
                  ["COR DE DESTAQUE", "accent"],
                  ["FUNDO DA PÁGINA", "pageBackground"],
                  ["FUNDO DOS CARDS", "cardBackground"],
                  ["COR DO TEXTO", "text"],
                ] as const).map(([label, key]) => (
                  <ColorField key={key} label={label} value={draft.colors[key]}
                    onChange={(value) => updateDraft({ colors: { ...draft.colors, [key]: value } })} />
                ))}
              </div>
            </div>
          )}

          {tab === "Logotipo" && (
            <EditorGroup title="IDENTIDADE NO CABEÇALHO">
              <TextEditor label="TEXTO DO LOGOTIPO" value={draft.logo.text} maxLength={20}
                onChange={(text) => updateDraft({ logo: { ...draft.logo, text } })} />
              <ImageField label="IMAGEM DO LOGOTIPO (OPCIONAL)" value={draft.logo.imageUrl}
                onChange={(imageUrl) => updateDraft({ logo: { ...draft.logo, imageUrl } })}
                onUpload={(file) => uploadImage(file, (url) => updateDraft({ logo: { ...draft.logo, imageUrl: url } }))} />
              <p className="text-[12px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                Sem imagem, o site usa o logotipo da Eldo que já vem no Frontend.
              </p>
            </EditorGroup>
          )}

          {tab === "Banner" && (
            <EditorGroup title="DESTAQUE DA PÁGINA INICIAL">
              <TextEditor label="CHAMADA SUPERIOR" value={draft.banner.eyebrow} maxLength={40}
                onChange={(eyebrow) => updateDraft({ banner: { ...draft.banner, eyebrow } })} />
              <div className="grid sm:grid-cols-2 gap-4">
                <TextEditor label="TÍTULO" value={draft.banner.title} maxLength={60}
                  onChange={(title) => updateDraft({ banner: { ...draft.banner, title } })} />
                <TextEditor label="TEXTO EM DESTAQUE" value={draft.banner.highlight} maxLength={40}
                  onChange={(highlight) => updateDraft({ banner: { ...draft.banner, highlight } })} />
              </div>
              <TextEditor multiline label="DESCRIÇÃO" value={draft.banner.description} maxLength={300}
                onChange={(description) => updateDraft({ banner: { ...draft.banner, description } })} />
              <ImageField label="IMAGEM DO BANNER (OPCIONAL)" value={draft.banner.imageUrl}
                onChange={(imageUrl) => updateDraft({ banner: { ...draft.banner, imageUrl } })}
                onUpload={(file) => uploadImage(file, (url) => updateDraft({ banner: { ...draft.banner, imageUrl: url } }))} />
            </EditorGroup>
          )}

          {tab === "Seções" && (
            <div className="flex flex-col gap-6">
              <EditorGroup title="TÍTULOS DAS SEÇÕES DA PÁGINA INICIAL">
                <TextEditor label="PORTFÓLIO" value={draft.sectionTitles.portfolio} maxLength={60}
                  onChange={(portfolio) => updateDraft({ sectionTitles: { ...draft.sectionTitles, portfolio } })} />
                <TextEditor label="AVALIAÇÕES" value={draft.sectionTitles.reviews} maxLength={60}
                  onChange={(reviews) => updateDraft({ sectionTitles: { ...draft.sectionTitles, reviews } })} />
                <TextEditor label="CONTATO" value={draft.sectionTitles.contact} maxLength={60}
                  onChange={(contact) => updateDraft({ sectionTitles: { ...draft.sectionTitles, contact } })} />
              </EditorGroup>
              <EditorGroup title="CABEÇALHO DA PÁGINA DE EVENTOS">
                <TextEditor label="CHAMADA SUPERIOR" value={draft.eventsHeader.eyebrow} maxLength={40}
                  onChange={(eyebrow) => updateDraft({ eventsHeader: { ...draft.eventsHeader, eyebrow } })} />
                <TextEditor label="TÍTULO" value={draft.eventsHeader.title} maxLength={60}
                  onChange={(title) => updateDraft({ eventsHeader: { ...draft.eventsHeader, title } })} />
                <TextEditor multiline label="DESCRIÇÃO" value={draft.eventsHeader.description} maxLength={300}
                  onChange={(description) => updateDraft({ eventsHeader: { ...draft.eventsHeader, description } })} />
              </EditorGroup>
            </div>
          )}

          {tab === "Portfólio" && (
            <div className="flex flex-col gap-8">
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <SectionLabel>CATEGORIAS ({categories.length}/{MAX_CATEGORIES})</SectionLabel>
                    <p className="text-[12px] text-[rgba(245,242,236,0.38)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                      Só texto, entre {MIN_CATEGORIES} e {MAX_CATEGORIES}. Cada categoria aceita de 1 a {MAX_PROJECTS_PER_CATEGORY} projetos.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <input type="text" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder="Nome da nova categoria" className="flex-1 h-[42px] px-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                  <button onClick={addCategory} disabled={categories.length >= MAX_CATEGORIES} className="h-[42px] px-4 border border-[rgba(245,242,236,0.18)] text-[12px] text-[rgba(245,242,236,0.7)] hover:border-[#e9b421] hover:text-[#e9b421] disabled:opacity-30" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Criar com projeto</button>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {categories.map((category) => (
                    <div key={category} className="p-4 border border-[rgba(245,242,236,0.1)] bg-[rgba(23,21,17,0.45)]">
                      <div className="flex items-center gap-2">
                        {editingCategory === category ? (
                          <>
                            <input autoFocus type="text" value={editingCategoryName} onChange={(event) => setEditingCategoryName(event.target.value)} className="flex-1 h-[38px] px-3 bg-[#12100d] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                            <button onClick={() => saveCategoryRename(category)} className="text-emerald-400 hover:opacity-80" title="Salvar"><Check size={16} /></button>
                            <button onClick={() => setEditingCategory(null)} className="text-[rgba(245,242,236,0.4)] hover:text-[#f5f2ec]" title="Cancelar"><X size={16} /></button>
                          </>
                        ) : (
                          <>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] text-[#f5f2ec] truncate" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{category}</p>
                              <p className="text-[11px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{projectsPerCategory.get(category) ?? 0}/{MAX_PROJECTS_PER_CATEGORY} projetos</p>
                            </div>
                            <button onClick={() => { setEditingCategory(category); setEditingCategoryName(category); }} className="text-[rgba(245,242,236,0.4)] hover:text-[#e9b421]" title="Renomear"><Pencil size={14} /></button>
                            <button onClick={() => removeCategory(category)} className="text-[rgba(245,242,236,0.4)] hover:text-red-400" title="Remover"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <SectionLabel>PROJETOS ({projects.length})</SectionLabel>
                    <p className="text-[12px] text-[rgba(245,242,236,0.38)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                      Imagem de capa e categoria obrigatórias; fotos de antes e depois são opcionais. O mais novo aparece primeiro.
                    </p>
                  </div>
                  <button onClick={() => openProjectForm()} disabled={categories.length === 0} className="flex items-center gap-2 h-[38px] px-4 border border-[rgba(245,242,236,0.18)] text-[12px] text-[rgba(245,242,236,0.7)] hover:border-[#e9b421] hover:text-[#e9b421] disabled:opacity-30" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                    <Plus size={13} /> Novo projeto
                  </button>
                </div>
                {projectsState.kind === "loading" ? <Loading /> : projectsState.kind === "failed" ? <ErrorBox message={projectsState.message} /> : (
                  <div className="grid md:grid-cols-2 gap-4 mt-4">
                    {projects.map((project) => (
                      <div key={project.showcaseItemId} className="border border-[rgba(245,242,236,0.1)] bg-[rgba(23,21,17,0.45)] overflow-hidden">
                        <ImagePreview src={project.imageUrl} alt={project.title} />
                        <div className="p-4">
                          <p className="text-[10px] tracking-[1.5px] text-[#e9b421] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{project.category.toUpperCase()}</p>
                          <p className="text-[15px] text-[#f5f2ec] mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{project.title}</p>
                          <p className="text-[12px] text-[rgba(245,242,236,0.45)] line-clamp-2" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{project.description}</p>
                          <div className="flex items-center gap-3 mt-3">
                            <button onClick={() => openProjectForm(project)} className="flex items-center gap-1 text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.55)] hover:text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}><Pencil size={12} /> EDITAR</button>
                            <button onClick={() => removeProject(project)} className="flex items-center gap-1 text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.55)] hover:text-red-400" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}><Trash2 size={12} /> REMOVER</button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {projects.length === 0 && <p className="md:col-span-2 py-10 text-center text-[13px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Nenhum projeto cadastrado.</p>}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "Eventos" && (
            <div>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <SectionLabel>EVENTOS ({events.length}/{MAX_EVENTS})</SectionLabel>
                  <p className="text-[12px] text-[rgba(245,242,236,0.38)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
                    Entre {MIN_EVENTS} e {MAX_EVENTS} eventos, com imagem e data. O mais novo aparece primeiro no painel.
                  </p>
                </div>
                <button onClick={() => openEventForm()} disabled={events.length >= MAX_EVENTS} className="flex items-center gap-2 h-[38px] px-4 border border-[rgba(245,242,236,0.18)] text-[12px] text-[rgba(245,242,236,0.7)] hover:border-[#e9b421] hover:text-[#e9b421] disabled:opacity-30" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                  <Plus size={13} /> Novo evento
                </button>
              </div>
              {eventsState.kind === "loading" ? <Loading /> : eventsState.kind === "failed" ? <ErrorBox message={eventsState.message} /> : (
                <div className="grid md:grid-cols-2 gap-4 mt-4">
                  {events.map((event) => (
                    <div key={event.showcaseItemId} className="border border-[rgba(245,242,236,0.1)] bg-[rgba(23,21,17,0.45)] overflow-hidden">
                      <ImagePreview src={event.imageUrl} alt={event.title} />
                      <div className="p-4">
                        <p className="text-[10px] tracking-[1.5px] text-[#e9b421] mb-1" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{formatDate(event.eventDate)}</p>
                        <p className="text-[15px] text-[#f5f2ec] mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{event.title}</p>
                        <p className="text-[12px] text-[rgba(245,242,236,0.45)] line-clamp-2" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{event.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => openEventForm(event)} className="flex items-center gap-1 text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.55)] hover:text-[#e9b421]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}><Pencil size={12} /> EDITAR</button>
                          <button onClick={() => removeEvent(event)} className="flex items-center gap-1 text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.55)] hover:text-red-400" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}><Trash2 size={12} /> REMOVER</button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {events.length === 0 && <p className="md:col-span-2 py-10 text-center text-[13px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Nenhum evento cadastrado.</p>}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Preview panel */}
        {preview && (
          <div className="border border-[rgba(245,242,236,0.12)] h-fit xl:sticky xl:top-6">
            <div className="px-4 py-2 border-b border-[rgba(245,242,236,0.08)] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[rgba(245,242,236,0.2)]" />
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PRÉ-VISUALIZAÇÃO DO RASCUNHO</p>
            </div>
            <div style={{ background: draft.colors.pageBackground }}>
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(245,242,236,0.08)" }}>
                <div className="flex items-center gap-3">
                  {draft.logo.imageUrl ? (
                    <img src={draft.logo.imageUrl} alt={draft.logo.text} className="w-[30px] h-[30px] object-contain" />
                  ) : (
                    <div className="w-[30px] h-[30px] rounded-full border flex items-center justify-center" style={{ borderColor: draft.colors.accent }}>
                      <span className="text-[13px]" style={{ color: draft.colors.accent, fontFamily: "'Poppins:Bold', sans-serif" }}>{draft.logo.text[0]}</span>
                    </div>
                  )}
                  <p className="text-[12px] tracking-[2px]" style={{ color: draft.colors.text, fontFamily: "'Poppins:Bold', sans-serif" }}>{draft.logo.text}</p>
                </div>
                <div className="h-[32px] px-4 rounded-full flex items-center text-[12px]" style={{ background: draft.colors.accent, color: draft.colors.pageBackground, fontFamily: "'Poppins:Bold', sans-serif" }}>
                  Pedir orçamento
                </div>
              </div>
              <div className="px-6 py-10">
                <p className="text-[10px] tracking-[3px] mb-3" style={{ color: draft.colors.accent, fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{draft.banner.eyebrow}</p>
                <p className="text-[22px] leading-[1.2] tracking-[-0.44px] mb-1" style={{ color: draft.colors.text, fontFamily: "'Poppins:Bold', sans-serif" }}>{draft.banner.title}</p>
                <p className="text-[22px] leading-[1.2] tracking-[-0.44px] mb-4" style={{ color: draft.colors.accent, fontFamily: "'Poppins:Bold', sans-serif" }}>{draft.banner.highlight}</p>
                <p className="text-[13px] leading-[1.7] opacity-70" style={{ color: draft.colors.text, fontFamily: "'Barlow:Regular', sans-serif" }}>{draft.banner.description}</p>
                <div className="mt-8 p-5 border" style={{ background: draft.colors.cardBackground, borderColor: "rgba(245,242,236,0.08)" }}>
                  <p className="text-[10px] tracking-[2px] mb-2" style={{ color: draft.colors.accent, fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{draft.sectionTitles.portfolio.toUpperCase()}</p>
                  <p className="text-[15px]" style={{ color: draft.colors.text, fontFamily: "'Poppins:SemiBold', sans-serif" }}>Portão duplo em ferro forjado</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Project modal */}
      {projectForm && createPortal(
        <Drawer title={projectForm.showcaseItemId ? "Editar projeto" : "Novo projeto"} onClose={() => setProjectForm(null)}>
          <form onSubmit={submitProject} className="flex flex-col gap-5">
            <TextEditor label="TÍTULO" value={projectForm.title} maxLength={150} onChange={(title) => setProjectForm({ ...projectForm, title })} />
            <TextEditor multiline label="DESCRIÇÃO" value={projectForm.description} onChange={(description) => setProjectForm({ ...projectForm, description })} />
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-2">
                <SectionLabel>CATEGORIA</SectionLabel>
                <input type="text" list="project-categories" value={projectForm.category} onChange={(event) => setProjectForm({ ...projectForm, category: event.target.value })} className="drw-inp" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
                <datalist id="project-categories">
                  {categories.map((category) => <option key={category} value={category} />)}
                </datalist>
              </label>
              <TextEditor label="TIPO DE SERVIÇO" value={projectForm.serviceType} maxLength={150} onChange={(serviceType) => setProjectForm({ ...projectForm, serviceType })} />
            </div>
            <TextEditor label="MATERIAIS" value={projectForm.materials} maxLength={255} onChange={(materials) => setProjectForm({ ...projectForm, materials })} />
            <ImageField label="IMAGEM DE CAPA *" value={projectForm.imageUrl} required
              onChange={(imageUrl) => setProjectForm({ ...projectForm, imageUrl: imageUrl ?? "" })}
              onUpload={(file) => uploadImage(file, (url) => setProjectForm({ ...projectForm, imageUrl: url }), uploadShowcaseImage)} />
            <div className="grid grid-cols-2 gap-4">
              <ImageField label="FOTO ANTES (OPCIONAL)" value={projectForm.beforeUrl}
                onChange={(beforeUrl) => setProjectForm({ ...projectForm, beforeUrl: beforeUrl ?? "" })}
                onUpload={(file) => uploadImage(file, (url) => setProjectForm({ ...projectForm, beforeUrl: url }), uploadShowcaseImage)} />
              <ImageField label="FOTO DEPOIS (OPCIONAL)" value={projectForm.afterUrl}
                onChange={(afterUrl) => setProjectForm({ ...projectForm, afterUrl: afterUrl ?? "" })}
                onUpload={(file) => uploadImage(file, (url) => setProjectForm({ ...projectForm, afterUrl: url }), uploadShowcaseImage)} />
            </div>
            {actionError && <p role="alert" className="text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{actionError}</p>}
            <FormActions isSaving={isSaving} onCancel={() => setProjectForm(null)} confirmLabel="Salvar projeto" />
          </form>
        </Drawer>,
        document.body
      )}

      {/* Event modal */}
      {eventForm && createPortal(
        <Drawer title={eventForm.showcaseItemId ? "Editar evento" : "Novo evento"} onClose={() => setEventForm(null)}>
          <form onSubmit={submitEvent} className="flex flex-col gap-5">
            <TextEditor label="TÍTULO" value={eventForm.title} maxLength={150} onChange={(title) => setEventForm({ ...eventForm, title })} />
            <TextEditor multiline label="DESCRIÇÃO" value={eventForm.description} onChange={(description) => setEventForm({ ...eventForm, description })} />
            <label className="flex flex-col gap-2">
              <SectionLabel>DATA DO EVENTO *</SectionLabel>
              <input type="date" required value={eventForm.eventDate} onChange={(event) => setEventForm({ ...eventForm, eventDate: event.target.value })} className="drw-inp [color-scheme:dark]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
            </label>
            <ImageField label="IMAGEM DO EVENTO *" value={eventForm.imageUrl} required
              onChange={(imageUrl) => setEventForm({ ...eventForm, imageUrl: imageUrl ?? "" })}
              onUpload={(file) => uploadImage(file, (url) => setEventForm({ ...eventForm, imageUrl: url }), uploadShowcaseImage)} />
            {actionError && <p role="alert" className="text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{actionError}</p>}
            <FormActions isSaving={isSaving} onCancel={() => setEventForm(null)} confirmLabel="Salvar evento" />
          </form>
        </Drawer>,
        document.body
      )}

      <style>{`.drw-inp { width:100%; height:46px; padding:0 14px; background:#12100d; border:1px solid rgba(245,242,236,0.18); color:#f5f2ec; font-size:14px; outline:none; transition:border-color .15s; } .drw-inp:focus { border-color:#e9b421; } .drw-inp option { background:#1a1713; }`}</style>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{children}</p>;
}

function EditorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 border border-[rgba(245,242,236,0.1)] bg-[rgba(23,21,17,0.45)]">
      <p className="text-[11px] tracking-[2px] text-[#e9b421] mb-5" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{title}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function TextEditor({ label, value, onChange, multiline = false, maxLength }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean; maxLength?: number }) {
  const className = "mt-2 w-full px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors";
  return (
    <label>
      <SectionLabel>{label}</SectionLabel>
      {multiline ? (
        <textarea rows={3} value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className={`${className} py-3 resize-y`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
      ) : (
        <input type="text" value={value} maxLength={maxLength} onChange={(event) => onChange(event.target.value)} className={`${className} h-[44px]`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
      )}
    </label>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="flex items-center gap-3 mt-2">
        <div className="relative w-[44px] h-[44px] flex-shrink-0 border border-[rgba(245,242,236,0.15)]">
          <div className="absolute inset-0" style={{ background: value }} />
          <input type="color" value={value} onChange={(event) => onChange(event.target.value)} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
        </div>
        <input type="text" value={value} maxLength={7} onChange={(event) => onChange(event.target.value)} className="flex-1 h-[44px] px-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421]" style={{ fontFamily: "monospace" }} />
      </div>
    </div>
  );
}

function ImageField({ label, value, onChange, onUpload, required = false }: { label: string; value: string | null; onChange: (value: string | null) => void; onUpload: (file?: File) => void; required?: boolean }) {
  return (
    <div>
      <SectionLabel>{label}{required ? " *" : ""}</SectionLabel>
      {value && <ImagePreview src={value} alt={label} />}
      <div className="flex mt-2">
        <input type="text" value={value ?? ""} onChange={(event) => onChange(event.target.value || null)} className="min-w-0 flex-1 h-[42px] px-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[12px] outline-none focus:border-[#e9b421]" placeholder="URL devolvida pelo upload" />
        <label className="h-[42px] px-4 border border-l-0 border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)] flex items-center gap-2 cursor-pointer hover:text-[#e9b421]">
          <Upload size={13} />
          <span className="text-[11px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Enviar</span>
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => onUpload(event.target.files?.[0])} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange(null)} className="h-[42px] px-3 border border-l-0 border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.45)] hover:text-red-400" title="Remover imagem">
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

function ImagePreview({ src, alt }: { src: string; alt: string }) {
  return <img src={src} alt={alt} className="mt-2 w-full h-[140px] object-cover border border-[rgba(245,242,236,0.1)]" />;
}

function FormActions({ isSaving, onCancel, confirmLabel }: { isSaving: boolean; onCancel: () => void; confirmLabel: string }) {
  return (
    <div className="flex gap-3 mt-3">
      <button type="button" onClick={onCancel} className="flex-1 h-[48px] border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.6)] text-[13px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Cancelar</button>
      <button type="submit" disabled={isSaving} className="flex-1 h-[48px] bg-[#e9b421] text-[#12100d] text-[13px] disabled:opacity-50" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>{isSaving ? "Salvando..." : confirmLabel}</button>
    </div>
  );
}

function Drawer({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      <aside className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-[560px] border-l border-[rgba(245,242,236,0.12)]" style={{ background: "#171511" }}>
        <div className="flex items-center justify-between px-8 py-6 border-b border-[rgba(245,242,236,0.08)]">
          <h2 className="text-[20px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{title}</h2>
          <button onClick={onClose} className="text-[rgba(245,242,236,0.35)] hover:text-[rgba(245,242,236,0.9)] transition-colors"><X size={20} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-8 py-8">{children}</div>
      </aside>
    </>
  );
}

function Loading() {
  return <p className="py-10 text-center text-[13px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Carregando...</p>;
}

function ErrorBox({ message }: { message: string }) {
  return <p role="alert" className="py-8 text-center text-[13px] text-red-300" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{message}</p>;
}
