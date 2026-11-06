"use client";

import type { ReactNode } from "react";
import { DemoSessionProvider } from "@/lib/demoSession";
import { PricingProvider } from "@/lib/pricingContext";
import { ServicesProvider } from "@/lib/servicesContext";
import { SiteContentProvider } from "@/lib/siteContentContext";

// The prototype data lives in these contexts. They sit in the root layout so
// the data survives navigation between routes; each one goes away when its
// screen starts reading from the API.
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <DemoSessionProvider>
      <PricingProvider>
        <ServicesProvider>
          <SiteContentProvider>{children}</SiteContentProvider>
        </ServicesProvider>
      </PricingProvider>
    </DemoSessionProvider>
  );
}
