import { sendApiRequest } from "@/lib/api/client";
import type { VisualSettings } from "@/components/public/publicContent";

export interface EstimatorSettings {
  isEnabled: boolean;
  // Percentage added to the minimum price to get the maximum, 0..100.
  negotiationMargin: number;
}

export type VisualSettingsInput = VisualSettings;

// Draft is what the admin is editing; published is what the site shows.
export function fetchVisualDraft() {
  return sendApiRequest<VisualSettings>("/site-settings/visual/draft");
}

export function updateVisualDraft(input: Partial<VisualSettingsInput>) {
  return sendApiRequest<VisualSettings>("/site-settings/visual/draft", {
    method: "PATCH",
    body: input,
  });
}

export function publishVisualSettings() {
  return sendApiRequest<VisualSettings>("/site-settings/visual/publish", { method: "POST" });
}

export function discardVisualDraft() {
  return sendApiRequest<VisualSettings>("/site-settings/visual/draft/discard", { method: "POST" });
}

export function restoreDefaultVisualSettings() {
  return sendApiRequest<VisualSettings>("/site-settings/visual/restore-default", { method: "POST" });
}

export function fetchEstimatorSettings() {
  return sendApiRequest<EstimatorSettings>("/site-settings/estimator");
}

export function updateEstimatorSettings(input: Partial<EstimatorSettings>) {
  return sendApiRequest<EstimatorSettings>("/site-settings/estimator", {
    method: "PATCH",
    body: input,
  });
}

export async function uploadVisualImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { url } = await sendApiRequest<{ url: string }>("/site-settings/visual/images", {
    method: "POST",
    formData,
  });
  return url;
}
