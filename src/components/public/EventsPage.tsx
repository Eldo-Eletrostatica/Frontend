import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRight, X } from "lucide-react";
import { useSiteContent, type EventContent } from "../../lib/siteContentContext";

export default function EventsPage() {
  const { content } = useSiteContent();
  const events = content.events;
  const [selectedEvent, setSelectedEvent] = useState<EventContent | null>(null);

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

  return (
    <>
      <div className="max-w-[1240px] mx-auto px-6 pt-16 pb-20">
      {/* Header */}
      <div className="border-b border-[rgba(245,242,236,0.12)] pb-10 mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-[13px] tracking-[2.86px] text-[#e9b421] mb-3" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{events.eyebrow}</p>
          <h1 className="text-[48px] text-[#f5f2ec] leading-[1.05] tracking-[-1.44px]" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{events.title}</h1>
        </div>
        <p className="text-[16px] text-[rgba(245,242,236,0.6)] leading-[1.65] max-w-[440px]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>
          {events.description}
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-[110px] top-0 bottom-0 w-px bg-[rgba(245,242,236,0.12)] hidden md:block" />
        {events.items.map((ev) => (
          <div key={ev.id} className="relative flex gap-10 border-b border-[rgba(245,242,236,0.08)] last:border-0">
            <div className="hidden md:flex flex-col items-end w-[90px] flex-shrink-0 pt-10 pb-10">
              <p className="text-[28px] text-[rgba(245,242,236,0.5)] leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{ev.year}</p>
              <p className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.3)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{ev.month}</p>
            </div>
            <div className="hidden md:block absolute left-[106px] top-12 w-[9px] h-[9px] rounded-full bg-[#e9b421]" />
            <div className="flex-1 flex flex-col md:flex-row gap-6 py-10 md:pl-6 min-w-0">
              <div className="w-full md:w-[360px] flex-shrink-0 overflow-hidden h-[220px]">
                <img src={ev.img} alt={ev.title} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="md:hidden flex items-center gap-3 mb-4">
                  <span className="text-[24px] text-[rgba(245,242,236,0.5)] leading-tight" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{ev.year}</span>
                  <span className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.4)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{ev.month}</span>
                </div>
                <span className="inline-block mb-4 px-3 py-1 bg-[#e9b421] text-[#12100d] text-[10px] tracking-[1.8px]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>{ev.tag}</span>
                <h2 className="text-[22px] text-[#f5f2ec] leading-[1.25] tracking-[-0.44px] mb-4 break-words" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{ev.title}</h2>
                <p className="text-[15px] text-[rgba(245,242,236,0.65)] leading-[1.7] break-words" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{ev.description}</p>
                <button type="button" onClick={() => setSelectedEvent(ev)} className="mt-5 flex items-center gap-2 text-[12px] tracking-[2px] text-[#e9b421] hover:opacity-75 transition-opacity" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>VER REGISTRO <ArrowRight size={12} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
      </div>

      {selectedEvent && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
          <button type="button" className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedEvent(null)} aria-label="Fechar detalhes do evento" />
          <div className="relative w-full max-w-[820px] max-h-[90vh] overflow-y-auto border border-[rgba(245,242,236,0.14)] bg-[#171511] shadow-2xl">
            <button type="button" onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-[rgba(18,16,13,0.85)] border border-[rgba(245,242,236,0.18)] text-[#f5f2ec] flex items-center justify-center hover:border-[#e9b421] hover:text-[#e9b421] transition-colors" aria-label="Fechar">
              <X size={18} />
            </button>
            <div className="h-[260px] md:h-[380px] overflow-hidden">
              <img src={selectedEvent.img} alt={selectedEvent.title} className="w-full h-full object-cover" />
            </div>
            <div className="p-7 md:p-10">
              <div className="flex flex-wrap items-center gap-3 mb-5">
                <span className="px-3 py-1 bg-[#e9b421] text-[#12100d] text-[10px] tracking-[1.8px]" style={{ fontFamily: "'Barlow Condensed:SemiBold', sans-serif" }}>{selectedEvent.tag}</span>
                <span className="text-[11px] tracking-[2px] text-[rgba(245,242,236,0.42)]" style={{ fontFamily: "'Barlow Condensed:Regular', sans-serif" }}>{selectedEvent.month} · {selectedEvent.year}</span>
              </div>
              <h2 id="event-modal-title" className="text-[28px] md:text-[34px] text-[#f5f2ec] leading-[1.18] tracking-[-0.7px] mb-5" style={{ fontFamily: "'Poppins:Bold', sans-serif" }}>{selectedEvent.title}</h2>
              <p className="text-[15px] md:text-[16px] text-[rgba(245,242,236,0.68)] leading-[1.8]" style={{ fontFamily: "'Barlow:Regular', sans-serif" }}>{selectedEvent.description}</p>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
