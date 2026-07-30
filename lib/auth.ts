import { createNeonAuth } from "@neondatabase/auth/next/server";

const neonAuthBaseUrl =
  process.env.NEON_AUTH_BASE_URL ||
  "https://ep-billowing-hill-aygutuu1.neonauth.c-5.us-east-2.aws.neon.tech/neondb/auth";

const neonAuthCookieSecret =
  process.env.NEON_AUTH_COOKIE_SECRET ||
  process.env.BETTER_AUTH_SECRET ||
  process.env.AUTH_SECRET ||
  "dev-neon-auth-cookie-secret-must-be-32";

export const auth = createNeonAuth({
  baseUrl: neonAuthBaseUrl,
  cookies: {
    secret: neonAuthCookieSecret,
    sessionDataTtl: 300,
    sameSite: "lax",
  },
  logLevel: process.env.NODE_ENV === "test" ? "silent" : "warn",
});
