import type { Metadata, Viewport } from "next";
import SiteThemeStyle from "@/components/public/SiteThemeStyle";
import { loadVisualSettings } from "@/app/(site)/publicData";
import { isValidHexColor } from "@/lib/siteSettings/theme";
import Providers from "./Providers";
import "./globals.css";

// Rendered on each request: next build must not call the API, and the cached
// visual settings are refreshed by tag when the internal area publishes.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { logo } = await loadVisualSettings();
  const customIcon = logo.imageUrl?.trim() || null;

  return {
    title: "Eldo Pintura Eletrostática",
    description:
      "Pintura eletrostática a pó para estruturas metálicas, portões, máquinas e mobiliário industrial.",
    ...(customIcon
      ? {
          icons: {
            icon: customIcon,
            shortcut: customIcon,
            apple: customIcon,
          },
        }
      : {}),
  };
}

export async function generateViewport(): Promise<Viewport> {
  const { colors } = await loadVisualSettings();

  return {
    themeColor: isValidHexColor(colors.pageBackground) ? colors.pageBackground : "#12100d",
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const visualSettings = await loadVisualSettings();

  return (
    <html lang="pt-BR">
      <head>
        <SiteThemeStyle colors={visualSettings.colors} />
      </head>
      <body>
        <Providers initialVisualSettings={visualSettings}>{children}</Providers>
      </body>
    </html>
  );
}
