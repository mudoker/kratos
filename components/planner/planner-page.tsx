"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Plus, Save, Trash2, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { WeeklyPlan } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlanAnalysis } from "./plan-analysis";
import { useData } from "@/components/shared/data-provider";
import { motion, Reorder, useDragControls } from "framer-motion";
import { cn } from "@/lib/utils";

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const randomId = () => Math.random().toString(36).substring(2, 15);
const createDraftId = () => `draft_${randomId()}`;
const isPersistedId = (id: string) => Boolean(id) && !id.startsWith("draft_");

const blankPlan = (userId: string, name = "New weekly split"): WeeklyPlan => ({
  id: createDraftId(),
  userId,
  name,
  notes: "",
  orderIndex: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  days: [
    {
      id: `draft-day-${randomId()}`,
      day: 0,
      title: "Day 1",
      focus: "",
      warmup: "",
      sessionGoal: "",
      targetMuscles: [],
      notes: "",
      items: [],
    },
  ],
});

function DayTab({ day }: { day: WeeklyPlan["days"][number] }) {
  const controls = useDragControls();
  const [isPressing, setIsPressing] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsPressing(true);
    timerRef.current = setTimeout(() => {
      controls.start(e);
      setIsPressing(false);
    }, 1000);
  };

  const handlePointerUp = () => {
    setIsPressing(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <Reorder.Item
      value={day}
      dragListener={false}
      dragControls={controls}
      className="relative"
    >
      <TabsTrigger 
        value={String(day.day)}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={cn(
          "transition-all duration-300",
          isPressing && "scale-95 opacity-80 bg-black/5"
        )}
      >
        {day.title.slice(0, 3)}
      </TabsTrigger>
      {isPressing && (
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ duration: 1.0, ease: "linear" }}
          className="absolute bottom-0 left-0 h-0.5 bg-[color:var(--brand)]"
        />
      )}
    </Reorder.Item>
  );
}

export function PlannerPage() {
  const data = useData();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedDayValue, setSelectedDayValue] = useState("0");
  const [saving, setSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [message, setMessage] = useState("");

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setIsClient(true);
    const initial = data.plans.length ? data.plans : [blankPlan(data.user.id)];
    setPlans(initial);
    setSelectedPlanId(initial[0].id);
    setSelectedDayValue(String(initial[0].days[0]?.day ?? 0));
  }, [data.plans, data.user.id]);

  const selectedPlan =
    plans.find((plan) => plan.id === selectedPlanId) || plans[0] || blankPlan(data.user.id);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (!isPersistedId(selectedPlan.id)) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        await fetch("/api/plans", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(selectedPlan),
        });
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 1500);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [plans, selectedPlan]);

  useEffect(() => {
    if (selectedPlan) {
      // Keep selected day value in sync when switching plans
      setSelectedDayValue(String(selectedPlan.days[0]?.day ?? 0));
    }
  }, [selectedPlanId]);

  const exerciseOptions = useMemo(
    () => data.exercises.map((exercise) => ({ value: exercise.id, label: exercise.name })),
    [data.exercises]
  );

  const weeklyLiftCount = selectedPlan.days.reduce((count, day) => count + day.items.length, 0);
  const programmedDays = selectedPlan.days.filter(
    (day) => day.items.length || day.focus || day.sessionGoal || day.warmup || day.notes
  ).length;
  const prFocusCount = selectedPlan.days.reduce(
    (count, day) => count + day.items.filter((item) => item.prGoal.trim()).length,
    0
  );

  const patchSelectedPlan = (updater: (plan: WeeklyPlan) => WeeklyPlan) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === selectedPlan.id ? updater(plan) : plan))
    );
  };

  const updateDay = (dayId: string, updater: (day: WeeklyPlan["days"][number]) => WeeklyPlan["days"][number]) => {
    patchSelectedPlan((plan) => ({
      ...plan,
      days: plan.days.map((entry) => (entry.id === dayId ? updater(entry) : entry)),
    }));
  };

  const updateItem = (
    dayId: string,
    itemIndex: number,
    updater: (item: WeeklyPlan["days"][number]["items"][number]) => WeeklyPlan["days"][number]["items"][number]
  ) => {
    updateDay(dayId, (day) => ({
      ...day,
      items: day.items.map((item, currentIndex) => (currentIndex === itemIndex ? updater(item) : item)),
    }));
  };

  const createPlan = () => {
    const next = blankPlan(data.user.id, `Split ${plans.length + 1}`);
    setPlans((current) => [next, ...current]);
    setSelectedPlanId(next.id);
    setSelectedDayValue(String(next.days[0]?.day ?? 0));
    setMessage("");
  };

  const addExercise = (dayIndex: number) => {
    const targetDay = selectedPlan.days.find(d => d.day === dayIndex);
    if (!targetDay) return;

    updateDay(targetDay.id, (day) => ({
      ...day,
      items: [
        ...day.items,
        {
          id: `draft-item-${randomId()}`,
          exerciseId: data.exercises[0]?.id ?? "",
          sets: 3,
          reps: "8-10",
          restSeconds: 90,
          targetLoad: "",
          targetRpe: "8",
          prGoal: "",
          notes: "",
          order: day.items.length,
        },
      ],
    }));
  };

  const addDay = () => {
    if (selectedPlan.days.length >= 7) return;
    const maxDay = Math.max(...selectedPlan.days.map(d => d.day), -1);
    const nextDay = maxDay + 1;
    patchSelectedPlan((plan) => ({
      ...plan,
      days: [
        ...plan.days,
        {
          id: `draft-day-${randomId()}`,
          day: nextDay,
          title: `Day ${nextDay + 1}`,
          focus: "",
          warmup: "",
          sessionGoal: "",
          targetMuscles: [],
          notes: "",
          items: [],
        },
      ],
    }));
    setSelectedDayValue(String(nextDay));
  };

  const reorderDays = (newDays: WeeklyPlan["days"]) => {
    const reindexedDays = newDays.map((d, idx) => ({
      ...d,
      day: idx,
    }));
    patchSelectedPlan((plan) => ({
      ...plan,
      days: reindexedDays,
    }));
    // We update the selection to follow the new index of the currently active day if it moved
    // but here it's simpler to just keep the visual content.
    // If we want to keep the same day selected:
    const currentDayId = selectedPlan.days.find(d => String(d.day) === selectedDayValue)?.id;
    if (currentDayId) {
      const newIndex = reindexedDays.findIndex(d => d.id === currentDayId);
      if (newIndex !== -1) {
        setSelectedDayValue(String(newIndex));
      }
    }
  };

  const removeDay = (dayId: string) => {
    if (selectedPlan.days.length <= 1) return;
    patchSelectedPlan((plan) => {
      const remainingDays = plan.days.filter((d) => d.id !== dayId);
      return {
        ...plan,
        days: remainingDays,
      };
    });
    // Fallback to first day after removal
    setSelectedDayValue(String(selectedPlan.days[0].day));
  };

  const savePlan = async () => {
    setSaving(true);
    setMessage("");
    const persisted = isPersistedId(selectedPlan.id);
    const response = await fetch("/api/plans", {
      method: persisted ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...selectedPlan,
        id: persisted ? selectedPlan.id : "",
      }),
    });

    const payload = (await response.json()) as { plan?: WeeklyPlan; error?: string };
    if (!response.ok || !payload.plan) {
      setMessage(payload.error || "Could not save the plan.");
      setSaving(false);
      return;
    }

    setPlans((current) => [
      payload.plan!,
      ...current.filter((plan) => plan.id !== selectedPlan.id && plan.id !== payload.plan!.id),
    ]);
    setSelectedPlanId(payload.plan.id);
    setMessage("Plan saved.");
    setSaving(false);
    router.refresh();
  };

  const removePlan = async () => {
    if (!confirm("Are you sure you want to delete this plan?")) return;
    if (!isPersistedId(selectedPlan.id)) {
      const remainingDrafts = plans.filter((plan) => plan.id !== selectedPlan.id);
      const nextPlans = remainingDrafts.length ? remainingDrafts : [blankPlan(data.user.id)];
      setPlans(nextPlans);
      setSelectedPlanId(nextPlans[0]?.id ?? "");
      setSelectedDayValue(String(nextPlans[0]?.days[0]?.day ?? 0));
      return;
    }

    await fetch(`/api/plans/${selectedPlan.id}`, { method: "DELETE" });
    const remaining = plans.filter((plan) => plan.id !== selectedPlan.id);
    const nextPlans = remaining.length ? remaining : [blankPlan(data.user.id)];
    setPlans(nextPlans);
    setSelectedPlanId(nextPlans[0]?.id ?? "");
    setSelectedDayValue(String(nextPlans[0]?.days[0]?.day ?? 0));
    router.refresh();
  };

  if (!isClient) return null;

  return (
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="h-fit p-5">
        <PageHeader
          eyebrow="Planner"
          title="Map the full training week."
          description="Program each day with focus, warm-up, target load, RPE, PR goals, and exercise notes."
        />

        <Button type="button" variant="secondary" onClick={createPlan} className="mt-5 w-full">
          <Plus className="h-4 w-4" />
          New split
        </Button>

        <ScrollArea className="mt-6 h-auto max-h-[400px] pr-3">
          <div className="space-y-3">
            {plans.map((plan) => (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlanId(plan.id)}
                className={`w-full rounded-[24px] border p-4 text-left transition ${
                  plan.id === selectedPlan.id
                    ? "border-[color:var(--brand)] bg-black/6"
                    : "border-[color:var(--border)] bg-white/55 hover:bg-white/70"
                }`}
              >
                <p className="font-semibold text-[color:var(--foreground)]">{plan.name}</p>
                <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                  {plan.days.reduce((count, day) => count + day.items.length, 0)} lifts across the week
                </p>
              </button>
            ))}
          </div>
        </ScrollArea>

        <Card className="mt-6 p-5">
          <CardTitle className="text-lg">Keep PR tracking separate</CardTitle>
          <CardDescription className="mt-2 leading-6">
            The planner stays focused on weekly programming. PRs, momentum, and performance review live in Progress Lab.
          </CardDescription>
          <Button asChild className="mt-5 w-full text-white!">
            <Link href="/progress">
              Open Progress Lab
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </Card>

      <Card className="p-6 overflow-hidden flex flex-col">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <CardTitle>{selectedPlan.name}</CardTitle>
            <CardDescription className="mt-2">
              Separate the weekly intent from day-by-day prescription, then keep PR targets attached to the exact lift.
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            {isAutoSaving && (
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[color:var(--brand)] animate-pulse mr-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Auto-Saving
              </div>
            )}
            <Button type="button" variant="secondary" onClick={removePlan}>
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
            <Button type="button" onClick={savePlan} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save plan"}
            </Button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["Programmed days", String(programmedDays)],
            ["Total lifts", String(weeklyLiftCount)],
            ["PR focus points", String(prFocusCount)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[24px] border border-[color:var(--border)] bg-white/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                {label}
              </p>
              <p className="mt-2 font-[family:var(--font-display)] text-3xl font-semibold text-[color:var(--foreground)]">
                {value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Plan name</p>
            <Input
              value={selectedPlan.name}
              onChange={(event) => patchSelectedPlan((plan) => ({ ...plan, name: event.target.value }))}
              placeholder="Plan name"
            />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">General notes</p>
            <Textarea
              value={selectedPlan.notes}
              onChange={(event) => patchSelectedPlan((plan) => ({ ...plan, notes: event.target.value }))}
              placeholder="High-level notes"
              className="min-h-[96px]"
            />
          </div>
        </div>

        <Tabs value={selectedDayValue} onValueChange={setSelectedDayValue} className="mt-6 flex flex-col flex-1 min-h-0">
          <TabsList className="shrink-0 flex-wrap h-auto gap-y-1 items-center bg-transparent border-none p-0">
            <Reorder.Group 
              axis="x" 
              values={selectedPlan.days} 
              onReorder={reorderDays}
              className="flex flex-wrap gap-1 items-center"
            >
              {selectedPlan.days.map((day) => (
                <DayTab key={day.id} day={day} />
              ))}
            </Reorder.Group>
            
            {selectedPlan.days.length < 7 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.preventDefault();
                  addDay();
                }}
                className="h-8 px-2 text-xs gap-1 opacity-60 hover:opacity-100 self-center"
              >
                <Plus className="h-3 w-3" />
                Add day
              </Button>
            )}
            <div className="mx-1 w-px h-4 bg-[color:var(--border)]" />
            <TabsTrigger value="analysis" className="gap-2">
              <ArrowRight className="h-3.5 w-3.5" />
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="mt-6 flex-1 min-h-0 overflow-auto">
            <PlanAnalysis plan={selectedPlan} data={data} />
          </TabsContent>

          {selectedPlan.days.map((day) => (
            <TabsContent key={day.id} value={String(day.day)} className="mt-6 flex-1 min-h-0 outline-none">
              <ScrollArea className="h-screen -mx-4 px-4 pr-6">
                <div className="space-y-8 pb-10">
                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      ["Focus", day.focus || "Unset"],
                      ["Warm-up", day.warmup ? "Defined" : "Unset"],
                      ["Exercises", String(day.items.length)],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[24px] border border-[color:var(--border)] bg-white/55 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                          {label}
                        </p>
                        <p className="mt-2 text-base font-semibold text-[color:var(--foreground)]">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Day title</p>
                        {selectedPlan.days.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[10px] text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10"
                            onClick={() => removeDay(day.id)}
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Remove Day
                          </Button>
                        )}
                      </div>
                      <Input
                        value={day.title}
                        onChange={(event) => updateDay(day.id, (entry) => ({ ...entry, title: event.target.value }))}
                        placeholder="Day title"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Focus</p>
                      <Input
                        value={day.focus}
                        onChange={(event) => updateDay(day.id, (entry) => ({ ...entry, focus: event.target.value }))}
                        placeholder="Focus"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Warm-up flow</p>
                      <Textarea
                        value={day.warmup}
                        onChange={(event) => updateDay(day.id, (entry) => ({ ...entry, warmup: event.target.value }))}
                        placeholder="Warm-up flow"
                        className="min-h-[96px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Session goal</p>
                      <Textarea
                        value={day.sessionGoal}
                        onChange={(event) => updateDay(day.id, (entry) => ({ ...entry, sessionGoal: event.target.value }))}
                        placeholder="Session goal"
                        className="min-h-[96px]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Target muscles</p>
                    <Input
                      value={day.targetMuscles.join(", ")}
                      onChange={(event) =>
                        updateDay(day.id, (entry) => ({
                          ...entry,
                          targetMuscles: event.target.value
                            .split(",")
                            .map((value) => value.trim())
                            .filter(Boolean),
                        }))
                      }
                      placeholder="Target muscles, comma separated"
                    />
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Relevant notes</p>
                    <Textarea
                      value={day.notes}
                      onChange={(event) => updateDay(day.id, (entry) => ({ ...entry, notes: event.target.value }))}
                      placeholder="Relevant notes, machine setup, time cap, or recovery constraints"
                    />
                  </div>

                  <div className="space-y-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">Programmed exercises</p>
                    <div className="space-y-4">
                      {day.items.map((item, itemIndex) => (
                        <div key={item.id} className="rounded-[28px] border border-[color:var(--border)] bg-white/60 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <Badge>Lift {itemIndex + 1}</Badge>
                            <Badge>{item.prGoal ? "PR focus" : "Standard work"}</Badge>
                          </div>

                          <div className="mt-4 grid gap-3 xl:grid-cols-[1.2fr_0.6fr_0.7fr_0.7fr_0.7fr]">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Exercise</p>
                              <Combobox
                                options={exerciseOptions}
                                value={item.exerciseId}
                                onValueChange={(value) => updateItem(day.id, itemIndex, (entry) => ({ ...entry, exerciseId: value }))}
                                placeholder="Search exercise..."
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Sets</p>
                              <Input
                                type="number"
                                min="1"
                                value={String(item.sets)}
                                onChange={(event) => updateItem(day.id, itemIndex, (entry) => ({ ...entry, sets: Number(event.target.value) }))}
                                placeholder="Sets"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Reps</p>
                              <Input
                                value={item.reps}
                                onChange={(event) => updateItem(day.id, itemIndex, (entry) => ({ ...entry, reps: event.target.value }))}
                                placeholder="Reps"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Target load</p>
                              <Input
                                value={item.targetLoad}
                                onChange={(event) => updateItem(day.id, itemIndex, (entry) => ({ ...entry, targetLoad: event.target.value }))}
                                placeholder="Target load"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Target RPE</p>
                              <Input
                                value={item.targetRpe}
                                onChange={(event) => updateItem(day.id, itemIndex, (entry) => ({ ...entry, targetRpe: event.target.value }))}
                                placeholder="Target RPE"
                              />
                            </div>
                          </div>

                          <div className="mt-3 grid gap-3 xl:grid-cols-[0.8fr_1fr_auto]">
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Rest (s)</p>
                              <Input
                                type="number"
                                min="30"
                                value={String(item.restSeconds)}
                                onChange={(event) =>
                                  updateItem(day.id, itemIndex, (entry) => ({ ...entry, restSeconds: Number(event.target.value) }))
                                }
                                placeholder="Rest seconds"
                              />
                            </div>
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">PR Goal</p>
                              <Input
                                value={item.prGoal}
                                onChange={(event) => updateItem(day.id, itemIndex, (entry) => ({ ...entry, prGoal: event.target.value }))}
                                placeholder="PR target or key performance marker"
                              />
                            </div>
                            <div className="flex items-end">
                              <Button
                                type="button"
                                variant="ghost"
                                onClick={() =>
                                  updateDay(day.id, (entry) => ({
                                    ...entry,
                                    items: entry.items.filter((_, currentIndex) => currentIndex !== itemIndex),
                                  }))
                                }
                              >
                                Remove
                              </Button>
                            </div>
                          </div>

                          <div className="mt-3 space-y-2">
                            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Exercise notes</p>
                            <Textarea
                              value={item.notes}
                              onChange={(event) => updateItem(day.id, itemIndex, (entry) => ({ ...entry, notes: event.target.value }))}
                              placeholder="Technique cue, machine setup, tempo, or swap option"
                              className="min-h-[88px]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <Button type="button" variant="secondary" onClick={() => addExercise(day.day)} disabled={!data.exercises.length} className="w-full border-dashed">
                      <Plus className="h-4 w-4" />
                      Add exercise
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        {message ? <Badge className="mt-5">{message}</Badge> : null}
      </Card>
    </div>
  );
}
