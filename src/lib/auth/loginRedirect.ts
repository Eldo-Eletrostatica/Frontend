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

function isInternalAreaPath(pathname: string): boolean {
  const isInsideInternalArea = pathname === ROUTES.internalArea || pathname.startsWith(`${ROUTES.internalArea}/`);
  return isInsideInternalArea && pathname !== ROUTES.internalLogin;
}

// The "next" parameter comes from the address bar, so anything that is not a
// path inside the internal area falls back to it, which blocks open redirects.
export function findPathAfterLogin(searchParams: URLSearchParams): string {
  const requestedPath = searchParams.get(NEXT_PATH_PARAM);
  if (!requestedPath) return ROUTES.internalArea;

  let url: URL;
  try {
    url = new URL(requestedPath, PLACEHOLDER_ORIGIN);
  } catch {
    return ROUTES.internalArea;
  }

  if (url.origin !== PLACEHOLDER_ORIGIN || !isInternalAreaPath(url.pathname)) return ROUTES.internalArea;
  return `${url.pathname}${url.search}${url.hash}`;
}
