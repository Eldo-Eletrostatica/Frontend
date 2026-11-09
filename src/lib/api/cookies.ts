export const CSRF_COOKIE = "csrf_token";
export const SESSION_COOKIE = "session";

// Reads a cookie value by name on the client. Returns undefined on the server
// or when the cookie is not set.
export function readCookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const prefix = `${name}=`;
  const cookie = document.cookie.split("; ").find((entry) => entry.startsWith(prefix));
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : undefined;
}
