import { NextResponse, type NextRequest } from "next/server";
import { buildLoginPath } from "@/lib/auth/loginRedirect";
import { ROUTES } from "@/lib/routes";

const SESSION_COOKIE = "session";

// Only checks that the session cookie exists, to skip rendering the internal
// area for visitors. The Backend validates the token on every request.
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (pathname === ROUTES.internalLogin || request.cookies.has(SESSION_COOKIE)) return NextResponse.next();

  return NextResponse.redirect(new URL(buildLoginPath(`${pathname}${search}`), request.url));
}

export const config = {
  matcher: "/area-interna/:path*",
};
