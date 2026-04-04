import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { deleteRecord, getRecords, saveRecord } from "@/lib/data";
import type { PersonalRecord } from "@/lib/types";

export async function GET() {
  const user = await requireUser();
  return NextResponse.json({ records: await getRecords(user.id) });
}

export async function POST(request: Request) {
  const user = await requireUser();
  const body = (await request.json()) as Partial<PersonalRecord>;

  if (!body.exerciseId || typeof body.value !== "number" || !body.unit) {
    return NextResponse.json({ error: "Exercise, value, and unit are required." }, { status: 400 });
  }

  const record = await saveRecord(user.id, {
    id: body.id,
    exerciseId: body.exerciseId,
    value: body.value,
    unit: body.unit,
    reps: body.reps ?? 1,
    achievedAt: body.achievedAt || new Date().toISOString(),
    notes: body.notes ?? "",
  });

  return NextResponse.json({ record });
}

export async function PUT(request: Request) {
  const user = await requireUser();
  const body = (await request.json()) as PersonalRecord;

  if (!body.id) {
    return NextResponse.json({ error: "Record ID is required." }, { status: 400 });
  }

  const record = await saveRecord(user.id, body);
  return NextResponse.json({ record });
}

export async function DELETE(request: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Record ID is required." }, { status: 400 });
  }

  await deleteRecord(user.id, id);
  return NextResponse.json({ ok: true });
}
