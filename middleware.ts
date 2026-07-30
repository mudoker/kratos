import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export default async function middleware(request: NextRequest) {
  if (process.env.KRATOS_E2E_AUTH_BYPASS === "true") {
    return NextResponse.next();
  }
  return auth.middleware({ loginUrl: "/login" })(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (login page)
     * - public (public assets)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|$).*)",
  ],
};
