import { auth } from "@/lib/auth";
import { NextResponse, type NextRequest } from "next/server";

const authMiddleware = auth.middleware({ loginUrl: "/login" });

export default function middleware(request: NextRequest) {
  if (process.env.KRATOS_E2E_AUTH_BYPASS === "true") {
    return NextResponse.next();
  }

  return authMiddleware(request);
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|favicon.svg|manifest.json|icons.svg|sw.js|logo.png).*)",
  ],
};
