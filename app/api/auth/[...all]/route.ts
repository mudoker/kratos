import { toNextJsHandler } from "better-auth/next-js";
import { auth, ensureAuthTables } from "@/lib/auth";

const handler = toNextJsHandler(auth);

export async function GET(request: Request) {
  await ensureAuthTables();
  return handler.GET(request);
}

export async function POST(request: Request) {
  await ensureAuthTables();
  return handler.POST(request);
}

export async function PATCH(request: Request) {
  await ensureAuthTables();
  return handler.PATCH(request);
}

export async function PUT(request: Request) {
  await ensureAuthTables();
  return handler.PUT(request);
}

export async function DELETE(request: Request) {
  await ensureAuthTables();
  return handler.DELETE(request);
}
