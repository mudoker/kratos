import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { saveProfile } from "@/lib/data";

export async function PUT(request: Request) {
  const user = await requireUser();
  const body = (await request.json()) as {
    goal?: string;
    experienceLevel?: string;
    weeklySessions?: number;
    age?: number;
    weight?: number;
    height?: number;
    injuries?: string;
    notes?: string;
    bodyGender?: "male" | "female";
  };

  await saveProfile(user.id, {
    goal: body.goal ?? "",
    experienceLevel: body.experienceLevel ?? "",
    weeklySessions: body.weeklySessions ?? 0,
    age: body.age,
    weight: body.weight,
    height: body.height,
    injuries: body.injuries ?? "",
    notes: body.notes ?? "",
    bodyGender: body.bodyGender ?? "male",
  });

  return NextResponse.json({ ok: true });
}
