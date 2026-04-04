"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Edit2, Plus, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { DashboardData, WeeklyPlan, WorkoutSession } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const baseSession = (): Partial<WorkoutSession> => ({
  id: undefined,
  planId: null,
  planDayId: null,
  startedAt: new Date().toISOString(),
  endedAt: new Date().toISOString(),
  day: 0,
  title: "",
  effort: "",
  notes: "",
  items: [],
});

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
    new Date(value)
  );

const createSessionFromDay = (plan: WeeklyPlan, dayId: string): Partial<WorkoutSession> => {
  const day = plan.days.find((entry) => entry.id === dayId);
  if (!day) return baseSession();  return {
    planId: plan.id,
    planDayId: day.id,
    endedAt: new Date().toISOString(),
    day: day.day,
    title: `${plan.name} • ${day.title}`,
    effort: "",
    notes: day.notes,
    items: day.items.map((item, order) => ({
      id: item.id,
      exerciseId: item.exerciseId,
      exerciseName: "",
      plannedSets: item.sets,
      reps: item.reps,
      restSeconds: item.restSeconds,
      targetLoad: item.targetLoad,
      targetRpe: item.targetRpe,
      result: "",
      notes: item.notes,
      order,
    })),
  };
};

export function WorkoutsPage({ data }: { data: DashboardData }) {
  const router = useRouter();
  const [sessions, setSessions] = useState(data.sessions);
  const firstPlan = data.plans[0] ?? null;
  const firstDayId = firstPlan?.days.find((day) => day.items.length)?.id ?? firstPlan?.days[0]?.id ?? "";
  const [planId, setPlanId] = useState(firstPlan?.id ?? "");
  const [dayId, setDayId] = useState(firstDayId);
  const [draft, setDraft] = useState<Partial<WorkoutSession>>(baseSession());
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedPlan = useMemo(() => data.plans.find((plan) => plan.id === planId) ?? null, [data.plans, planId]);
  const selectedDay = selectedPlan?.days.find((day) => day.id === dayId) ?? null;
  const completedResults = (draft.items || []).filter((item) => item.result.trim()).length;
  useEffect(() => {
    if (draft.id) return; // Don't overwrite if we are editing
    if (!selectedPlan || !dayId) {
      setDraft(baseSession());
      return;
    }

    const next = createSessionFromDay(selectedPlan, dayId);
    setDraft({
      ...next,
      items: (next.items || []).map((item) => ({
        ...item,
        exerciseName: data.exercises.find((exercise) => exercise.id === item.exerciseId)?.name || item.exerciseId,
      })),
    });
  }, [selectedPlan, dayId, data.exercises, draft.id]);

  const saveSession = async () => {
    setSaving(true);
    setStatus("");
    const isEdit = Boolean(draft.id);
    const response = await fetch("/api/workouts", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const payload = (await response.json()) as { session?: WorkoutSession; error?: string };
    if (!response.ok || !payload.session) {
      setStatus(payload.error || "Could not save the session.");
      setSaving(false);
      return;
    }
    setSessions((current) => [payload.session!, ...current.filter(s => s.id !== payload.session!.id)]);
    setStatus(isEdit ? "Session updated." : "Session saved.");
    setSaving(false);
    if (!isEdit) setDraft(baseSession());
    router.refresh();
  };

  const startEdit = (session: WorkoutSession) => {
    setDraft({
      ...session,
    });
    setPlanId(session.planId || "");
    setDayId(session.planDayId || "");
    setStatus("Editing session...");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!data.plans.length) {
    return (
      <Card className="p-6">
        <PageHeader
          eyebrow="Workout Studio"
          title="Load a planned day into a live session."
          description="Create a weekly plan first, then this screen will let you log the actual result beside each prescription."
        />
        <Button asChild className="mt-6">
          <Link href="/planner">Open Weekly Planner</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <Card className="p-6">
        <div className="flex items-center justify-between gap-2">
          <PageHeader
            eyebrow="Workout Studio"
            title={draft.id ? "Edit workout session" : "Load a planned day and log the real outcome."}
            description={draft.id ? "Updating a previously logged session." : "Load a planned day into a live session and log the actual result beside the prescription."}
          />
          {draft.id && (
            <Button variant="ghost" size="sm" onClick={() => { setDraft(baseSession()); setStatus(""); }}>
              <X className="h-4 w-4" />
              Cancel edit
            </Button>
          )}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Exercises loaded", String((draft.items || []).length)],
            ["Results logged", String(completedResults)],
            ["Day focus", selectedDay?.focus || "Unset"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                {label}
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto] items-end">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Plan</p>
            <Select
              value={planId}
              onValueChange={(value) => {
                setPlanId(value);
                const plan = data.plans.find((entry) => entry.id === value);
                setDayId(plan?.days.find((day) => day.items.length)?.id ?? plan?.days[0]?.id ?? "");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a plan" />
              </SelectTrigger>
              <SelectContent>
                {data.plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id}>
                    {plan.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Day</p>
            <Select value={dayId} onValueChange={setDayId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a day" />
              </SelectTrigger>
              <SelectContent>
                {(selectedPlan?.days ?? []).map((day) => (
                  <SelectItem key={day.id} value={day.id}>
                    {day.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={saveSession} disabled={saving || !(draft.items || []).length}>
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : draft.id ? "Update session" : "Save session"}
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Session title</p>
            <Input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Session title"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Readiness / Effort</p>
            <Input
              value={draft.effort}
              onChange={(event) => setDraft((current) => ({ ...current, effort: event.target.value }))}
              placeholder="Readiness or effort"
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Notes</p>
          <Textarea
            value={draft.notes}
            onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
            placeholder="How did the day go? What changed from the original prescription?"
          />
        </div>

        <div className="mt-6 space-y-4">
          {(draft.items || []).map((item, index) => (
            <div key={`${item.exerciseId}-${index}`} className="rounded-[28px] border border-[color:var(--border)] bg-white/60 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-[color:var(--foreground)]">{item.exerciseName}</p>
                  <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                    Prescription for {selectedDay?.title || "today"}
                  </p>
                </div>
                <Badge>{item.restSeconds}s rest</Badge>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="rounded-[24px] border border-[color:var(--border)] bg-black/[0.03] p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    Prescription
                  </p>
                  <div className="mt-4 space-y-3 text-sm text-[color:var(--foreground)]">
                    <p>
                      {item.plannedSets} sets x {item.reps}
                    </p>
                    <p>Target load: {item.targetLoad || "Not set"}</p>
                    <p>Target RPE: {item.targetRpe || "Not set"}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Actual result</p>
                    <Input
                      value={item.result}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          items: (current.items || []).map((entry, currentIndex) =>
                            currentIndex === index ? { ...entry, result: event.target.value } : entry
                          ),
                        }))
                      }
                      placeholder="Actual result, e.g. 100kg x 8,8,7"
                    />
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Execution notes</p>
                    <Textarea
                      value={item.notes}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          items: (current.items || []).map((entry, currentIndex) =>
                            currentIndex === index ? { ...entry, notes: event.target.value } : entry
                          ),
                        }))
                      }
                      placeholder="Execution notes, pain signals, tempo changes, or missed targets"
                      className="min-h-[110px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {status ? (
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-[color:var(--support)]">
            <CheckCircle2 className="h-4 w-4" />
            {status}
          </div>
        ) : null}
      </Card>

      <Card className="p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
          Logged sessions
        </p>
        <CardTitle className="mt-2">Recent execution history</CardTitle>
        <CardDescription className="mt-2">
          Review what you actually performed before asking the coach to adjust next week.
        </CardDescription>

        <div className="mt-6 space-y-3">
          {sessions.length ? (
            sessions.map((session) => (
              <div key={session.id} className="group relative rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4 transition hover:bg-white/80">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[color:var(--foreground)]">{session.title}</p>
                    <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{formatDate(session.startedAt)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{session.items.length} exercises</Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 opacity-0 transition group-hover:opacity-100"
                      onClick={() => startEdit(session)}
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {session.notes || session.effort || "No notes captured."}
                </p>
              </div>
            ))
          ) : (
            <p className="rounded-[24px] border border-dashed border-[color:var(--border-strong)] p-5 text-sm text-[color:var(--muted-foreground)]">
              Session history will appear here once you save a training day.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
