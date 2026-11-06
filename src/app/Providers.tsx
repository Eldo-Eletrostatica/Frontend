"use client";

import type { ReactNode } from "react";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { PricingProvider } from "@/lib/pricingContext";
import { ServicesProvider } from "@/lib/servicesContext";
import { SiteContentProvider } from "@/lib/siteContentContext";

// The session and the prototype data live in these contexts. They sit in the
// root layout so they survive navigation between routes; each prototype one
// goes away when its screen starts reading from the API.
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <PricingProvider>
        <ServicesProvider>
          <SiteContentProvider>{children}</SiteContentProvider>
        </ServicesProvider>
      </PricingProvider>
    </AuthProvider>
  );
}
