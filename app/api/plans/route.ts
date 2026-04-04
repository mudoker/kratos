import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { getPlans, savePlan } from "@/lib/data";
import type { WeeklyPlan } from "@/lib/types";

export async function GET() {
  const user = await requireUser();
  return NextResponse.json({
    plans: await getPlans(user.id),
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = (await request.json()) as Partial<WeeklyPlan>;
  const plan = await savePlan(user.id, {
    id: body.id || "",
    name: body.name?.trim() || "Weekly plan",
    notes: body.notes?.trim() || "",
    days: body.days ?? [],
  });
  return NextResponse.json({ plan });
}

export async function PUT(request: Request) {
  const user = await requireUser();
  const body = (await request.json()) as WeeklyPlan;
  if (!body.id) {
    return NextResponse.json({ error: "Plan not found." }, { status: 404 });
  }

  const plan = await savePlan(user.id, body);
  return NextResponse.json({ plan });
}
