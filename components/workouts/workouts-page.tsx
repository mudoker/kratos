"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Edit2, Plus, Save, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import type { WeeklyPlan, WorkoutSession, WorkoutSessionItem, WorkoutSet } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useData } from "@/components/shared/data-provider";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  if (!day) return baseSession();
  return {
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
      sets: Array.from({ length: item.sets }).map(() => ({ weight: "", reps: "" })),
      notes: item.notes,
      order,
    })),
  };
};

export function WorkoutsPage() {
  const data = useData();
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
  
  const completedResults = useMemo(() => {
    return (draft.items || []).filter((item) => item.sets.some(s => s.weight.trim() || s.reps.trim())).length;
  }, [draft.items]);

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
    setSessions((current) => [payload.session!, ...current.filter((s) => s.id !== payload.session!.id)]);
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

  const removeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    const response = await fetch(`/api/workouts?id=${sessionId}`, { method: "DELETE" });
    if (response.ok) {
      setSessions((current) => current.filter((s) => s.id !== sessionId));
      if (draft.id === sessionId) {
        setDraft(baseSession());
        setStatus("");
      }
      router.refresh();
    }
  };

  const updateSet = (itemIndex: number, setIndex: number, field: keyof WorkoutSet, value: string) => {
    setDraft(current => ({
      ...current,
      items: (current.items || []).map((item, idx) => 
        idx === itemIndex 
          ? {
              ...item,
              sets: item.sets.map((s, sIdx) => 
                sIdx === setIndex ? { ...s, [field]: value } : s
              )
            }
          : item
      )
    }));
  };

  const addSet = (itemIndex: number) => {
    setDraft(current => ({
      ...current,
      items: (current.items || []).map((item, idx) => 
        idx === itemIndex 
          ? { ...item, sets: [...item.sets, { weight: "", reps: "" }] }
          : item
      )
    }));
  };

  const removeSet = (itemIndex: number, setIndex: number) => {
    setDraft(current => ({
      ...current,
      items: (current.items || []).map((item, idx) => 
        idx === itemIndex 
          ? { ...item, sets: item.sets.filter((_, sIdx) => sIdx !== setIndex) }
          : item
      )
    }));
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
            description={
              draft.id
                ? "Updating a previously logged session."
                : "Load a planned day into a live session and log the actual result beside the prescription."
            }
          />
          {draft.id && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft(baseSession());
                setStatus("");
              }}
            >
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
              <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)] truncate whitespace-nowrap overflow-hidden max-w-full">
                {value}
              </p>
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
              <SelectTrigger className="w-full truncate overflow-hidden whitespace-nowrap max-w-[240px]">
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
              <SelectTrigger className="w-full truncate overflow-hidden whitespace-nowrap max-w-[240px]">
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
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
              Session title
            </p>
            <Input
              value={draft.title}
              onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
              placeholder="Session title"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
              Readiness / Effort
            </p>
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

        <div className="mt-6 h-[800px] overflow-hidden rounded-2xl border border-[color:var(--border)] bg-black/[0.02]">
          <ScrollArea className="h-full w-full pr-4 p-4">
            <div className="space-y-4">
              {(draft.items || []).map((item, index) => {
                const exercise = data.exercises.find((e) => e.id === item.exerciseId);
                return (
                  <div
                    key={`${item.exerciseId}-${index}`}
                    className="rounded-[28px] border border-[color:var(--border)] bg-white/60 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        {exercise?.imageUrl && (
                          <div className="h-12 w-12 overflow-hidden rounded-xl border border-[color:var(--border)]">
                            <img src={exercise.imageUrl} alt={item.exerciseName} className="h-full w-full object-cover" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-[color:var(--foreground)]">{item.exerciseName}</p>
                          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                            Prescription for {selectedDay?.title || "today"}
                          </p>
                        </div>
                      </div>
                      <Badge>{item.restSeconds}s rest</Badge>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
                      <div className="rounded-[24px] border border-[color:var(--border)] bg-black/[0.03] p-4 h-fit">
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

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                              Actual Sets
                            </p>
                            <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px]" onClick={() => addSet(index)}>
                              <Plus className="h-3 w-3 mr-1" /> Add Set
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {(item.sets || []).map((set, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-2">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/5 text-[10px] font-bold">
                                  {sIdx + 1}
                                </div>
                                <div className="grid flex-1 grid-cols-2 gap-2">
                                  <Input 
                                    value={set.weight} 
                                    placeholder="kg" 
                                    className="h-9 px-3 text-xs"
                                    onChange={(e) => updateSet(index, sIdx, "weight", e.target.value)}
                                  />
                                  <Input 
                                    value={set.reps} 
                                    placeholder="reps" 
                                    className="h-9 px-3 text-xs"
                                    onChange={(e) => updateSet(index, sIdx, "reps", e.target.value)}
                                  />
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-[color:var(--danger)]" onClick={() => removeSet(index, sIdx)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">
                            Execution notes
                          </p>
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
                            className="min-h-[80px] text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
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
              <div
                key={session.id}
                className="group relative rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4 transition hover:bg-white/80"
              >
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
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 rounded-full p-0 text-[color:var(--danger)] opacity-0 transition group-hover:opacity-100 hover:bg-[color:var(--danger-soft)]"
                      onClick={() => removeSession(session.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
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
