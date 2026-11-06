"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import TrackingResult from "@/components/TrackingResult";
import TrackingSearch from "@/components/TrackingSearch";
import type { TrackingLookup } from "@/components/tracking/types";
import { ROUTES } from "@/lib/routes";

// Public lookup by CNPJ or tracking code: customers have no account.
export default function TrackingPage() {
  const router = useRouter();
  const [lookup, setLookup] = useState<TrackingLookup | null>(null);

  if (lookup) {
    return <TrackingResult lookup={lookup} onBack={() => setLookup(null)} />;
  }
  return <TrackingSearch onFound={setLookup} onBack={() => router.push(ROUTES.home)} />;
}
