import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteSession, getSessions, saveSession } from "@/lib/data";
import type { WorkoutSession } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await requireUser();
  return NextResponse.json({
    sessions: await getSessions(user.id),
  });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = (await request.json()) as Partial<WorkoutSession>;
  const session = await saveSession(user.id, {
    id: body.id,
    planId: body.planId ?? null,
    planDayId: body.planDayId ?? null,
    startedAt: body.startedAt,
    endedAt: body.endedAt ?? new Date().toISOString(),
    day: body.day ?? 0,
    title: body.title?.trim() || "Workout session",
    effort: body.effort?.trim() || "",
    notes: body.notes?.trim() || "",
    items: body.items ?? [],
  });
  return NextResponse.json({ session });
}

export async function PUT(request: Request) {
  const user = await requireUser();
  const body = (await request.json()) as WorkoutSession;
  if (!body.id) {
    return NextResponse.json({ error: "Workout session not found." }, { status: 404 });
  }

  const session = await saveSession(user.id, body);
  return NextResponse.json({ session });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Session ID is required." }, { status: 400 });
  }

  await deleteSession(user.id, id);
  return NextResponse.json({ ok: true });
}
