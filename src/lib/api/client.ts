"use client";

import { readJson } from "./response";

// Browser calls to the Backend, always through this site's /api proxy, so the
// session cookie goes along (ADR 0007).
const API_PREFIX = "/api";
const CSRF_COOKIE = "csrf_token";
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
}

function readCookie(name: string): string | undefined {
  const prefix = `${name}=`;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}

export async function sendApiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
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
  return readJson<T>(response);
}

// Alias for backward compatibility.
export const apiRequest = sendApiRequest;
