import { redirect } from "next/navigation";
import { executeQuery, pool } from "@/lib/db";
import { auth } from "@/lib/auth";
import type { AppUser } from "@/lib/types";

const e2eUser: AppUser = {
  id: "mudoker-id",
  email: "mudoker@kratos.app",
  name: "mudoker",
  image: null,
};

const ensureUserTable = async () => {
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
};

const seedE2eUser = async () => {
  try {
    await ensureUserTable();

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

const syncAuthenticatedUser = async (user: AppUser) => {
  await ensureUserTable();

  await executeQuery(
    pool,
    `INSERT INTO "user" (id, email, name, image, "emailVerified", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, true, NOW(), NOW())
     ON CONFLICT (id) DO UPDATE SET
       email = EXCLUDED.email,
       name = EXCLUDED.name,
       image = EXCLUDED.image,
       "updatedAt" = NOW()`,
    [user.id, user.email, user.name, user.image]
  );
};

export const getCurrentUser = async (): Promise<AppUser | null> => {
  if (process.env.KRATOS_E2E_AUTH_BYPASS === "true") {
    await seedE2eUser();
    return e2eUser;
  }

  const { data: session } = await auth.getSession();

  if (!session?.user) return null;

  const user = {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name || session.user.email,
    image: session.user.image ?? null,
  };

  await syncAuthenticatedUser(user);
  return user;
};

export const requireUser = async () => {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
};
