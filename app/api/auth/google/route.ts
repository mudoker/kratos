import { NextResponse, type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const response = await fetch(`${origin}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      provider: "google",
      callbackURL: `${origin}/dashboard`,
      errorCallbackURL: `${origin}/login`,
      disableRedirect: true,
    }),
  });

  const payload = (await response.json()) as { url?: string; error?: string; message?: string };

  if (!response.ok || !payload.url) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("error", payload.error || payload.message || "google_oauth");
    return NextResponse.redirect(loginUrl);
  }

  const redirect = NextResponse.redirect(payload.url);
  response.headers.getSetCookie().forEach((cookie) => {
    redirect.headers.append("Set-Cookie", cookie);
  });

  return redirect;
}
