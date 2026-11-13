"use client";

import type { ReactNode } from "react";
import type { VisualSettings } from "@/components/public/publicContent";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { VisualSettingsProvider } from "@/lib/siteSettings/VisualSettingsProvider";

export default function Providers({
  initialVisualSettings,
  children,
}: {
  initialVisualSettings: VisualSettings;
  children: ReactNode;
}) {
  return (
    <VisualSettingsProvider initialVisualSettings={initialVisualSettings}>
      <AuthProvider>{children}</AuthProvider>
    </VisualSettingsProvider>
  );
}
