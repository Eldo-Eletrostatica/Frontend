import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE } from "@/lib/api/cookies";
import { buildLoginPath } from "@/lib/auth/loginRedirect";
import { ROUTES } from "@/lib/routes";

// Only checks that the session cookie exists, to skip rendering the internal
// area for visitors. The Backend validates the token on every request.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === ROUTES.internalLogin || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  return NextResponse.redirect(new URL(buildLoginPath(`${pathname}${search}`), request.url));
}

// Next statically analyzes the config object at build time, so matcher must be
// a string literal matching the internal area base path (ROUTES.internalArea).
export const config = {
  matcher: "/area-interna/:path*",
};
