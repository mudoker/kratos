import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deletePlan } from "@/lib/data";

export async function DELETE(_: Request, context: { params: Promise<{ planId: string }> }) {
  const user = await requireUser();
  const { planId } = await context.params;
  await deletePlan(user.id, planId);
  return NextResponse.json({ ok: true });
}
