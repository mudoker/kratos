import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getMigrations } from "better-auth/db/migration";
import { kysely, pool } from "@/lib/db";
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

  const mockUser: AppUser = {
    id: "mudoker-id",
    email: "mudoker@kratos.app",
    name: "mudoker",
    image: null,
  };

  try {
    await pool.query(
      `INSERT INTO "user" (id, email, name, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (id) DO NOTHING`,
      [mockUser.id, mockUser.email, mockUser.name]
    );
  } catch (err) {
    console.error("Failed to seed mock user:", err);
  }

  return mockUser;
};

export const requireUser = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
};
