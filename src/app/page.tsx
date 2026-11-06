"use client";

import App from "@/App";
import { PricingProvider } from "@/lib/pricingContext";
import { ServicesProvider } from "@/lib/servicesContext";
import { SiteContentProvider } from "@/lib/siteContentContext";

export default function Home() {
  return (
    <PricingProvider>
      <ServicesProvider>
        <SiteContentProvider>
          <App />
        </SiteContentProvider>
      </ServicesProvider>
    </PricingProvider>
  );
}
