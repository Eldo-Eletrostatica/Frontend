import { useState } from "react";
import { Eye, RotateCcw, Check, Palette, Image as ImageIcon, Type, CalendarDays, SlidersHorizontal, Upload, Plus, Trash2 } from "lucide-react";
import { DEFAULT_SITE_CONTENT, useSiteContent, type SiteContent } from "../lib/siteContentContext";

interface Theme {
  primary: string;
  background: string;
  surface: string;
  text: string;
  logoText: string;
  bannerTitle: string;
  bannerSub: string;
}

const DEFAULT_THEME: Theme = {
  primary: "#e9b421",
  background: "#12100d",
  surface: "#171511",
  text: "#f5f2ec",
  logoText: "ELDO",
  bannerTitle: "Pintura eletrostática de alta performance",
  bannerSub: "Estruturas metálicas, portões e máquinas industriais. Pré-tratamento completo e cura térmica controlada.",
};

const PRESET_COLORS = [
  { name: "Ouro (padrão)", primary: "#e9b421", background: "#12100d" },
  { name: "Azul industrial", primary: "#3b82f6", background: "#0c1220" },
  { name: "Verde técnico",   primary: "#22c55e", background: "#0a1a10" },
  { name: "Vermelho aço",    primary: "#ef4444", background: "#1a0c0c" },
  { name: "Platina",         primary: "#d4d4d4", background: "#111111" },
];

const TABS = ["Cores", "Tipografia", "Banner", "Página inicial", "Eventos", "Orçamento"] as const;
type Tab = typeof TABS[number];

export default function SiteEditor() {
  const { content, setContent } = useSiteContent();
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);
  const [draft, setDraft] = useState<Theme>(DEFAULT_THEME);
  const [contentDraft, setContentDraft] = useState<SiteContent>(content);
  const [tab, setTab] = useState<Tab>("Cores");
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const hasChanges = JSON.stringify(theme) !== JSON.stringify(draft) || JSON.stringify(content) !== JSON.stringify(contentDraft);
  const categoryCounts = Object.fromEntries(contentDraft.landing.categories.map((category) => [
    category.id,
    contentDraft.landing.projects.filter((project) => project.categoryId === category.id).length,
  ])) as Record<number, number>;
  const categoriesValid = contentDraft.landing.categories.length >= 4
    && contentDraft.landing.categories.length <= 6
    && contentDraft.landing.categories.every((category) => category.title.trim());
  const projectsValid = contentDraft.landing.projects.every((project) =>
    project.title.trim() && project.beforeImg.trim() && project.afterImg.trim()
  ) && contentDraft.landing.categories.every((category) => categoryCounts[category.id] >= 1 && categoryCounts[category.id] <= 3);
  const eventsValid = contentDraft.events.items.length >= 3 && contentDraft.events.items.length <= 10
    && contentDraft.events.items.every((event) => event.title.trim() && event.img.trim());
  const contentValid = categoriesValid && projectsValid && eventsValid;

  function applyPreset(p: typeof PRESET_COLORS[0]) {
    setDraft({ ...draft, primary: p.primary, background: p.background });
  }

  function publish() {
    if (!contentValid) return;
    setTheme(draft);
    setContent(contentDraft);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function restore() {
    setDraft(DEFAULT_THEME);
    setTheme(DEFAULT_THEME);
    setContentDraft(DEFAULT_SITE_CONTENT);
    setContent(DEFAULT_SITE_CONTENT);
  }

  function readImage(file: File | undefined, onLoad: (value: string) => void) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = () => onLoad(String(reader.result));
    reader.readAsDataURL(file);
  }

  function addCategory() {
    if (contentDraft.landing.categories.length >= 6) return;
    const id = Math.max(0, ...contentDraft.landing.categories.map((category) => category.id)) + 1;
    setContentDraft({
      ...contentDraft,
      landing: {
        ...contentDraft.landing,
        categories: [{ id, title: "Nova categoria" }, ...contentDraft.landing.categories],
      },
    });
  }

  function removeCategory(id: number) {
    if (contentDraft.landing.categories.length <= 4 || categoryCounts[id] > 0) return;
    setContentDraft({
      ...contentDraft,
      landing: {
        ...contentDraft.landing,
        categories: contentDraft.landing.categories.filter((category) => category.id !== id),
      },
    });
  }

  function addProject() {
    const category = contentDraft.landing.categories.find((item) => categoryCounts[item.id] === 0)
      ?? contentDraft.landing.categories.find((item) => categoryCounts[item.id] < 3);
    if (!category) return;
    const id = Math.max(0, ...contentDraft.landing.projects.map((project) => project.id)) + 1;
    setContentDraft({
      ...contentDraft,
      landing: {
        ...contentDraft.landing,
        projects: [{
          id,
          title: "Novo projeto",
          categoryId: category.id,
          material: "",
          finish: "",
          color: "",
          deadline: "",
          description: "",
          beforeImg: "",
          afterImg: "",
          tags: [],
        }, ...contentDraft.landing.projects],
      },
    });
  }

  function removeProject(id: number) {
    const project = contentDraft.landing.projects.find((item) => item.id === id);
    if (!project || (categoryCounts[project.categoryId] <= 1 && contentDraft.landing.categories.length <= 4)) return;
    setContentDraft({
      ...contentDraft,
      landing: {
        ...contentDraft.landing,
        projects: contentDraft.landing.projects.filter((item) => item.id !== id),
      },
    });
  }

  function changeProjectCategory(id: number, categoryId: number) {
    const project = contentDraft.landing.projects.find((item) => item.id === id);
    if (!project || project.categoryId === categoryId) return;
    if ((categoryCounts[project.categoryId] <= 1 && contentDraft.landing.categories.length <= 4) || categoryCounts[categoryId] >= 3) return;
    updateProject(contentDraft, setContentDraft, id, { categoryId });
  }

  function addEvent() {
    if (contentDraft.events.items.length >= 10) return;
    const id = Math.max(0, ...contentDraft.events.items.map((event) => event.id)) + 1;
    setContentDraft({
      ...contentDraft,
      events: {
        ...contentDraft.events,
        items: [{
          id,
          year: String(new Date().getFullYear()),
          month: "MÊS",
          tag: "CATEGORIA",
          title: "Novo evento",
          description: "",
          img: "",
        }, ...contentDraft.events.items],
      },
    });
  }

  function removeEvent(id: number) {
    if (contentDraft.events.items.length <= 3) return;
    setContentDraft({
      ...contentDraft,
      events: {
        ...contentDraft.events,
        items: contentDraft.events.items.filter((event) => event.id !== id),
      },
    });
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-[12px] tracking-[2.5px] text-[#e9b421] mb-2" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CONFIGURAÇÕES VISUAIS</p>
          <h1 className="text-[32px] text-[#f5f2ec] leading-[1.2] tracking-[-0.64px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Editor do Site</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setPreview(!preview)}
            className={`flex items-center gap-2 px-4 py-2.5 border text-[13px] transition-colors ${preview ? "border-[#e9b421] text-[#e9b421]" : "border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)]"}`}
            style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <Eye size={14} /> Pré-visualizar
          </button>
          <button onClick={restore} className="flex items-center gap-2 px-4 py-2.5 border border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.55)] text-[13px] hover:border-[rgba(245,242,236,0.35)] transition-colors" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
            <RotateCcw size={13} /> Restaurar padrão
          </button>
          <button onClick={publish} disabled={!hasChanges || !contentValid}
            className={`flex items-center gap-2 px-5 py-2.5 text-[13px] transition-all ${hasChanges && contentValid ? "bg-[#e9b421] text-[#12100d] hover:opacity-90" : "bg-[rgba(245,242,236,0.08)] text-[rgba(245,242,236,0.3)] cursor-not-allowed"}`}
            style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            {saved ? <><Check size={14} /> Publicado</> : "Publicar alterações"}
          </button>
        </div>
      </div>

      {saved && (
        <div className="flex items-center gap-3 px-5 py-3 mb-6 border border-emerald-500/30 bg-emerald-500/5">
          <Check size={14} className="text-emerald-400" />
          <p className="text-[13px] text-emerald-400" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Alterações publicadas com sucesso.</p>
        </div>
      )}
      {!contentValid && (
        <div className="px-5 py-3 mb-6 border border-amber-400/30 bg-amber-400/5">
          <p className="text-[13px] text-amber-300" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Mantenha entre 4 e 6 categorias, com nomes preenchidos e 1 a 3 projetos em cada uma. As imagens dos projetos e eventos são obrigatórias.</p>
        </div>
      )}

      <div className={`grid ${preview ? "lg:grid-cols-2" : ""} gap-8`}>
        {/* Editor panel */}
        <div>
          {/* Tabs */}
          <div className="flex border-b border-[rgba(245,242,236,0.1)] mb-6">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-2 px-5 py-3 text-[13px] border-b-2 transition-all ${tab === t ? "border-[#e9b421] text-[#e9b421]" : "border-transparent text-[rgba(245,242,236,0.5)] hover:text-[rgba(245,242,236,0.8)]"}`}
                style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>
                {t === "Cores" && <Palette size={13} />}
                {t === "Tipografia" && <Type size={13} />}
                {t === "Banner" && <ImageIcon size={13} />}
                {t === "Página inicial" && <ImageIcon size={13} />}
                {t === "Eventos" && <CalendarDays size={13} />}
                {t === "Orçamento" && <SlidersHorizontal size={13} />}
                {t}
              </button>
            ))}
          </div>

          {tab === "Cores" && (
            <div className="flex flex-col gap-8">
              {/* Presets */}
              <div>
                <SectionLabel>TEMAS PREDEFINIDOS</SectionLabel>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                  {PRESET_COLORS.map((p) => (
                    <button key={p.name} onClick={() => applyPreset(p)}
                      className={`flex items-center gap-3 px-3 py-3 border transition-all text-left ${draft.primary === p.primary && draft.background === p.background ? "border-[#e9b421]" : "border-[rgba(245,242,236,0.12)] hover:border-[rgba(245,242,236,0.3)]"}`}>
                      <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: p.primary }} />
                      <span className="text-[12px] text-[rgba(245,242,236,0.7)]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom colors */}
              <div className="grid grid-cols-2 gap-5">
                {[
                  { label: "COR DE DESTAQUE", key: "primary" as const },
                  { label: "FUNDO DA PÁGINA", key: "background" as const },
                  { label: "FUNDO DOS CARDS", key: "surface" as const },
                  { label: "COR DO TEXTO",    key: "text" as const },
                ].map(({ label, key }) => (
                  <div key={key}>
                    <SectionLabel>{label}</SectionLabel>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="relative w-[44px] h-[44px] flex-shrink-0 border border-[rgba(245,242,236,0.15)]">
                        <div className="absolute inset-0" style={{ background: draft[key] }} />
                        <input type="color" value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                      </div>
                      <input type="text" value={draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                        className="flex-1 h-[44px] px-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors font-mono"
                        style={{ fontFamily: "monospace" }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === "Tipografia" && (
            <div className="flex flex-col gap-6">
              <div>
                <SectionLabel>TEXTO DO LOGOTIPO</SectionLabel>
                <input type="text" value={draft.logoText} onChange={(e) => setDraft({ ...draft, logoText: e.target.value })}
                  className="mt-2 w-full h-[46px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] outline-none focus:border-[#e9b421] transition-colors"
                  style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </div>
              <div className="p-5 border border-[rgba(245,242,236,0.08)]">
                <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PARES TIPOGRÁFICOS (FIXOS)</p>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>Poppins Bold</span>
                    <span className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>TÍTULOS</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Barlow Regular</span>
                    <span className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>CORPO</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#f5f2ec]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>Barlow Condensed</span>
                    <span className="text-[11px] tracking-[1.5px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>LABELS</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {tab === "Banner" && (
            <div className="flex flex-col gap-6">
              <div>
                <SectionLabel>TÍTULO DO BANNER</SectionLabel>
                <textarea value={draft.bannerTitle} onChange={(e) => setDraft({ ...draft, bannerTitle: e.target.value })} rows={2}
                  className="mt-2 w-full px-4 py-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] outline-none focus:border-[#e9b421] transition-colors resize-none"
                  style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </div>
              <div>
                <SectionLabel>SUBTÍTULO DO BANNER</SectionLabel>
                <textarea value={draft.bannerSub} onChange={(e) => setDraft({ ...draft, bannerSub: e.target.value })} rows={3}
                  className="mt-2 w-full px-4 py-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[14px] outline-none focus:border-[#e9b421] transition-colors resize-none"
                  style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
              </div>
            </div>
          )}

          {tab === "Página inicial" && (
            <div className="flex flex-col gap-8">
              <EditorGroup title="DESTAQUE DA PÁGINA">
                <TextEditor label="CHAMADA SUPERIOR" value={contentDraft.landing.heroEyebrow} onChange={(heroEyebrow) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, heroEyebrow } })} />
                <div className="grid sm:grid-cols-2 gap-4">
                  <TextEditor label="TÍTULO" value={contentDraft.landing.heroTitle} onChange={(heroTitle) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, heroTitle } })} />
                  <TextEditor label="TEXTO EM DESTAQUE" value={contentDraft.landing.heroAccent} onChange={(heroAccent) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, heroAccent } })} />
                </div>
                <TextEditor multiline label="DESCRIÇÃO" value={contentDraft.landing.heroDescription} onChange={(heroDescription) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, heroDescription } })} />
                <ImageEditor label="IMAGEM DO DESTAQUE (VAZIO MANTÉM A LOGO)" value={contentDraft.landing.heroImage} onChange={(heroImage) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, heroImage } })} onFile={(file) => readImage(file, (heroImage) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, heroImage } }))} />
              </EditorGroup>

              <EditorGroup title="TÍTULOS DAS SEÇÕES">
                <TextEditor label="PORTFÓLIO" value={contentDraft.landing.portfolioTitle} onChange={(portfolioTitle) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, portfolioTitle } })} />
                <TextEditor label="AVALIAÇÕES" value={contentDraft.landing.reviewsTitle} onChange={(reviewsTitle) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, reviewsTitle } })} />
                <TextEditor label="CONTATO" value={contentDraft.landing.contactTitle} onChange={(contactTitle) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, contactTitle } })} />
              </EditorGroup>

              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <SectionLabel>CATEGORIAS DO PORTFÓLIO</SectionLabel>
                    <p className="text-[12px] text-[rgba(245,242,236,0.38)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{contentDraft.landing.categories.length}/6 categorias · mínimo 4 · somente texto</p>
                  </div>
                  <button type="button" onClick={addCategory} disabled={contentDraft.landing.categories.length >= 6} className="flex items-center gap-2 h-[38px] px-4 border border-[rgba(245,242,236,0.18)] text-[12px] text-[rgba(245,242,236,0.7)] hover:border-[#e9b421] hover:text-[#e9b421] disabled:opacity-30 disabled:pointer-events-none">
                    <Plus size={13} /> Adicionar categoria
                  </button>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {contentDraft.landing.categories.map((category) => (
                    <div key={category.id} className="p-4 border border-[rgba(245,242,236,0.1)] bg-[rgba(23,21,17,0.45)]">
                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <TextEditor label={`NOME · ${categoryCounts[category.id]}/3 PROJETOS`} value={category.title} onChange={(title) => updateCategory(contentDraft, setContentDraft, category.id, { title })} />
                        </div>
                        <button type="button" onClick={() => removeCategory(category.id)} disabled={contentDraft.landing.categories.length <= 4 || categoryCounts[category.id] > 0} aria-label={`Remover ${category.title}`} title={categoryCounts[category.id] > 0 ? "Remova ou realoque os projetos antes de excluir" : "Excluir categoria"} className="w-[44px] h-[44px] border border-[rgba(245,242,236,0.12)] flex items-center justify-center text-[rgba(245,242,236,0.35)] hover:text-red-400 hover:border-red-400/40 disabled:opacity-20 disabled:pointer-events-none">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <SectionLabel>PROJETOS DO PORTFÓLIO</SectionLabel>
                    <p className="text-[12px] text-[rgba(245,242,236,0.38)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Categorias fixas · mínimo 1 e máximo 3 projetos por categoria · imagens Antes e Depois obrigatórias</p>
                  </div>
                  <button type="button" onClick={addProject} disabled={contentDraft.landing.categories.every((category) => categoryCounts[category.id] >= 3)} className="flex items-center gap-2 h-[38px] px-4 border border-[rgba(245,242,236,0.18)] text-[12px] text-[rgba(245,242,236,0.7)] hover:border-[#e9b421] hover:text-[#e9b421] disabled:opacity-30 disabled:pointer-events-none">
                    <Plus size={13} /> Adicionar projeto
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {contentDraft.landing.categories.map((category) => (
                    <span key={category.id} className="px-3 py-1.5 border border-[rgba(245,242,236,0.1)] text-[11px] text-[rgba(245,242,236,0.55)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{category.title.toUpperCase()} · {categoryCounts[category.id]}/3</span>
                  ))}
                </div>
                <div className="flex flex-col gap-4 mt-3">
                  {contentDraft.landing.projects.map((project, index) => (
                    <EditorGroup key={project.id} title={`PROJETO ${index + 1}`}>
                      <div className="flex justify-end -mt-10">
                        <button type="button" onClick={() => removeProject(project.id)} disabled={categoryCounts[project.categoryId] <= 1 && contentDraft.landing.categories.length <= 4} aria-label={`Remover ${project.title}`} className="w-8 h-8 flex items-center justify-center text-[rgba(245,242,236,0.35)] hover:text-red-400 disabled:opacity-20 disabled:pointer-events-none"><Trash2 size={14} /></button>
                      </div>
                      <TextEditor label="TÍTULO" value={project.title} onChange={(title) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, projects: contentDraft.landing.projects.map((item) => item.id === project.id ? { ...item, title } : item) } })} />
                      <label>
                        <SectionLabel>CATEGORIA</SectionLabel>
                        <select value={project.categoryId} onChange={(event) => changeProjectCategory(project.id, Number(event.target.value))} className="mt-2 w-full h-[44px] px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421]">
                          {contentDraft.landing.categories.map((category) => <option key={category.id} value={category.id} disabled={category.id !== project.categoryId && categoryCounts[category.id] >= 3}>{category.title}</option>)}
                        </select>
                      </label>
                      <TextEditor multiline label="DESCRIÇÃO" value={project.description} onChange={(description) => setContentDraft({ ...contentDraft, landing: { ...contentDraft.landing, projects: contentDraft.landing.projects.map((item) => item.id === project.id ? { ...item, description } : item) } })} />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <TextEditor label="MATERIAL" value={project.material} onChange={(material) => updateProject(contentDraft, setContentDraft, project.id, { material })} />
                        <TextEditor label="ACABAMENTO" value={project.finish} onChange={(finish) => updateProject(contentDraft, setContentDraft, project.id, { finish })} />
                        <TextEditor label="COR" value={project.color} onChange={(color) => updateProject(contentDraft, setContentDraft, project.id, { color })} />
                        <TextEditor label="PRAZO" value={project.deadline} onChange={(deadline) => updateProject(contentDraft, setContentDraft, project.id, { deadline })} />
                      </div>
                      <TextEditor label="TAGS (SEPARADAS POR VÍRGULA)" value={project.tags.join(", ")} onChange={(tags) => updateProject(contentDraft, setContentDraft, project.id, { tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean) })} />
                      <div className="grid sm:grid-cols-2 gap-4">
                        <ImageEditor required label="IMAGEM ANTES" value={project.beforeImg} onChange={(beforeImg) => updateProject(contentDraft, setContentDraft, project.id, { beforeImg })} onFile={(file) => readImage(file, (beforeImg) => updateProject(contentDraft, setContentDraft, project.id, { beforeImg }))} />
                        <ImageEditor required label="IMAGEM DEPOIS" value={project.afterImg} onChange={(afterImg) => updateProject(contentDraft, setContentDraft, project.id, { afterImg })} onFile={(file) => readImage(file, (afterImg) => updateProject(contentDraft, setContentDraft, project.id, { afterImg }))} />
                      </div>
                    </EditorGroup>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Eventos" && (
            <div className="flex flex-col gap-8">
              <EditorGroup title="CABEÇALHO DA PÁGINA">
                <TextEditor label="CHAMADA SUPERIOR" value={contentDraft.events.eyebrow} onChange={(eyebrow) => setContentDraft({ ...contentDraft, events: { ...contentDraft.events, eyebrow } })} />
                <TextEditor label="TÍTULO" value={contentDraft.events.title} onChange={(title) => setContentDraft({ ...contentDraft, events: { ...contentDraft.events, title } })} />
                <TextEditor multiline label="DESCRIÇÃO" value={contentDraft.events.description} onChange={(description) => setContentDraft({ ...contentDraft, events: { ...contentDraft.events, description } })} />
              </EditorGroup>
              <div>
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <SectionLabel>EVENTOS PUBLICADOS</SectionLabel>
                    <p className="text-[12px] text-[rgba(245,242,236,0.38)] mt-1" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{contentDraft.events.items.length}/10 eventos · mínimo 3 · imagem obrigatória</p>
                  </div>
                  <button type="button" onClick={addEvent} disabled={contentDraft.events.items.length >= 10} className="flex items-center gap-2 h-[38px] px-4 border border-[rgba(245,242,236,0.18)] text-[12px] text-[rgba(245,242,236,0.7)] hover:border-[#e9b421] hover:text-[#e9b421] disabled:opacity-30 disabled:pointer-events-none">
                    <Plus size={13} /> Adicionar evento
                  </button>
                </div>
                <div className="flex flex-col gap-4 mt-3">
                  {contentDraft.events.items.map((event, index) => (
                    <EditorGroup key={event.id} title={`EVENTO ${index + 1}`}>
                      <div className="flex justify-end -mt-10">
                        <button type="button" onClick={() => removeEvent(event.id)} disabled={contentDraft.events.items.length <= 3} aria-label={`Remover ${event.title}`} className="w-8 h-8 flex items-center justify-center text-[rgba(245,242,236,0.35)] hover:text-red-400 disabled:opacity-20 disabled:pointer-events-none"><Trash2 size={14} /></button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {(["year", "month", "tag"] as const).map((key) => (
                          <TextEditor key={key} label={key === "year" ? "ANO" : key === "month" ? "MÊS" : "CATEGORIA"} value={event[key]} onChange={(value) => updateEvent(contentDraft, setContentDraft, event.id, { [key]: value })} />
                        ))}
                      </div>
                      <TextEditor label="TÍTULO" value={event.title} onChange={(title) => updateEvent(contentDraft, setContentDraft, event.id, { title })} />
                      <TextEditor multiline label="DESCRIÇÃO" value={event.description} onChange={(description) => updateEvent(contentDraft, setContentDraft, event.id, { description })} />
                      <ImageEditor required label="IMAGEM DO EVENTO" value={event.img} onChange={(img) => updateEvent(contentDraft, setContentDraft, event.id, { img })} onFile={(file) => readImage(file, (img) => updateEvent(contentDraft, setContentDraft, event.id, { img }))} />
                    </EditorGroup>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === "Orçamento" && (
            <EditorGroup title="EXIBIÇÃO PÚBLICA">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <p className="text-[14px] text-[#f5f2ec] mb-1" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>Simulador automático item a item</p>
                  <p className="text-[13px] text-[rgba(245,242,236,0.48)] leading-[1.6] max-w-[520px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>Quando desativado, visitantes verão somente o envio de projeto em PDF. O upload permanece sempre disponível.</p>
                </div>
                <button type="button" role="switch" aria-checked={contentDraft.showAutomaticSimulator} onClick={() => setContentDraft({ ...contentDraft, showAutomaticSimulator: !contentDraft.showAutomaticSimulator })} className={`relative w-[52px] h-[28px] rounded-full flex-shrink-0 transition-colors ${contentDraft.showAutomaticSimulator ? "bg-[#e9b421]" : "bg-[rgba(245,242,236,0.16)]"}`}>
                  <span className={`absolute top-1 w-5 h-5 rounded-full bg-[#12100d] transition-transform ${contentDraft.showAutomaticSimulator ? "translate-x-7" : "translate-x-1"}`} />
                </button>
              </div>
            </EditorGroup>
          )}
        </div>

        {/* Preview panel */}
        {preview && (
          <div className="border border-[rgba(245,242,236,0.12)]">
            <div className="px-4 py-2 border-b border-[rgba(245,242,236,0.08)] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[rgba(245,242,236,0.2)]" />
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PRÉ-VISUALIZAÇÃO</p>
            </div>
            <div style={{ background: draft.background }}>
              {/* Nav preview */}
              <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(245,242,236,0.08)" }}>
                <div className="flex items-center gap-3">
                  <div className="w-[30px] h-[30px] rounded-full border flex items-center justify-center" style={{ borderColor: draft.primary }}>
                    <span className="text-[13px]" style={{ color: draft.primary, fontFamily: "'Poppins:Bold', sans-serif" }}>{draft.logoText[0]}</span>
                  </div>
                  <p className="text-[12px] tracking-[2px]" style={{ color: draft.text, fontFamily: "'Poppins:Bold', sans-serif" }}>{draft.logoText}</p>
                </div>
                <div className="h-[32px] px-4 rounded-full flex items-center text-[12px]" style={{ background: draft.primary, color: draft.background, fontFamily: "'Poppins:Bold', sans-serif" }}>
                  Pedir orçamento
                </div>
              </div>

              {/* Hero preview */}
              <div className="px-6 py-10">
                <p className="text-[10px] tracking-[3px] mb-3" style={{ color: draft.primary, fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PINTURA ELETROSTÁTICA</p>
                <p className="text-[22px] leading-[1.2] tracking-[-0.44px] mb-4" style={{ color: draft.text, fontFamily: "'Poppins:Bold', sans-serif" }}>{draft.bannerTitle}</p>
                <p className="text-[13px] leading-[1.7] opacity-70" style={{ color: draft.text, fontFamily: "'Barlow:Regular', sans-serif" }}>{draft.bannerSub}</p>

                {/* Card sample */}
                <div className="mt-8 p-5 border" style={{ background: draft.surface, borderColor: "rgba(245,242,236,0.08)" }}>
                  <p className="text-[10px] tracking-[2px] mb-2" style={{ color: draft.primary, fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>PORTÃO RESIDENCIAL</p>
                  <p className="text-[15px]" style={{ color: draft.text, fontFamily: "'Poppins:SemiBold', sans-serif" }}>Portão duplo em ferro forjado</p>
                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-[10px] tracking-[1.5px] px-2 py-0.5" style={{ background: draft.primary, color: draft.background, fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>PORTÕES</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.45)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{children}</p>
  );
}

function EditorGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 border border-[rgba(245,242,236,0.1)] bg-[rgba(23,21,17,0.45)]">
      <p className="text-[11px] tracking-[2px] text-[#e9b421] mb-5" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{title}</p>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function TextEditor({ label, value, onChange, multiline = false }: { label: string; value: string; onChange: (value: string) => void; multiline?: boolean }) {
  const className = "mt-2 w-full px-4 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[13px] outline-none focus:border-[#e9b421] transition-colors";
  return (
    <label>
      <SectionLabel>{label}</SectionLabel>
      {multiline ? (
        <textarea rows={3} value={value} onChange={(event) => onChange(event.target.value)} className={`${className} py-3 resize-y`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
      ) : (
        <input type="text" value={value} onChange={(event) => onChange(event.target.value)} className={`${className} h-[44px]`} style={{ fontFamily: "'Barlow:Regular', sans-serif" }} />
      )}
    </label>
  );
}

function ImageEditor({ label, value, onChange, onFile, required = false }: { label: string; value: string; onChange: (value: string) => void; onFile: (file?: File) => void; required?: boolean }) {
  return (
    <div>
      <SectionLabel>{label}{required ? " *" : ""}</SectionLabel>
      {value && <img src={value} alt="" className="mt-2 w-full h-[112px] object-cover border border-[rgba(245,242,236,0.1)]" />}
      <div className="flex mt-2">
        <input type="text" value={value.startsWith("data:") ? "Imagem enviada do dispositivo" : value} onChange={(event) => onChange(event.target.value)} className="min-w-0 flex-1 h-[42px] px-3 bg-[#171511] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] text-[12px] outline-none focus:border-[#e9b421]" placeholder="Cole a URL da imagem" />
        <label className="h-[42px] px-4 border border-l-0 border-[rgba(245,242,236,0.18)] text-[rgba(245,242,236,0.7)] flex items-center gap-2 cursor-pointer hover:text-[#e9b421]">
          <Upload size={13} />
          <span className="text-[11px]" style={{ fontFamily: "'Barlow:Medium', sans-serif" }}>Arquivo</span>
          <input type="file" accept="image/*" className="sr-only" onChange={(event) => onFile(event.target.files?.[0])} />
        </label>
      </div>
    </div>
  );
}

function updateCategory(content: SiteContent, setContent: (content: SiteContent) => void, id: number, patch: Partial<SiteContent["landing"]["categories"][number]>) {
  setContent({
    ...content,
    landing: {
      ...content.landing,
      categories: content.landing.categories.map((category) => category.id === id ? { ...category, ...patch } : category),
    },
  });
}

function updateProject(content: SiteContent, setContent: (content: SiteContent) => void, id: number, patch: Partial<SiteContent["landing"]["projects"][number]>) {
  setContent({
    ...content,
    landing: {
      ...content.landing,
      projects: content.landing.projects.map((project) => project.id === id ? { ...project, ...patch } : project),
    },
  });
}

function updateEvent(content: SiteContent, setContent: (content: SiteContent) => void, id: number, patch: Partial<SiteContent["events"]["items"][number]>) {
  setContent({
    ...content,
    events: {
      ...content.events,
      items: content.events.items.map((event) => event.id === id ? { ...event, ...patch } : event),
    },
  });
}
