import type { Metadata } from "next";
import EventsPage from "@/components/public/EventsPage";

export const metadata: Metadata = { title: "Eventos | Eldo Pintura Eletrostática" };

export default function CompanyEventsPage() {
  return <EventsPage />;
}
