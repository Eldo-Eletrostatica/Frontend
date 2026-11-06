import type { Metadata } from "next";
import ContactPJPage from "@/components/public/ContactPJPage";

export const metadata: Metadata = { title: "Solicitar orçamento | Eldo Pintura Eletrostática" };

export default function QuotePage() {
  return <ContactPJPage />;
}
