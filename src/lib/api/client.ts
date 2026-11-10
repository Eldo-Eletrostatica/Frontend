"use client";

import { CSRF_COOKIE, readCookie } from "./cookies";
import { parseApiError } from "./ApiError";
import { readJson } from "./response";
import { buildLoginPath, isInternalAreaPath } from "@/lib/auth/loginRedirect";

// Browser calls to the Backend, always through this site's /api proxy, so the
// session cookie goes along (ADR 0007).
const API_PREFIX = "/api";
const CSRF_HEADER = "X-CSRF-Token";
// Writes authenticated by the session cookie must echo the CSRF token.
const CSRF_PROTECTED_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface ApiRequestOptions {
  method?: HttpMethod;
  // Sent as JSON.
  body?: unknown;
  // Sent as multipart, for file uploads.
  formData?: FormData;
  // When true, does not automatically navigate to login on 401 inside the
  // internal area (useful for initial session bootstrap).
  skipAuthRedirect?: boolean;
}

// Sends the request with the CSRF header and, on a 401 inside the internal
// area, takes the employee to the login. Callers read the body their own way.
async function fetchFromApi(path: string, options: ApiRequestOptions = {}): Promise<Response> {
  const method = options.method ?? "GET";
  const headers = new Headers();

  if (CSRF_PROTECTED_METHODS.has(method)) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) headers.set(CSRF_HEADER, csrfToken);
  }

  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers.set("Content-Type", "application/json");
    body = JSON.stringify(options.body);
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    method,
    headers,
    body,
    credentials: "same-origin",
  });

  // A 401 response during active browsing in the internal area redirects
  // immediately to login preserving the current destination in "next".
  if (response.status === 401 && !options.skipAuthRedirect && typeof window !== "undefined") {
    const { pathname, search } = window.location;
    if (isInternalAreaPath(pathname)) {
      window.location.assign(buildLoginPath(`${pathname}${search}`));
    }
  }

  return response;
}

export async function sendApiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  return readJson<T>(await fetchFromApi(path, options));
}

export interface DownloadedFile {
  content: Blob;
  fileName: string;
}

// The Backend names the file in Content-Disposition, such as
// attachment; filename="relatorio-estatisticas-2026-10-01-a-2026-10-31.pdf".
const FILE_NAME_PATTERN = /filename="([^"]+)"/;

// For routes that answer a file instead of JSON. Errors keep the Backend
// message, like any other request.
export async function downloadApiFile(path: string, fallbackFileName: string): Promise<DownloadedFile> {
  const response = await fetchFromApi(path);
  if (!response.ok) throw await parseApiError(response);
  const disposition = response.headers.get("Content-Disposition") ?? "";
  return {
    content: await response.blob(),
    fileName: FILE_NAME_PATTERN.exec(disposition)?.[1] ?? fallbackFileName,
  };
}
