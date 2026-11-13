import type { VisualSettings } from "@/components/public/publicContent";

export const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export const THEME_COLOR_VARIABLES: Array<{
  key: keyof VisualSettings["colors"];
  variable: string;
}> = [
  { key: "accent", variable: "--site-accent" },
  { key: "pageBackground", variable: "--site-page-background" },
  { key: "cardBackground", variable: "--site-card-background" },
  { key: "text", variable: "--site-text" },
];

export function isValidHexColor(color: string): boolean {
  return HEX_COLOR_PATTERN.test(color);
}

// Non-hex values are ignored so invalid persisted input cannot inject CSS and
// falls back cleanly to the :root defaults in globals.css.
export function getThemeEntries(colors: VisualSettings["colors"]): Array<[string, string]> {
  const entries: Array<[string, string]> = [];

  for (const { key, variable } of THEME_COLOR_VARIABLES) {
    const value = colors[key];
    if (isValidHexColor(value)) {
      entries.push([variable, value]);
    }
  }

  return entries;
}

export function buildThemeDeclarations(colors: VisualSettings["colors"]): string {
  return getThemeEntries(colors)
    .map(([variable, value]) => `${variable}: ${value};`)
    .join(" ");
}

