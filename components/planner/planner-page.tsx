"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowRight, Plus, Save, Trash2, Loader2, Dumbbell, Sparkles, 
  BarChart3, Clock, Flame, Target, CalendarDays, ChevronRight,
  TrendingUp, Compass, PlusCircle, AlertCircle, Info, ChevronDown, Check
} from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlanAnalysis } from "./plan-analysis";
import { useData } from "@/components/shared/data-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const getItemTags = (notes: string, exerciseId: string, exerciseCategory?: string) => {
  const tags = [];
  const lowerNotes = (notes || "").toLowerCase();
  const lowerId = (exerciseId || "").toLowerCase();
  
  if (lowerNotes.includes("superset") || lowerId.includes("superset")) {
    tags.push({ label: "SUPERSET", type: "superset", color: "bg-purple-500/10 text-purple-700 border-purple-200" });
  }
  if (lowerNotes.includes("dropset") || lowerNotes.includes("drop-set") || lowerNotes.includes("drop set")) {
    tags.push({ label: "DROPSET", type: "dropset", color: "bg-amber-500/10 text-amber-700 border-amber-200" });
  }
  if (lowerNotes.includes("warm-up") || lowerNotes.includes("warmup") || exerciseCategory === "Mobility") {
    tags.push({ label: "WARM-UP", type: "warmup", color: "bg-blue-500/10 text-blue-700 border-blue-200" });
  }
  if (lowerNotes.includes("stretch") || lowerNotes.includes("cooldown") || lowerNotes.includes("cool-down") || lowerNotes.includes("flow")) {
    tags.push({ label: "STRETCH / FLOW", type: "stretch", color: "bg-teal-500/10 text-teal-700 border-teal-200" });
  }
  return tags;
};

const AVAILABLE_MUSCLES = [
  "Chest", "Upper Back", "Lats", "Shoulders", "Triceps", "Biceps", 
  "Forearms", "Quads", "Hamstrings", "Glutes", "Calves", "Abs", "Core", "Cardio", "Active Recovery"
];

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

export function PlannerPage() {
  const data = useData();
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [activeDayId, setActiveDayId] = useState("");
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
    setActiveDayId(initial[0].days[0]?.id ?? "");
  }, [data.plans, data.user.id]);

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.id === selectedPlanId) || plans[0] || blankPlan(data.user.id);
  }, [plans, selectedPlanId]);

  const activeDay = useMemo(() => {
    return selectedPlan.days.find((day) => day.id === activeDayId) || selectedPlan.days[0];
  }, [selectedPlan, activeDayId]);

  useEffect(() => {
    if (activeDay && activeDay.id !== activeDayId) {
      setActiveDayId(activeDay.id);
    }
  }, [selectedPlanId, activeDay]);

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

  const exerciseOptions = useMemo(
    () => data.exercises.map((exercise) => ({ value: exercise.id, label: exercise.name })),
    [data.exercises]
  );

  const weeklyLiftCount = selectedPlan.days.reduce((count, day) => count + day.items.length, 0);
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
    setActiveDayId(next.days[0]?.id ?? "");
    setMessage("");
  };

  const addExercise = (dayId: string) => {
    updateDay(dayId, (day) => ({
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
    if (selectedPlan.days.length >= 8) return;
    const maxDay = Math.max(...selectedPlan.days.map(d => d.day), -1);
    const nextDay = maxDay + 1;
    const nextDayId = `draft-day-${randomId()}`;
    
    patchSelectedPlan((plan) => ({
      ...plan,
      days: [
        ...plan.days,
        {
          id: nextDayId,
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
    setActiveDayId(nextDayId);
  };

  const removeDay = (dayId: string) => {
    if (selectedPlan.days.length <= 1) return;
    patchSelectedPlan((plan) => {
      const remainingDays = plan.days.filter((d) => d.id !== dayId);
      return {
        ...plan,
        days: remainingDays.map((d, idx) => ({ ...d, day: idx })),
      };
    });
    const remaining = selectedPlan.days.filter((d) => d.id !== dayId);
    setActiveDayId(remaining[0]?.id ?? "");
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
    setMessage("Plan saved successfully.");
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
      setActiveDayId(nextPlans[0]?.days[0]?.id ?? "");
      return;
    }

    await fetch(`/api/plans/${selectedPlan.id}`, { method: "DELETE" });
    const remaining = plans.filter((plan) => plan.id !== selectedPlan.id);
    const nextPlans = remaining.length ? remaining : [blankPlan(data.user.id)];
    setPlans(nextPlans);
    setSelectedPlanId(nextPlans[0]?.id ?? "");
    setActiveDayId(nextPlans[0]?.days[0]?.id ?? "");
    router.refresh();
  };

  if (!isClient) return null;

  return (
    <div className="space-y-6">
      
      {/* Workspace Header Panel */}
      <div className="rounded-[36px] bg-gradient-to-r from-indigo-950 via-slate-900 to-black p-6 md:p-10 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.05),transparent_40%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Badge className="bg-white/10 hover:bg-white/20 border-transparent text-emerald-400 font-bold uppercase tracking-widest text-[10px] px-3 py-1">
              Active Program Vault
            </Badge>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">
              Weekly Split Planner
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-xl font-medium leading-relaxed">
              Program daily splits, configure specific seat targets, outline rest constraints, and check weekly biological stimulus coverage.
            </p>
          </div>

          {/* Quick config stats */}
          <div className="flex flex-wrap gap-3 items-center">
            <Button type="button" onClick={createPlan} className="h-12 px-5 bg-white hover:bg-white/90 text-neutral-900 font-semibold text-xs rounded-xl shadow-md border-none flex items-center gap-2 transition duration-200">
              <Plus className="h-4 w-4" />
              <span>Create Split</span>
            </Button>
            <Button type="button" onClick={savePlan} disabled={saving} className="h-12 px-5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-semibold text-xs shadow-md border-none flex items-center gap-2 transition duration-200">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              <span>Save Changes</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Core Layout: Splits Library Selector + Large Day Panel Grid */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr] items-start">
        
        {/* Selector Pane */}
        <div className="space-y-4 lg:sticky lg:top-4">
          <Card className="p-5 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-[28px] space-y-4">
            <div className="flex items-center gap-2 border-b border-black/5 pb-3">
              <Compass className="h-4 w-4 text-black/50" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-black/50">Splits Library</span>
            </div>

            <ScrollArea className="h-[250px] -mr-2 pr-2">
              <div className="space-y-2">
                {plans.map((p) => {
                  const isActive = p.id === selectedPlan.id;
                  const totalLifts = p.days.reduce((count, day) => count + day.items.length, 0);
                  return (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left transition duration-300 relative group",
                        isActive
                          ? "border-black/20 bg-black/5 shadow-sm"
                          : "border-black/5 bg-white/40 hover:bg-white/80"
                      )}
                    >
                      <p className="font-bold text-sm text-black">{p.name}</p>
                      <div className="mt-2.5 flex items-center justify-between text-[10px] text-black/40 font-bold uppercase tracking-wider">
                        <span>{p.days.length} Days</span>
                        <span className="flex items-center gap-1">
                          <Dumbbell className="h-3.5 w-3.5" />
                          {totalLifts} Lifts
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>

          {/* Quick link to execution */}
          <Card className="p-5 border-transparent bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-[28px] relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_35%)]" />
            <div className="relative z-10 space-y-3">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <h4 className="font-bold text-sm">Execution Mode</h4>
              <p className="text-white/60 text-[10px] leading-relaxed">
                Log outcomes, track completed reps, and compare live performance against planner presets.
              </p>
              <Button asChild className="w-full bg-white text-black hover:bg-white/90 rounded-xl font-bold uppercase text-[9px] tracking-wider py-4 shadow-sm border-none">
                <Link href="/workouts" className="flex items-center justify-center gap-1.5">
                  <span>Open Studio</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </Card>
        </div>

        {/* Major Working Panel */}
        <div className="space-y-6">
          <Card className="p-6 md:p-8 border-transparent bg-white/70 backdrop-blur shadow-[0_15px_50px_rgba(0,0,0,0.03)] rounded-[32px] space-y-6">
            
            {/* Split Basic Details Block */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 border-b border-black/5 pb-6">
              <div className="space-y-4 flex-1">
                <div className="w-full">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-black/50 block">Split Title</label>
                    <Input
                      value={selectedPlan.name}
                      onChange={(event) => patchSelectedPlan((plan) => ({ ...plan, name: event.target.value }))}
                      placeholder="e.g. Lower Body Target Focus"
                      className="bg-white border-black/5 focus:border-black rounded-2xl py-4.5 px-4.5 text-sm font-semibold transition"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start shrink-0">
                {isAutoSaving && (
                  <Badge className="bg-emerald-500/10 border-transparent text-emerald-700 text-[9px] font-extrabold flex gap-1 items-center px-2 py-1 animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Auto-Syncing</span>
                  </Badge>
                )}
                <Button type="button" variant="ghost" onClick={removePlan} className="rounded-xl border border-black/5 hover:bg-rose-500/10 hover:text-rose-600 transition flex items-center gap-1.5 text-xs font-semibold px-3 py-2">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete Split</span>
                </Button>
              </div>
            </div>

            {/* Split Days Timeline Bar (Redesigned gorgeous interactive selector) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-black/50 uppercase tracking-wider">Training Days Schedule</span>
                <span className="text-[10px] font-extrabold text-black/40 uppercase tracking-widest">{selectedPlan.days.length} Days Block</span>
              </div>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 md:grid-cols-9">
                {selectedPlan.days.map((day) => {
                  const isActive = day.id === activeDayId;
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => setActiveDayId(day.id)}
                      className={cn(
                        "flex flex-col items-start p-3 rounded-2xl border text-left transition duration-300 relative overflow-hidden group",
                        isActive
                          ? "bg-black text-white border-black shadow-lg"
                          : "bg-white/50 border-black/5 hover:border-black/10 hover:bg-white text-black"
                      )}
                    >
                      <span className={cn("text-[9px] font-black tracking-widest uppercase mb-1", isActive ? "text-emerald-400" : "text-black/40")}>
                        Day {day.day + 1}
                      </span>
                      <span className="font-bold text-xs truncate w-full leading-tight">{day.title || `Day ${day.day + 1}`}</span>
                      <span className={cn("text-[9px] font-medium mt-1 truncate w-full", isActive ? "text-white/60" : "text-black/40")}>
                        {day.focus || "Recovery"}
                      </span>
                      {isActive && (
                        <div className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}

                {selectedPlan.days.length < 8 && (
                  <button
                    type="button"
                    onClick={addDay}
                    className="flex flex-col items-center justify-center p-3 rounded-2xl border border-dashed border-black/10 bg-black/[0.02] hover:bg-black/5 text-indigo-600 transition"
                  >
                    <Plus className="h-4 w-4 mb-1" />
                    <span className="font-bold text-xs">Add Day</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setActiveDayId("analysis")}
                  className={cn(
                    "flex flex-col items-start p-3 rounded-2xl border text-left transition duration-300 sm:col-span-2 md:col-span-1",
                    activeDayId === "analysis"
                      ? "bg-black text-white border-black shadow-lg"
                      : "bg-white/50 border-black/5 hover:border-black/10 hover:bg-white text-black"
                  )}
                >
                  <span className={cn("text-[9px] font-black tracking-widest uppercase mb-1", activeDayId === "analysis" ? "text-emerald-400" : "text-black/40")}>
                    Audit
                  </span>
                  <span className="font-bold text-xs truncate w-full leading-tight flex items-center gap-1">
                    <BarChart3 className="h-3 w-3" />
                    <span>Stimulus</span>
                  </span>
                  <span className={cn("text-[9px] font-medium mt-1 w-full", activeDayId === "analysis" ? "text-white/60" : "text-black/40")}>
                    Coverage
                  </span>
                </button>
              </div>
            </div>

            {/* Day Specific Config Forms */}
            <div className="mt-6">
              <AnimatePresence mode="wait">
                {activeDayId === "analysis" ? (
                  <motion.div
                    key="analysis"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PlanAnalysis plan={selectedPlan} data={data} />
                  </motion.div>
                ) : (
                  activeDay && (
                    <motion.div
                      key={activeDay.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6"
                    >
                      {/* Day Metadata card */}
                      <div className="p-5 md:p-6 border border-black/5 bg-white/50 rounded-[24px] space-y-5">
                        
                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/5 pb-4">
                          <div className="flex items-center gap-2">
                            <span className="h-7 w-7 rounded-xl bg-black text-white text-xs font-bold flex items-center justify-center">
                              {activeDay.day + 1}
                            </span>
                            <h3 className="font-bold text-sm text-black">Configure Day {activeDay.day + 1} Details</h3>
                          </div>

                          {selectedPlan.days.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => removeDay(activeDay.id)}
                              className="h-8 px-2.5 text-xs font-semibold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 rounded-lg transition"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1" />
                              <span>Remove Day</span>
                            </Button>
                          )}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-black/50 block">Display Title</label>
                            <Input
                              value={activeDay.title}
                              onChange={(event) => updateDay(activeDay.id, (entry) => ({ ...entry, title: event.target.value }))}
                              placeholder="e.g. Heavy Upper Split A"
                              className="bg-white border-black/5 focus:border-black rounded-xl text-xs font-semibold py-3.5 px-4 transition"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-black/50 block">Day Focus</label>
                            <Input
                              value={activeDay.focus}
                              onChange={(event) => updateDay(activeDay.id, (entry) => ({ ...entry, focus: event.target.value }))}
                              placeholder="e.g. Pectorals & Deltoids"
                              className="bg-white border-black/5 focus:border-black rounded-xl text-xs font-semibold py-3.5 px-4 transition"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-black/50 block">Target Muscles</label>
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {AVAILABLE_MUSCLES.map((muscle) => {
                              const isSelected = activeDay.targetMuscles.includes(muscle);
                              return (
                                <button
                                  key={muscle}
                                  type="button"
                                  onClick={() => {
                                    const next = isSelected
                                      ? activeDay.targetMuscles.filter(m => m !== muscle)
                                      : [...activeDay.targetMuscles, muscle];
                                    updateDay(activeDay.id, (entry) => ({
                                      ...entry,
                                      targetMuscles: next,
                                    }));
                                  }}
                                  className={cn(
                                    "rounded-xl px-3 py-1.5 text-xs font-semibold border transition duration-200",
                                    isSelected
                                      ? "bg-black text-white border-black"
                                      : "bg-white text-black/60 border-black/5 hover:bg-black/5"
                                  )}
                                >
                                  {muscle}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-black/50 block">Warm-up Protocol</label>
                            <Textarea
                              value={activeDay.warmup}
                              onChange={(event) => updateDay(activeDay.id, (entry) => ({ ...entry, warmup: event.target.value }))}
                              placeholder="Activation sets, rotational complexes, band protocols..."
                              className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[58px] py-3 px-4 transition"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-bold text-black/50 block">Day Goal / Target PRs</label>
                            <Textarea
                              value={activeDay.sessionGoal}
                              onChange={(event) => updateDay(activeDay.id, (entry) => ({ ...entry, sessionGoal: event.target.value }))}
                              placeholder="Overload bench target, pacing, seat setup settings..."
                              className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[58px] py-3 px-4 transition"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-black/50 block">Relevant Day Notes</label>
                          <Textarea
                            value={activeDay.notes}
                            onChange={(event) => updateDay(activeDay.id, (entry) => ({ ...entry, notes: event.target.value }))}
                            placeholder="Machine swap options, recovery limits..."
                            className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[46px] py-3 px-4 transition"
                          />
                        </div>

                      </div>

                      {/* Programmed Lifts list */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-black/5 pb-2">
                          <h4 className="text-xs font-bold text-black/50">Planned Exercises</h4>
                          <Badge className="bg-black/5 border-transparent text-black/60 text-[10px] font-bold px-2 py-0.5">
                            {activeDay.items.length} lift{activeDay.items.length !== 1 && "s"} planned
                          </Badge>
                        </div>

                        <div className="space-y-4">
                          {activeDay.items.map((item, itemIndex) => {
                            const exercise = data.exercises.find((e) => e.id === item.exerciseId);
                            const tags = getItemTags(item.notes, item.exerciseId, exercise?.category);
                            const primaryTag = tags[0];
                            const borderClass = primaryTag
                              ? primaryTag.type === "superset"
                                ? "border-l-4 border-l-purple-500"
                                : primaryTag.type === "dropset"
                                ? "border-l-4 border-l-amber-500"
                                : primaryTag.type === "warmup"
                                ? "border-l-4 border-l-blue-500"
                                : "border-l-4 border-l-teal-500"
                              : "border-l border-l-black/5";

                            return (
                              <div key={item.id} className={cn("p-5 border border-black/5 bg-white/60 hover:bg-white/80 rounded-[22px] transition duration-300", borderClass)}>
                                
                                <div className="flex items-center justify-between gap-3 border-b border-black/5 pb-3 mb-4">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Badge className="bg-black text-white text-[9px] font-extrabold px-2 py-0.5">
                                      Lift {itemIndex + 1}
                                    </Badge>
                                    {tags.map((tag) => (
                                      <Badge key={tag.label} className={cn("border text-[9px] font-extrabold px-2 py-0.5", tag.color)}>
                                        {tag.label}
                                      </Badge>
                                    ))}
                                    {item.prGoal && (
                                      <Badge className="bg-indigo-500/10 border-transparent text-indigo-700 text-[9px] font-extrabold px-2 py-0.5 flex gap-1 items-center">
                                        <Target className="h-3 w-3" />
                                        <span>PR target</span>
                                      </Badge>
                                    )}
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() =>
                                      updateDay(activeDay.id, (entry) => ({
                                        ...entry,
                                        items: entry.items.filter((_, currentIndex) => currentIndex !== itemIndex),
                                      }))
                                    }
                                    className="h-7 px-2 text-xs font-semibold text-rose-500 hover:bg-rose-50 rounded-lg transition"
                                  >
                                    Remove
                                  </Button>
                                </div>

                                {/* Form Inputs Grid */}
                                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
                                  <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-xs font-bold text-black/50 block">Select Exercise</label>
                                    <Combobox
                                      options={exerciseOptions}
                                      value={item.exerciseId}
                                      onValueChange={(value) => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, exerciseId: value }))}
                                      placeholder="Search exercise..."
                                    />
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-black/50 block">Target Sets</label>
                                    <Input
                                      type="number"
                                      min="1"
                                      value={String(item.sets)}
                                      onChange={(event) => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, sets: Number(event.target.value) }))}
                                      placeholder="Sets"
                                      className="bg-white border-black/5 focus:border-black rounded-xl text-xs py-3.5 px-4 font-semibold"
                                    />
                                    <div className="flex gap-1.5 mt-1.5">
                                      {[2, 3, 4, 5].map((s) => (
                                        <button
                                          key={s}
                                          type="button"
                                          onClick={() => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, sets: s }))}
                                          className={cn(
                                            "h-6 w-6 rounded-lg border text-[10px] font-semibold flex items-center justify-center transition",
                                            item.sets === s ? "bg-black text-white border-black" : "bg-white text-black/40 border-black/5 hover:bg-black/5"
                                          )}
                                        >
                                          {s}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-black/50 block">Reps Bracket</label>
                                    <Input
                                      value={item.reps}
                                      onChange={(event) => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, reps: event.target.value }))}
                                      placeholder="e.g. 8-10, 5, 12+"
                                      className="bg-white border-black/5 focus:border-black rounded-xl text-xs py-3.5 px-4 font-semibold"
                                    />
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {["5", "6-8", "8-12", "10-12", "12-15", "20", "Max"].map((r) => (
                                        <button
                                          key={r}
                                          type="button"
                                          onClick={() => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, reps: r }))}
                                          className={cn(
                                            "px-1.5 py-0.5 rounded-lg border text-[9px] font-semibold transition",
                                            item.reps === r ? "bg-black text-white border-black" : "bg-white text-black/40 border-black/5 hover:bg-black/5"
                                          )}
                                        >
                                          {r}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-black/50 block">Target Rest (s)</label>
                                    <Input
                                      type="number"
                                      min="30"
                                      value={String(item.restSeconds)}
                                      onChange={(event) =>
                                        updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, restSeconds: Number(event.target.value) }))
                                      }
                                      placeholder="Rest seconds"
                                      className="bg-white border-black/5 focus:border-black rounded-xl text-xs py-3.5 px-4 font-semibold"
                                    />
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {[30, 45, 60, 90, 120, 180].map((rst) => (
                                        <button
                                          key={rst}
                                          type="button"
                                          onClick={() => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, restSeconds: rst }))}
                                          className={cn(
                                            "px-1 py-0.5 rounded-lg border text-[9px] font-semibold transition",
                                            item.restSeconds === rst ? "bg-black text-white border-black" : "bg-white text-black/40 border-black/5 hover:bg-black/5"
                                          )}
                                        >
                                          {rst === 60 ? "1m" : rst === 90 ? "1.5m" : rst === 120 ? "2m" : rst === 180 ? "3m" : `${rst}s`}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-black/50 block">Target Load</label>
                                    <Input
                                      value={item.targetLoad}
                                      onChange={(event) => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, targetLoad: event.target.value }))}
                                      placeholder="e.g. 100kg, 80%, Bodyweight"
                                      className="bg-white border-black/5 focus:border-black rounded-xl text-xs py-3.5 px-4 font-semibold"
                                    />
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                      {["Heavy", "Moderate", "Light", "Bodyweight", "Weighted", "Low"].map((ld) => (
                                        <button
                                          key={ld}
                                          type="button"
                                          onClick={() => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, targetLoad: ld }))}
                                          className={cn(
                                            "px-1.5 py-0.5 rounded-lg border text-[9px] font-semibold transition",
                                            item.targetLoad === ld ? "bg-black text-white border-black" : "bg-white text-black/40 border-black/5 hover:bg-black/5"
                                          )}
                                        >
                                          {ld}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-black/50 block">Target RPE</label>
                                    <Select
                                      value={item.targetRpe}
                                      onValueChange={(val) => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, targetRpe: val }))}
                                    >
                                      <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-semibold py-4">
                                        <SelectValue placeholder="Select RPE" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="6">RPE 6</SelectItem>
                                        <SelectItem value="6.5">RPE 6.5</SelectItem>
                                        <SelectItem value="7">RPE 7</SelectItem>
                                        <SelectItem value="7.5">RPE 7.5</SelectItem>
                                        <SelectItem value="8">RPE 8</SelectItem>
                                        <SelectItem value="8.5">RPE 8.5</SelectItem>
                                        <SelectItem value="9">RPE 9</SelectItem>
                                        <SelectItem value="9.5">RPE 9.5</SelectItem>
                                        <SelectItem value="10">RPE 10</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-black/50 block">PR Goal Target</label>
                                    <Input
                                      value={item.prGoal}
                                      onChange={(event) => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, prGoal: event.target.value }))}
                                      placeholder="e.g. 105kg x 8 reps"
                                      className="bg-white border-black/5 focus:border-black rounded-xl text-xs py-3.5 px-4 font-semibold"
                                    />
                                  </div>
                                </div>

                                <div className="mt-4 space-y-1.5">
                                  <label className="text-xs font-bold text-black/50 block">Exercise Setup Notes</label>
                                  <Textarea
                                    value={item.notes}
                                    onChange={(event) => updateItem(activeDay.id, itemIndex, (entry) => ({ ...entry, notes: event.target.value }))}
                                    placeholder="Technique cues, bench position slots, tempos..."
                                    className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[46px] py-3 px-4 transition"
                                  />
                                </div>

                              </div>
                            )})}
                        </div>

                        <Button 
                          type="button" 
                          onClick={() => addExercise(activeDay.id)} 
                          disabled={!data.exercises.length} 
                          className="w-full border border-dashed border-black/20 bg-black/5 hover:bg-black/10 text-black py-6 rounded-[22px] font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          <PlusCircle className="h-4.5 w-4.5" />
                          <span>Add exercise to Day {activeDay.day + 1}</span>
                        </Button>
                      </div>

                    </motion.div>
                  )
                )}
              </AnimatePresence>
            </div>

            {message ? (
              <div className="mt-4 p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-2">
                <Check className="h-4 w-4" />
                <span>{message}</span>
              </div>
            ) : null}

          </Card>
        </div>

      </div>

    </div>
  );
}
