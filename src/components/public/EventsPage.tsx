"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import BucketImage from "./BucketImage";
import { ArrowRight, X } from "lucide-react";
import type { CompanyEvent, VisualSettings } from "./publicContent";

const MONTH_LABELS = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];

// eventDate is a calendar day (YYYY-MM-DD); reading it as text avoids the time
// zone shift that new Date() would apply.
function toYearAndMonth(eventDate: string): { year: string; month: string } {
  const [year, month] = eventDate.split("-");
  return { year, month: MONTH_LABELS[Number(month) - 1] ?? "" };
}

interface EventsPageProps {
  eventsHeader: VisualSettings["eventsHeader"];
  // null when the API could not be reached.
  companyEvents: CompanyEvent[] | null;
}

export default function EventsPage({ eventsHeader, companyEvents }: EventsPageProps) {
  const [selectedEvent, setSelectedEvent] = useState<CompanyEvent | null>(null);

  useEffect(() => {
    if (!selectedEvent) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedEvent(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedEvent]);

  const selectedDate = selectedEvent ? toYearAndMonth(selectedEvent.eventDate) : null;

  return (
    <>
      <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-20">
      {/* Header */}
      <div className="border-b border-site-text/12 pb-10 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[13px] tracking-[2.86px] text-site-accent mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{eventsHeader.eyebrow}</p>
          <h1 className="text-[48px] text-site-text leading-[1.05] tracking-[-1.44px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{eventsHeader.title}</h1>
        </div>
        <p className="text-[16px] text-site-text/60 leading-[1.65] max-w-[440px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {eventsHeader.description}
        </p>
      </div>

      {companyEvents === null || companyEvents.length === 0 ? (
        <div className="py-20 text-center border border-site-text/8 bg-site-card">
          <p className="text-[18px] text-site-text mb-2" style={{ fontFamily: "'Poppins:SemiBold', sans-serif" }}>
            {companyEvents === null ? "Não foi possível carregar os eventos" : "Nenhum evento no momento"}
          </p>
          <p className="text-[14px] text-site-text/55" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
            {companyEvents === null ? "Tente novamente em alguns minutos." : "Em breve publicaremos as próximas ações da empresa."}
          </p>
        </div>
      ) : (
      <div className="relative">
        <div className="absolute left-[110px] top-0 bottom-0 w-px bg-site-text/12 hidden md:block" />
        {companyEvents.map((companyEvent) => {
          const { year, month } = toYearAndMonth(companyEvent.eventDate);
          return (
          <div key={companyEvent.showcaseItemId} className="relative flex gap-10 border-b border-site-text/8 last:border-0">
            <div className="hidden md:flex flex-col items-end w-[90px] flex-shrink-0 pt-10 pb-10">
              <p className="text-[28px] text-site-text/50 leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{year}</p>
              <p className="text-[11px] tracking-[2px] text-site-text/30" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{month}</p>
            </div>
            <div className="hidden md:block absolute left-[106px] top-12 w-[9px] h-[9px] rounded-full bg-site-accent" />
            <div className="flex-1 flex flex-col md:flex-row gap-6 py-10 md:pl-6 min-w-0">
              <div className="relative w-full md:w-[360px] flex-shrink-0 overflow-hidden h-[220px] bg-site-text/5">
                <BucketImage src={companyEvent.imageUrl} alt={companyEvent.title} fill sizes="(min-width: 768px) 360px, 100vw" className="object-cover grayscale hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="md:hidden flex items-center gap-3 mb-4">
                  <span className="text-[24px] text-site-text/50 leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{year}</span>
                  <span className="text-[11px] tracking-[2px] text-site-text/40" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{month}</span>
                </div>
                <h2 className="text-[22px] text-site-text leading-[1.25] tracking-[-0.44px] mb-4 break-words" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{companyEvent.title}</h2>
                <p className="text-[15px] text-site-text/65 leading-[1.7] break-words line-clamp-4" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{companyEvent.description}</p>
                <button type="button" onClick={() => setSelectedEvent(companyEvent)} className="mt-5 flex items-center gap-2 text-[12px] tracking-[2px] text-site-accent hover:opacity-75 transition-opacity" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>VER REGISTRO <ArrowRight size={12} /></button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
      )}
      </div>

      {selectedEvent && selectedDate && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
          <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} aria-label="Fechar detalhes do evento" />
          <div className="relative w-full max-w-[820px] max-h-[90vh] overflow-y-auto border border-site-text/14 bg-site-card shadow-2xl">
            <button type="button" onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-site-page/85 border border-site-text/18 text-site-text flex items-center justify-center hover:border-site-accent hover:text-site-accent transition-colors" aria-label="Fechar">
              <X size={18} />
            </button>
            <div className="relative h-[260px] md:h-[380px] overflow-hidden bg-site-text/5">
              <BucketImage src={selectedEvent.imageUrl} alt={selectedEvent.title} fill sizes="(min-width: 860px) 820px, 100vw" className="object-cover" />
            </div>
            <div className="p-7 md:p-10">
              <p className="mb-5 text-[11px] tracking-[2px] text-site-text/42" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{selectedDate.month} · {selectedDate.year}</p>
              <h2 id="event-modal-title" className="text-[28px] md:text-[34px] text-site-text leading-[1.18] tracking-[-0.7px] mb-5" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{selectedEvent.title}</h2>
              <p className="text-[15px] md:text-[16px] text-site-text/68 leading-[1.8] whitespace-pre-line" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{selectedEvent.description}</p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
