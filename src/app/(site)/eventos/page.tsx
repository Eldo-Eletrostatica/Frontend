import type { Metadata } from "next";
import EventsPage from "@/components/public/EventsPage";
import { loadCompanyEvents, loadVisualSettings } from "../publicData";

export const metadata: Metadata = { title: "Eventos | Eldo Pintura Eletrostática" };

// Rendered on each request so next build does not call the API; the data
// itself stays cached by tag.
export const dynamic = "force-dynamic";

export default async function CompanyEventsPage() {
  const [visualSettings, companyEvents] = await Promise.all([loadVisualSettings(), loadCompanyEvents()]);
  return <EventsPage eventsHeader={visualSettings.eventsHeader} companyEvents={companyEvents} />;
}
