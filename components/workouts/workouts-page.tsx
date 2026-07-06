"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Edit2, Plus, Save, Trash2, X, Play, Dumbbell, History, Sparkles, Flame, Check, CalendarDays, Clock, ArrowRight, UserCheck, Loader2 } from "lucide-react";
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
import { cn } from "@/lib/utils";

const getItemTags = (notes: string, exerciseId: string, exerciseCategory?: string, exercises: any[] = []) => {
  const tags: Array<{ label: string; type: string; color: string }> = [];
  const lowerNotes = (notes || "").toLowerCase();
  const lowerId = (exerciseId || "").toLowerCase();
  
  const exercise = exercises.find(e => e.id === exerciseId);
  const exerciseName = exercise ? exercise.name.toLowerCase() : "";
  const categoryLower = (exerciseCategory || exercise?.category || "").toLowerCase();

  // 2. Standard auto-detected tags from notes
  if (lowerNotes.includes("superset") || lowerId.includes("superset")) {
    tags.push({ label: "SUPERSET", type: "superset", color: "bg-neutral-100 text-neutral-600 border-transparent" });
  }
  if (lowerNotes.includes("dropset") || lowerNotes.includes("drop-set") || lowerNotes.includes("drop set")) {
    tags.push({ label: "DROPSET", type: "dropset", color: "bg-neutral-100 text-neutral-600 border-transparent" });
  }
  if (lowerNotes.includes("warm-up") || lowerNotes.includes("warmup") || categoryLower === "mobility") {
    if (!tags.some(t => t.label === "WARM-UP")) {
      tags.push({ label: "WARM-UP", type: "warmup", color: "bg-neutral-100 text-neutral-600 border-transparent" });
    }
  }
  
  const hasStretch = (lowerNotes.includes("stretch") && !lowerNotes.includes("deep stretch") && !lowerNotes.includes("tempo")) || 
                     lowerNotes.includes("cooldown") || 
                     lowerNotes.includes("cool-down") || 
                     lowerNotes.includes("flow");
  if (hasStretch) {
    tags.push({ label: "STRETCH / FLOW", type: "stretch", color: "bg-neutral-100 text-neutral-600 border-transparent" });
  }

  // 3. Parse custom TAGS: line
  const tagsMatch = (notes || "").match(/TAGS:\s*([^\n\r]+)/i);
  if (tagsMatch && tagsMatch[1]) {
    const customList = tagsMatch[1].split(",").map(t => t.trim()).filter(Boolean);
    customList.forEach(tagName => {
      const upperName = tagName.toUpperCase();
      if (!tags.some(t => t.label === upperName)) {
        tags.push({ 
          label: upperName, 
          type: "custom", 
          color: "bg-slate-500/10 text-slate-700 border-slate-200" 
        });
      }
    });
  }

  return tags;
};

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
      <Card className="p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.05)] text-center max-w-xl mx-auto mt-12 rounded-[36px]">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-black/5 text-black rounded-2xl">
            <Dumbbell className="h-8 w-8" />
          </div>
        </div>
        <PageHeader
          eyebrow="Workout Studio"
          title="Load a planned day to log"
          description="Build a structured split schedule inside the Weekly Planner first. Once done, this workspace will load plans dynamically."
        />
        <Button asChild className="mt-8 py-5 rounded-2xl bg-black text-white hover:bg-black/90 font-bold uppercase tracking-wider text-xs shadow-lg">
          <Link href="/train" style={{ color: "#fff" }}>Open Splits Planner</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Compact header */}
      <div className="rounded-[24px] bg-black p-5 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">Active Runner</p>
            <h1 className="text-base font-black tracking-tight">Workout Studio</h1>
          </div>

          <div className="flex gap-2 items-center">
            {draft.id && (
              <Button
                variant="ghost"
                onClick={() => {
                  setDraft(baseSession());
                  setStatus("");
                }}
                className="h-8 rounded-xl border border-white/10 text-white hover:bg-white/10 px-3 text-xs font-semibold transition"
              >
                Cancel
              </Button>
            )}
            <Button 
              type="button" 
              onClick={saveSession} 
              disabled={saving || !(draft.items || []).length} 
              className="bg-white hover:bg-neutral-100 text-black rounded-xl font-bold text-xs px-4 h-8 border-none shadow-none transition flex items-center gap-1.5"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin text-black" /> : <Save className="h-3 w-3 text-black" />}
              <span>{draft.id ? "Update" : "Save"}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Core Layout Grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px] items-start">
        
        {/* Left Side: Logger Card */}
        <div className="space-y-6">
          <Card className="p-4 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-[24px] md:rounded-[32px] space-y-6">
            
            {/* Split loader bar */}
            <div className="p-3.5 sm:p-5 border border-black/5 bg-white/45 rounded-[20px] md:rounded-[24px] grid gap-3 sm:grid-cols-2 md:grid-cols-3 items-end">
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Choose Program Split</label>
                <Select
                  value={planId}
                  onValueChange={(value) => {
                    setPlanId(value);
                    const plan = data.plans.find((entry) => entry.id === value);
                    setDayId(plan?.days.find((day) => day.items.length)?.id ?? plan?.days[0]?.id ?? "");
                  }}
                >
                  <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-bold py-4">
                    <SelectValue placeholder="Choose plan" />
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

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Choose Training Day</label>
                <Select value={dayId} onValueChange={setDayId}>
                  <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-bold py-4">
                    <SelectValue placeholder="Choose day" />
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

              <div className="text-[11px] text-black/50 font-bold pb-3.5 pl-2">
                Active Program: <span className="text-black">{selectedPlan?.name}</span>
              </div>
            </div>

            {/* Title / effort details */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Session Title</label>
                <Input
                  value={draft.title}
                  onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
                  placeholder="e.g. Upper Body Focus - Volume Benchmark"
                  className="bg-white border-black/5 focus:border-black rounded-2xl py-4.5 px-4.5 text-sm font-semibold transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Readiness / RPE Effort (1-10)</label>
                <Input
                  value={draft.effort}
                  onChange={(event) => setDraft((current) => ({ ...current, effort: event.target.value }))}
                  placeholder="How strong did you feel? RPE 8..."
                  className="bg-white border-black/5 focus:border-black rounded-2xl py-4.5 px-4.5 text-sm font-semibold transition"
                />
              </div>
            </div>

            {/* Global notes */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Session Notes</label>
              <Textarea
                value={draft.notes}
                onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))}
                placeholder="Sleep debt, fatigue notes, nutrition details, overall session cues..."
                className="bg-white border-black/5 focus:border-black rounded-2xl text-sm min-h-[52px] py-3 px-4 transition"
              />
            </div>

            {/* Exercises List section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-black/5 pb-2">
                <h4 className="text-xs font-bold text-black/50">Exercise Telemetry Runner</h4>
                <Badge className="bg-black/5 border-transparent text-black/60 text-[10px] font-bold px-2 py-0.5">
                  {(draft.items || []).length} exercise{(draft.items || []).length !== 1 && "s"} loaded
                </Badge>
              </div>

              <div className="border border-black/[0.04] bg-white rounded-2xl divide-y divide-black/[0.04] shadow-[0_4px_16px_rgba(0,0,0,0.015)] overflow-hidden">
                {(draft.items || []).map((item, index) => {
                  const exercise = data.exercises.find((e) => e.id === item.exerciseId);
                  const tags = getItemTags(item.notes, item.exerciseId, exercise?.category, data.exercises);
                  const primaryTag = tags[0];
                  const borderClass = primaryTag
                    ? primaryTag.type === "superset"
                      ? "border-l-4 border-l-purple-500"
                      : primaryTag.type === "dropset"
                      ? "border-l-4 border-l-amber-500"
                      : primaryTag.type === "warmup"
                      ? "border-l-4 border-l-blue-500"
                      : "border-l-4 border-l-teal-500"
                    : "";

                  return (
                    <div
                      key={`${item.exerciseId}-${index}`}
                      className={cn("p-4.5 bg-white hover:bg-neutral-50/30 transition duration-200 space-y-4 relative", borderClass)}
                    >
                      {/* Exercise basic header */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-black/5 pb-3">
                        <div className="flex items-center gap-3">
                          {exercise?.imageUrl && (
                            <div className="h-10 w-10 overflow-hidden rounded-xl border border-black/5">
                              <img src={exercise.imageUrl} alt={item.exerciseName} className="h-full w-full object-cover" />
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-sm text-black leading-tight">{item.exerciseName}</p>
                            <p className="text-[10px] text-black/45 mt-1 font-bold">
                              prescribed rest {item.restSeconds}s
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag.label} className={cn("border text-[9px] font-extrabold px-2 py-0.5", tag.color)}>
                              {tag.label}
                            </Badge>
                          ))}
                          <Badge className="bg-black text-white text-[9px] font-extrabold py-0.5 px-2">
                            Lift {index + 1}
                          </Badge>
                        </div>
                      </div>

                      {/* Log Grid */}
                      <div className="grid gap-4 md:grid-cols-[200px_1fr] items-start">
                        
                        {/* Prescription specifications box */}
                        <div className="rounded-xl border border-black/5 bg-black/[0.02] p-4 text-xs space-y-3">
                          <div className="flex items-center gap-1.5 text-black/50 border-b border-black/5 pb-1.5 font-bold text-xs">
                            <Sparkles className="h-3 w-3 text-indigo-500" />
                            <span>Planned Prescription</span>
                          </div>
                          <div className="space-y-1.5 text-black/70 font-semibold leading-relaxed">
                            <div className="flex justify-between">
                              <span className="text-black/40 font-medium">Sets/Reps:</span>
                              <span>{item.plannedSets} x {item.reps}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black/40 font-medium">Load Goal:</span>
                              <span>{item.targetLoad || "No load"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-black/40 font-medium">RPE Goal:</span>
                              <span>{item.targetRpe || "No RPE"}</span>
                            </div>
                          </div>
                        </div>

                        {/* Outcomes logging form details */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b border-black/5 pb-1">
                            <p className="text-xs font-bold text-black/50">
                              Logged Outcomes
                            </p>
                            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs font-semibold text-black hover:bg-black/5 rounded-lg flex items-center gap-1" onClick={() => addSet(index)}>
                              <Plus className="h-3.5 w-3.5" />
                              <span>Add Set</span>
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {(item.sets || []).map((set, sIdx) => (
                              <div key={sIdx} className="flex items-center gap-3 bg-black/[0.01] p-1.5 rounded-xl border border-black/[0.02]">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-black text-white text-[9px] font-extrabold">
                                  {sIdx + 1}
                                </div>
                                <div className="grid flex-1 grid-cols-2 gap-2">
                                  <div className="relative flex items-center">
                                    <Input 
                                      value={set.weight} 
                                      placeholder="Load" 
                                      className="h-10 px-3 bg-white text-xs rounded-xl border-black/5 text-center font-bold"
                                      onChange={(e) => updateSet(index, sIdx, "weight", e.target.value)}
                                    />
                                    <span className="absolute right-3 text-[9px] font-extrabold text-black/30 pointer-events-none">kg</span>
                                  </div>
                                  <div className="relative flex items-center">
                                    <Input 
                                      value={set.reps} 
                                      placeholder="Reps" 
                                      className="h-10 px-3 bg-white text-xs rounded-xl border-black/5 text-center font-bold"
                                      onChange={(e) => updateSet(index, sIdx, "reps", e.target.value)}
                                    />
                                    <span className="absolute right-3 text-[9px] font-extrabold text-black/30 pointer-events-none">reps</span>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:bg-rose-50 rounded-lg shrink-0" onClick={() => removeSet(index, sIdx)}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Execution Lift Notes</label>
                            <Textarea
                              value={(item.notes || "").replace(/TAGS:\s*[^\n\r]+/i, "").trim()}
                              onChange={(event) => {
                                const cleanNotes = event.target.value;
                                const match = (item.notes || "").match(/TAGS:\s*([^\n\r]+)/i);
                                const tagsLine = match ? match[0] : "";
                                const nextNotes = tagsLine ? `${cleanNotes.trim()}\n${tagsLine}`.trim() : cleanNotes.trim();
                                setDraft((current) => ({
                                  ...current,
                                  items: (current.items || []).map((entry, currentIndex) =>
                                    currentIndex === index ? { ...entry, notes: nextNotes } : entry
                                  ),
                                }));
                              }}
                              placeholder="Missed sets, shoulder checks, tempo pacing..."
                              className="bg-white border-black/5 rounded-xl text-xs min-h-[46px] py-2.5 px-3.5 transition"
                            />
                          </div>

                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {status ? (
              <div className="mt-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                <span>{status}</span>
              </div>
            ) : null}

          </Card>
        </div>

        {/* Right Side: Execution Logs */}
        <div className="space-y-6 lg:sticky lg:top-4">
          <Card className="p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-[32px] space-y-6">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
              <History className="h-4 w-4 text-black/50" />
              <span className="text-xs font-bold text-black/50">Execution Logs</span>
            </div>

            <CardDescription className="text-xs text-black/50 mt-1 leading-relaxed">
              Verify your completed logs. Scrub records, edit details, or trace pacing timelines.
            </CardDescription>

            <ScrollArea className="h-[450px] -mr-2 pr-2">
              <div className="space-y-4 relative border-l border-black/5 pl-4 ml-2 pb-6">
                {sessions.length ? (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="relative group p-4 rounded-2xl border border-black/5 bg-white/45 hover:bg-white/80 hover:shadow-sm transition duration-300"
                    >
                      {/* Timeline bullet */}
                      <div className="absolute left-[-22px] top-5 w-3 h-3 rounded-full bg-black border-2 border-white shadow-sm" />
                      
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-sm text-black leading-snug">{session.title}</p>
                          <p className="text-[10px] text-black/40 mt-1 font-semibold">{formatDate(session.startedAt)}</p>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <Badge className="bg-black/5 border-transparent text-black/60 text-[10px] px-1.5 py-0.5">
                            {session.items.length} lift{session.items.length !== 1 && "s"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 rounded-md p-0 hover:bg-black/5 text-black/70 hover:text-black transition"
                            onClick={() => startEdit(session)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 rounded-md p-0 text-rose-500 hover:bg-rose-50 transition"
                            onClick={() => removeSession(session.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <p className="mt-2 text-xs leading-relaxed text-black/60 italic border-t border-black/5 pt-2">
                        {session.notes || session.effort || "No qualitative log captured."}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 text-black/40">
                    <Dumbbell className="h-10 w-10 mx-auto text-black/20 mb-3" />
                    <p className="text-xs font-semibold">No Sessions Logged</p>
                    <p className="text-[10px] mt-1 leading-relaxed text-black/30">Sync an active day above to establish your telemetry database.</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </Card>
        </div>

      </div>

    </div>
  );
}
