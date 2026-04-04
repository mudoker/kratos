import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMigrations } from "better-auth/db/migration";
import { kysely } from "@/lib/db";
import type { AppUser } from "@/lib/types";

export const auth = betterAuth({
  database: {
    db: kysely,
    type: "postgres",
  },
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "dev-better-auth-secret",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ||
    "http://localhost:3003",
  basePath: "/api/auth",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
  },
  plugins: [nextCookies()],
});

let authTablesReady: Promise<void> | null = null;

export const ensureAuthTables = async () => {
  if (!authTablesReady) {
    authTablesReady = (async () => {
      const migrations = await getMigrations(auth.options);
      await migrations.runMigrations();
    })();
  }

  await authTablesReady;
};

export const getCurrentUser = async (): Promise<AppUser | null> => {
  await ensureAuthTables();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
