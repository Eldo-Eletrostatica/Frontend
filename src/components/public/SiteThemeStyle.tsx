import type { VisualSettings } from "./publicContent";
import { buildThemeDeclarations } from "@/lib/siteSettings/theme";

// Rendered on the server, so the first paint already has the published colors.
// It targets :root because modals and internal layouts rely on the same tokens.
export default function SiteThemeStyle({ colors }: { colors: VisualSettings["colors"] }) {
  const declarations = buildThemeDeclarations(colors);

  return <style>{`:root { ${declarations} }`}</style>;
}
