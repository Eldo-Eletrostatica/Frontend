"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TrackingResult from "@/components/TrackingResult";
import TrackingSearch from "@/components/TrackingSearch";
import { ROUTES } from "@/lib/routes";
import type { ServiceOrder } from "@/lib/servicesContext";

// Public lookup by CNPJ or tracking code: customers have no account.
export default function TrackingPage() {
  const router = useRouter();
  const [found, setFound] = useState<{ orders: ServiceOrder[]; clientName: string } | null>(null);

  if (found) {
    return <TrackingResult orders={found.orders} clientName={found.clientName} onBack={() => setFound(null)} />;
  }
  return <TrackingSearch onFound={(orders, clientName) => setFound({ orders, clientName })} onBack={() => router.push(ROUTES.home)} />;
}
