import type { VisualSettings } from "./publicContent";

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

// The values go into a <style> tag, so anything that is not a plain hex color
// is dropped and the default from globals.css stays.
function toDeclaration(variable: string, color: string): string {
  return HEX_COLOR_PATTERN.test(color) ? `${variable}: ${color};` : "";
}

// Rendered on the server, so the first paint already has the published colors.
// It targets :root because the modals are portaled to <body>, outside the
// site layout.
export default function SiteThemeStyle({ colors }: { colors: VisualSettings["colors"] }) {
  const declarations = [
    toDeclaration("--site-accent", colors.accent),
    toDeclaration("--site-page-background", colors.pageBackground),
    toDeclaration("--site-card-background", colors.cardBackground),
    toDeclaration("--site-text", colors.text),
  ].join(" ");

  return <style>{`:root { ${declarations} }`}</style>;
}
