"use client";

import { CSRF_COOKIE, readCookie } from "./cookies";
import { readJson } from "./response";
import { buildLoginPath, isInternalAreaPath } from "@/lib/auth/loginRedirect";

// Browser calls to the Backend, always through this site's /api proxy, so the
// session cookie goes along (ADR 0007).
const API_PREFIX = "/api";
const CSRF_HEADER = "X-CSRF-Token";
const CAPTCHA_HEADER = "X-Captcha-Token";
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
  // Turnstile token required by the Backend on the public forms.
  captchaToken?: string;
}

export async function sendApiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const headers = new Headers();

  if (CSRF_PROTECTED_METHODS.has(method)) {
    const csrfToken = readCookie(CSRF_COOKIE);
    if (csrfToken) headers.set(CSRF_HEADER, csrfToken);
  }
  if (options.captchaToken) headers.set(CAPTCHA_HEADER, options.captchaToken);

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

  return readJson<T>(response);
}
