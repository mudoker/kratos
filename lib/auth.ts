import { createNeonAuth } from "@neondatabase/auth/next/server";
import { redirect } from "next/navigation";
import { executeQuery, pool } from "@/lib/db";
import type { AppUser } from "@/lib/types";

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
  },
  logLevel: process.env.NODE_ENV === "test" ? "silent" : "warn",
});

const e2eUser: AppUser = {
  id: "mudoker-id",
  email: "mudoker@kratos.app",
  name: "mudoker",
  image: null,
};

const seedE2eUser = async () => {
  try {
    await executeQuery(
      pool,
      `CREATE TABLE IF NOT EXISTS "user" (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        "emailVerified" BOOLEAN NOT NULL DEFAULT true,
        image TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`
    );

    await executeQuery(
      pool,
      `INSERT INTO "user" (id, email, name, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, true, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [e2eUser.id, e2eUser.email, e2eUser.name]
    );
  } catch (err) {
    console.error("Failed to seed mock user:", err);
  }
};

export const getCurrentUser = async (): Promise<AppUser | null> => {
  if (process.env.KRATOS_E2E_AUTH_BYPASS === "true") {
    await seedE2eUser();
    return e2eUser;
  }

  const { data: session } = await auth.getSession();

  if (!session?.user) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || session.user.email,
    image: session.user.image ?? null,
  };
};

export const requireUser = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
};
