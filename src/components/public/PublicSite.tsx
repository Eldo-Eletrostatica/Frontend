import { useEffect, useState } from "react";
import PublicNav from "./PublicNav";
import PublicFooter from "./PublicFooter";
import LandingPage from "./LandingPage";
import EventsPage from "./EventsPage";
import ContactPJPage from "./ContactPJPage";
import ScrollShortcuts from "./ScrollShortcuts";

export type PublicPage = "home" | "events" | "contact-pj";

interface Props {
  onGoInternal: () => void;
  onGoClientArea: () => void;
}

export default function PublicSite({ onGoInternal, onGoClientArea }: Props) {
  const [page, setPage] = useState<PublicPage>("home");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [page]);

  return (
    <div className="min-h-screen" style={{ background: "#12100d" }}>
      <PublicNav page={page} setPage={setPage} onGoInternal={onGoInternal} onGoClientArea={onGoClientArea} />
      <main style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
        {page === "home"       && <LandingPage onGoQuote={() => setPage("contact-pj")} />}
        {page === "events"     && <EventsPage />}
        {page === "contact-pj" && <ContactPJPage />}
      </main>
      <PublicFooter setPage={setPage} />
      <ScrollShortcuts />
    </div>
  );
}
