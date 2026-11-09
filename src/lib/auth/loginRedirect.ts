import { ROUTES } from "@/lib/routes";

// Shared by the server proxy and the browser, so it imports nothing client-only.
const NEXT_PATH_PARAM = "next";
// Only lets URL resolve a relative path: a result with another origin means the
// value pointed outside the site, such as "//example.com".
const PLACEHOLDER_ORIGIN = "http://placeholder.invalid";

export function buildLoginPath(requestedPath: string): string {
  const params = new URLSearchParams({ [NEXT_PATH_PARAM]: requestedPath });
  return `${ROUTES.internalLogin}?${params}`;
}

export function isInternalAreaPath(pathname: string): boolean {
  const isInsideInternalArea = pathname === ROUTES.internalArea || pathname.startsWith(`${ROUTES.internalArea}/`);
  return isInsideInternalArea && pathname !== ROUTES.internalLogin;
}

// The "next" parameter comes from the address bar, so anything that is not a
// path inside the internal area falls back to the role's landing route, which
// blocks open redirects and skips landing on forbidden screens.
export function findPathAfterLogin(searchParams: URLSearchParams, role?: string): string {
  const requestedPath = searchParams.get(NEXT_PATH_PARAM);
  const defaultPath = role === "employee" ? ROUTES.serviceOrders : ROUTES.internalArea;
  if (!requestedPath) return defaultPath;

  let url: URL;
  try {
    url = new URL(requestedPath, PLACEHOLDER_ORIGIN);
  } catch {
    return defaultPath;
  }

  if (url.origin !== PLACEHOLDER_ORIGIN || !isInternalAreaPath(url.pathname)) return defaultPath;
  return `${url.pathname}${url.search}${url.hash}`;
}
