"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { VisualSettings } from "@/components/public/publicContent";
import { getThemeEntries, isValidHexColor } from "@/lib/siteSettings/theme";

const VISUAL_SETTINGS_CHANNEL = "eldo-visual-settings";
const VISUAL_SETTINGS_STORAGE_KEY = "eldo-visual-settings";

interface VisualSettingsContextValue {
  visualSettings: VisualSettings;
  updateVisualSettings: (next: VisualSettings) => void;
}

const VisualSettingsContext = createContext<VisualSettingsContextValue | null>(null);

interface CapturedIconLinks {
  iconHref: string | null;
  shortcutIconHref: string | null;
  appleIconHref: string | null;
}

function applyThemeColors(colors: VisualSettings["colors"]) {
  const rootStyle = document.documentElement.style;

  for (const [variable, value] of getThemeEntries(colors)) {
    rootStyle.setProperty(variable, value);
  }

  if (isValidHexColor(colors.pageBackground)) {
    let themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!themeMeta) {
      themeMeta = document.createElement("meta");
      themeMeta.name = "theme-color";
      document.head.appendChild(themeMeta);
    }
    themeMeta.content = colors.pageBackground;
  }
}

function syncIconLink(rel: string, nextHref: string | null, fallbackHref: string | null) {
  const selector = `link[rel="${rel}"]`;
  const existing = document.querySelector<HTMLLinkElement>(selector);

  if (nextHref) {
    if (existing) {
      existing.href = nextHref;
      return;
    }

    const link = document.createElement("link");
    link.rel = rel;
    link.href = nextHref;
    link.dataset.brandIcon = "true";
    document.head.appendChild(link);
    return;
  }

  if (!existing) {
    return;
  }

  if (existing.dataset.brandIcon === "true") {
    existing.remove();
  } else if (fallbackHref) {
    existing.href = fallbackHref;
  }
}

function applyFavicon(imageUrl: string | null, defaults: CapturedIconLinks) {
  const normalizedUrl = imageUrl?.trim() ? imageUrl.trim() : null;
  syncIconLink("icon", normalizedUrl, defaults.iconHref);
  syncIconLink("shortcut icon", normalizedUrl, defaults.shortcutIconHref);
  syncIconLink("apple-touch-icon", normalizedUrl, defaults.appleIconHref);
}

function isVisualSettingsPayload(value: unknown): value is VisualSettings {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Partial<VisualSettings>;
  return Boolean(candidate.colors && candidate.logo && candidate.banner);
}

export function VisualSettingsProvider({
  initialVisualSettings,
  children,
}: {
  initialVisualSettings: VisualSettings;
  children: ReactNode;
}) {
  const [prevInitial, setPrevInitial] = useState<VisualSettings>(initialVisualSettings);
  const [visualSettings, setVisualSettings] = useState<VisualSettings>(initialVisualSettings);
  const defaultIconsRef = useRef<CapturedIconLinks | null>(null);

  if (prevInitial !== initialVisualSettings) {
    setPrevInitial(initialVisualSettings);
    setVisualSettings(initialVisualSettings);
  }

  useEffect(() => {
    if (!defaultIconsRef.current) {
      defaultIconsRef.current = {
        iconHref: document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ?? null,
        shortcutIconHref:
          document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]')?.href ?? null,
        appleIconHref:
          document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]')?.href ?? null,
      };
    }

    applyThemeColors(visualSettings.colors);
    applyFavicon(visualSettings.logo.imageUrl, defaultIconsRef.current);
  }, [visualSettings]);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel(VISUAL_SETTINGS_CHANNEL);
      channel.onmessage = (event: MessageEvent<unknown>) => {
        if (isVisualSettingsPayload(event.data)) {
          setVisualSettings(event.data);
        }
      };
    }

    function handleStorage(event: StorageEvent) {
      if (event.key !== VISUAL_SETTINGS_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue) as { visualSettings?: unknown };
        if (isVisualSettingsPayload(parsed.visualSettings)) {
          setVisualSettings(parsed.visualSettings);
        }
      } catch {
        // Ignore malformed cross-tab payloads.
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      channel?.close();
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const updateVisualSettings = useCallback((next: VisualSettings) => {
    setVisualSettings(next);

    if (typeof BroadcastChannel !== "undefined") {
      const channel = new BroadcastChannel(VISUAL_SETTINGS_CHANNEL);
      channel.postMessage(next);
      channel.close();
    }

    try {
      window.localStorage.setItem(
        VISUAL_SETTINGS_STORAGE_KEY,
        JSON.stringify({ visualSettings: next, updatedAt: Date.now() }),
      );
    } catch {
      // Storage may be unavailable in private browsing or restricted contexts.
    }
  }, []);

  return (
    <VisualSettingsContext.Provider value={{ visualSettings, updateVisualSettings }}>
      {children}
    </VisualSettingsContext.Provider>
  );
}

export function useVisualSettings(): VisualSettingsContextValue {
  const context = useContext(VisualSettingsContext);
  if (!context) {
    throw new Error("useVisualSettings must be used inside VisualSettingsProvider");
  }
  return context;
}
