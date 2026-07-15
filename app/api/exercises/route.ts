import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { saveExercise } from "@/lib/data";
import type { Exercise } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await requireUser(); // Ensure authentication
  const body = (await request.json()) as Omit<Exercise, "createdAt" | "updatedAt">;

  if (!body.name || !body.category || !body.equipment) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  const exercise = await saveExercise({
    id: body.id || `custom_${Math.random().toString(36).substring(2, 15)}`,
    name: body.name.trim(),
    category: body.category,
    primaryMuscles: body.primaryMuscles || [],
    secondaryMuscles: body.secondaryMuscles || [],
    bodyRegionSlugs: body.bodyRegionSlugs || [],
    equipment: body.equipment,
    instructions: body.instructions || [],
    defaultRestSeconds: body.defaultRestSeconds || 90,
  });

  return NextResponse.json({ exercise });
}
