"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Plus, Trash2, Loader2, Dumbbell, Sparkles, Clock, Target, 
  CalendarDays, Play, ChevronRight, CheckCircle2, History,
  Award, Calendar, AlertCircle, Info, X, Edit3, ClipboardList,
  Save, ArrowLeft, RotateCcw, Volume2, VolumeX, Timer, Check, Minus, PlusCircle,
  Pause
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { WeeklyPlan, WeeklyPlanDay, WeeklyPlanItem, WorkoutSession, WorkoutSessionItem, WorkoutSet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Combobox } from "@/components/ui/combobox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlanAnalysis } from "./plan-analysis";
import { useData } from "@/components/shared/data-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const randomId = () => Math.random().toString(36).substring(2, 15);
const createDraftId = () => `draft_${randomId()}`;
const isPersistedId = (id: string) => Boolean(id) && !id.startsWith("draft_");

const AVAILABLE_MUSCLES = [
  "Chest", "Upper Back", "Lats", "Shoulders", "Triceps", "Biceps", 
  "Forearms", "Quads", "Hamstrings", "Glutes", "Calves", "Abs", "Core", "Cardio", "Active Recovery"
];

const EFFORT_OPTIONS = [
  { emoji: "🌟", value: "Relaxed", desc: "Easy RPE 1-3" },
  { emoji: "💪", value: "Moderate", desc: "Solid RPE 4-6" },
  { emoji: "🔥", value: "Challenging", desc: "Hard RPE 7-8" },
  { emoji: "🥵", value: "Exhausting", desc: "Max RPE 9-10" },
  { emoji: "💀", value: "Failure", desc: "RPE 10+ / PR push" },
];

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
      focus: "Focus Area",
      warmup: "",
      sessionGoal: "",
      targetMuscles: [],
      notes: "",
      items: [],
    },
  ],
});

const playBeep = () => {
  if (typeof window === "undefined") return;
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime); // Pitch of beep
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn("Web Audio beep failed:", e);
  }
};

export function PlannerPage() {
  const data = useData();
  const router = useRouter();

  // Navigation tab: "train" (Start/Log Workouts), "splits" (Manage plans), "history" (Past workouts)
  const [activeTab, setActiveTab] = useState<"train" | "splits" | "history">("train");
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [activeDayId, setActiveDayId] = useState("");
  
  // Viewing details modal
  const [viewingPlan, setViewingPlan] = useState<WeeklyPlan | null>(null);
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // States for active operations
  const [isEditingSplit, setIsEditingSplit] = useState(false);
  const [activeDraftPlan, setActiveDraftPlan] = useState<WeeklyPlan | null>(null);
  
  // Workout Logging States
  const [draftSession, setDraftSession] = useState<Partial<WorkoutSession> | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [selectedEffort, setSelectedEffort] = useState("Moderate");

  // Rest Timer States
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restTimerDuration, setRestTimerDuration] = useState<number>(90);
  const [restTimerIsPaused, setRestTimerIsPaused] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  const [saving, setSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setPlans(data.plans || []);
    setSessions(data.sessions || []);
    if (data.plans.length > 0) {
      setSelectedPlanId(data.plans[0].id);
      setActiveDayId(data.plans[0].days[0]?.id ?? "");
    }
  }, [data.plans, data.sessions]);

  const selectedPlan = useMemo(() => {
    return plans.find((p) => p.id === selectedPlanId) || plans[0] || null;
  }, [plans, selectedPlanId]);

  const activeDay = useMemo(() => {
    if (!selectedPlan) return null;
    return selectedPlan.days.find((d) => d.id === activeDayId) || selectedPlan.days[0];
  }, [selectedPlan, activeDayId]);

  // COMBINED EXERCISE LIST FOR COMBOBOX OPTIONS
  const exerciseOptions = useMemo(() => {
    return (data.exercises || []).map((e) => ({
      value: e.id,
      label: `${e.name} (${e.category})`,
    }));
  }, [data.exercises]);

  // Stopwatch ticking logic
  useEffect(() => {
    let interval: any;
    if (draftSession && !draftSession.endedAt) {
      const start = new Date(draftSession.startedAt!).getTime();
      interval = setInterval(() => {
        setElapsedTime(Math.round((Date.now() - start) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [draftSession]);

  // Rest timer ticking logic
  useEffect(() => {
    let timer: any;
    if (restSecondsLeft !== null && restSecondsLeft > 0 && !restTimerIsPaused) {
      timer = setInterval(() => {
        setRestSecondsLeft((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            if (isAudioEnabled) playBeep();
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [restSecondsLeft, restTimerIsPaused, isAudioEnabled]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return [
      h > 0 ? String(h).padStart(2, "0") : null,
      String(m).padStart(2, "0"),
      String(s).padStart(2, "0"),
    ].filter(Boolean).join(":");
  };

  const handleDeletePlan = async (id: string) => {
    if (!isPersistedId(id)) {
      setPlans((prev) => prev.filter((p) => p.id !== id));
      setDeletingPlanId(null);
      return;
    }
    setSaving(true);
    try {
      await fetch(`/api/plans/${id}`, { method: "DELETE" });
      setPlans((prev) => prev.filter((p) => p.id !== id));
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setDeletingPlanId(null);
    }
  };

  const handleDeleteSession = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/workouts?id=${id}`, { method: "DELETE" });
      setSessions((prev) => prev.filter((s) => s.id !== id));
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
      setDeletingSessionId(null);
      setViewingSession(null);
    }
  };

  const startEmptyWorkout = () => {
    const session: Partial<WorkoutSession> = {
      startedAt: new Date().toISOString(),
      endedAt: null,
      day: 0,
      title: "Quick Workout",
      effort: "",
      notes: "",
      items: [],
    };
    setDraftSession(session);
    setElapsedTime(0);
    setRestSecondsLeft(null);
    setIsFinishingWorkout(false);
    setFeedbackNotes("");
    setSelectedEffort("Moderate");
  };

  const startWorkoutFromDay = (day: WeeklyPlanDay, plan: WeeklyPlan) => {
    const session: Partial<WorkoutSession> = {
      planId: plan.id,
      planDayId: day.id,
      startedAt: new Date().toISOString(),
      endedAt: null,
      day: day.day,
      title: `${plan.name} • ${day.title}`,
      effort: "",
      notes: day.notes,
      items: day.items.map((item, order) => ({
        id: item.id,
        exerciseId: item.exerciseId,
        exerciseName: data.exercises.find((e) => e.id === item.exerciseId)?.name || item.exerciseId,
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
    setDraftSession(session);
    setElapsedTime(0);
    setRestSecondsLeft(null);
    setIsFinishingWorkout(false);
    setFeedbackNotes(day.notes || "");
    setSelectedEffort("Moderate");
  };

  // ==========================================
  // ACTIVE WORKOUT ACTIONS
  // ==========================================
  const handleToggleSetComplete = (itemIndex: number, setIndex: number) => {
    if (!draftSession || !draftSession.items) return;

    const newItems = [...draftSession.items];
    const currentItem = newItems[itemIndex];
    const currentSets = [...currentItem.sets] as any[];
    const set = currentSets[setIndex];
    
    const wasCompleted = Boolean(set.completed);
    set.completed = !wasCompleted;

    setDraftSession((prev) => ({
      ...prev,
      items: newItems,
    }));

    // Auto-trigger rest timer if completed
    if (!wasCompleted) {
      const restSecs = currentItem.restSeconds || 90;
      setRestTimerDuration(restSecs);
      setRestSecondsLeft(restSecs);
      setRestTimerIsPaused(false);
    }
  };

  const handleUpdateActiveSetField = (itemIndex: number, setIndex: number, field: "weight" | "reps", value: string) => {
    if (!draftSession || !draftSession.items) return;

    const newItems = [...draftSession.items];
    const currentSets = [...newItems[itemIndex].sets];
    currentSets[setIndex] = {
      ...currentSets[setIndex],
      [field]: value,
    };
    newItems[itemIndex].sets = currentSets;

    setDraftSession((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleAddSetActiveSession = (itemIndex: number) => {
    if (!draftSession || !draftSession.items) return;
    
    const newItems = [...draftSession.items];
    const currentItem = newItems[itemIndex];
    currentItem.sets = [...currentItem.sets, { weight: "", reps: "" }];
    
    setDraftSession((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const handleRemoveSetActiveSession = (itemIndex: number) => {
    if (!draftSession || !draftSession.items) return;
    
    const newItems = [...draftSession.items];
    const currentItem = newItems[itemIndex];
    if (currentItem.sets.length <= 1) return;
    currentItem.sets = currentItem.sets.slice(0, -1);
    
    setDraftSession((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const addExerciseToActiveSession = (exerciseId: string) => {
    if (!draftSession || !draftSession.items) return;
    const exercise = data.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newItem: WorkoutSessionItem = {
      id: createDraftId(),
      exerciseId,
      exerciseName: exercise.name,
      plannedSets: 3,
      reps: "8-12",
      restSeconds: exercise.defaultRestSeconds || 90,
      targetLoad: "",
      targetRpe: "",
      sets: Array.from({ length: 3 }).map(() => ({ weight: "", reps: "" })),
      notes: "",
      order: draftSession.items.length,
    };

    setDraftSession((prev) => ({
      ...prev,
      items: [...(prev?.items || []), newItem],
    }));
  };

  const handleSaveWorkoutSession = async () => {
    if (!draftSession) return;
    setSaving(true);
    try {
      const isEdit = Boolean(draftSession.id);
      
      // Clean temporary properties like `completed` on sets if database complains
      const cleanedItems = (draftSession.items || []).map((item) => ({
        ...item,
        sets: item.sets.map((set: any) => ({
          weight: set.weight,
          reps: set.reps,
        })),
      }));

      const payloadBody = {
        ...draftSession,
        effort: selectedEffort,
        notes: feedbackNotes,
        endedAt: new Date().toISOString(),
        items: cleanedItems,
      };

      const response = await fetch("/api/workouts", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadBody),
      });

      if (!response.ok) throw new Error("Could not save workout session");
      const res = await response.json();
      
      setSessions((current) => [res.session, ...current.filter((s) => s.id !== res.session.id)]);
      setDraftSession(null);
      setRestSecondsLeft(null);
      setIsFinishingWorkout(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error saving workout session");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // PLAN EDITOR ACTION HANDLERS
  // ==========================================
  const updateDraftPlan = (updater: (draft: WeeklyPlan) => WeeklyPlan) => {
    if (!activeDraftPlan) return;
    setActiveDraftPlan(updater(activeDraftPlan));
  };

  const updateDraftDay = (dayId: string, updater: (day: WeeklyPlanDay) => WeeklyPlanDay) => {
    updateDraftPlan((draft) => ({
      ...draft,
      days: draft.days.map((d) => (d.id === dayId ? updater(d) : d)),
    }));
  };

  const addWorkoutDay = () => {
    const newDay: WeeklyPlanDay = {
      id: `draft-day-${randomId()}`,
      day: activeDraftPlan?.days.length ?? 0,
      title: `Day ${(activeDraftPlan?.days.length ?? 0) + 1}`,
      focus: "Focus Area",
      warmup: "",
      sessionGoal: "",
      targetMuscles: [],
      notes: "",
      items: [],
    };
    updateDraftPlan((draft) => ({
      ...draft,
      days: [...draft.days, newDay],
    }));
  };

  const removeWorkoutDay = (dayId: string) => {
    updateDraftPlan((draft) => ({
      ...draft,
      days: draft.days.filter((d) => d.id !== dayId).map((d, index) => ({ ...d, day: index })),
    }));
  };

  const addExerciseToDay = (dayId: string, exerciseId: string) => {
    const exercise = data.exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newItem: WeeklyPlanItem = {
      id: createDraftId(),
      exerciseId,
      sets: 3,
      reps: "8-12",
      restSeconds: exercise.defaultRestSeconds || 90,
      targetLoad: "",
      targetRpe: "",
      prGoal: "",
      notes: "",
      order: 0,
    };

    updateDraftDay(dayId, (day) => ({
      ...day,
      items: [...day.items, newItem].map((item, idx) => ({ ...item, order: idx })),
    }));
  };

  const removeExerciseFromDay = (dayId: string, itemId: string) => {
    updateDraftDay(dayId, (day) => ({
      ...day,
      items: day.items.filter((item) => item.id !== itemId).map((item, idx) => ({ ...item, order: idx })),
    }));
  };

  const updateExerciseField = (dayId: string, itemId: string, field: keyof WeeklyPlanItem, value: any) => {
    updateDraftDay(dayId, (day) => ({
      ...day,
      items: day.items.map((item) => (item.id === itemId ? { ...item, [field]: value } : item)),
    }));
  };

  const toggleMuscleInDay = (dayId: string, muscle: string) => {
    updateDraftDay(dayId, (day) => {
      const activeMuscles = day.targetMuscles || [];
      const exists = activeMuscles.includes(muscle);
      return {
        ...day,
        targetMuscles: exists 
          ? activeMuscles.filter((m) => m !== muscle)
          : [...activeMuscles, muscle],
      };
    });
  };

  const handleSavePlan = async () => {
    if (!activeDraftPlan) return;
    setSaving(true);
    try {
      const isEdit = isPersistedId(activeDraftPlan.id);
      const response = await fetch("/api/plans", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeDraftPlan),
      });

      if (!response.ok) throw new Error("Could not save the plan");
      const res = await response.json();
      
      setPlans((prev) => {
        const filtered = prev.filter((p) => p.id !== activeDraftPlan.id);
        return [res.plan, ...filtered];
      });
      setSelectedPlanId(res.plan.id);
      setIsEditingSplit(false);
      setActiveDraftPlan(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Error saving split plan");
    } finally {
      setSaving(false);
    }
  };

  if (!isClient) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  // ==========================================
  // RENDER INTERFACE 1: ACTIVE WORKOUT LOGGER
  // ==========================================
  if (draftSession) {
    const totalCompletedSets = (draftSession.items || []).reduce((acc, item) => {
      return acc + item.sets.filter((s: any) => Boolean(s.completed)).length;
    }, 0);
    const totalPlannedSets = (draftSession.items || []).reduce((acc, item) => {
      return acc + item.sets.length;
    }, 0);

    return (
      <div className="mx-auto max-w-xl pb-32 space-y-6 relative">
        
        {/* Sticky top timer bar */}
        <div className="sticky top-[52px] lg:top-0 z-30 -mx-2 px-4 py-3 bg-white/90 backdrop-blur-md border-b border-black/[0.04] flex items-center justify-between">
          <div>
            <h1 className="text-xs font-black uppercase tracking-widest text-neutral-400">
              Active Session
            </h1>
            <p className="text-[10px] text-neutral-500 font-bold truncate max-w-[200px] mt-0.5">
              {draftSession.title}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Stopwatch */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-black/5 rounded-xl">
              <Clock className="h-3.5 w-3.5 text-black/50" />
              <span className="text-xs font-black font-mono tracking-tight text-neutral-900">
                {formatTime(elapsedTime)}
              </span>
            </div>

            <Button
              onClick={() => setIsFinishingWorkout(true)}
              className="h-8 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3.5"
            >
              Finish
            </Button>
          </div>
        </div>

        {/* Discard Session Notice */}
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-bold text-neutral-400 uppercase">
            Completed: {totalCompletedSets} / {totalPlannedSets} Sets
          </span>
          <button
            onClick={() => {
              if (confirm("Discard active session? Any changes will be lost.")) {
                setDraftSession(null);
                setRestSecondsLeft(null);
              }
            }}
            className="text-[10px] font-bold text-red-500 hover:text-red-600"
          >
            Discard Workout
          </button>
        </div>

        {/* Exercise Session Checklist */}
        <div className="space-y-5">
          {(draftSession.items || []).map((item, itemIdx) => (
            <Card key={item.id} className="p-4 border border-black/5 rounded-2xl bg-white space-y-3.5">
              
              {/* Exercise Card Title */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xs font-extrabold text-neutral-900">
                    {item.exerciseName}
                  </h3>
                  <p className="text-[9.5px] text-neutral-400 font-medium mt-0.5">
                    Planned: {item.plannedSets}x{item.reps} {item.targetLoad ? `@ ${item.targetLoad}` : ""} {item.targetRpe ? `(RPE ${item.targetRpe})` : ""}
                  </p>
                </div>
                
                <span className="text-[9px] font-bold text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-lg border border-black/[0.02]">
                  Rest {item.restSeconds}s
                </span>
              </div>

              {/* Sets Table */}
              <div className="space-y-2">
                <div className="grid grid-cols-[30px_1fr_1fr_42px] gap-2 text-[9px] font-black text-neutral-400 uppercase tracking-wider text-center">
                  <span>Set</span>
                  <span>Weight kg</span>
                  <span>Reps</span>
                  <span>Done</span>
                </div>

                {item.sets.map((set, setIdx) => {
                  const isDone = Boolean((set as any).completed);
                  return (
                    <div
                      key={setIdx}
                      className={cn(
                        "grid grid-cols-[30px_1fr_1fr_42px] gap-2 items-center text-center p-1 rounded-xl transition-all",
                        isDone 
                          ? "bg-emerald-500/5 text-emerald-800 border border-emerald-500/10" 
                          : "bg-neutral-50/50 border border-transparent"
                      )}
                    >
                      <span className="text-[10px] font-black">{setIdx + 1}</span>
                      
                      <Input
                        type="number"
                        placeholder="kg"
                        value={set.weight}
                        onChange={(e) => handleUpdateActiveSetField(itemIdx, setIdx, "weight", e.target.value)}
                        className="h-7.5 text-center text-[10px] font-bold rounded-lg border border-black/[0.04] bg-white px-1 focus-visible:ring-0 focus-visible:bg-neutral-50"
                      />
                      
                      <Input
                        type="number"
                        placeholder="reps"
                        value={set.reps}
                        onChange={(e) => handleUpdateActiveSetField(itemIdx, setIdx, "reps", e.target.value)}
                        className="h-7.5 text-center text-[10px] font-bold rounded-lg border border-black/[0.04] bg-white px-1 focus-visible:ring-0 focus-visible:bg-neutral-50"
                      />

                      {/* Complete Checkbox */}
                      <button
                        onClick={() => handleToggleSetComplete(itemIdx, setIdx)}
                        className={cn(
                          "h-7 w-7 rounded-full flex items-center justify-center border mx-auto transition-all active:scale-90",
                          isDone
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-black/[0.1] text-transparent hover:border-black/30"
                        )}
                      >
                        <Check className="h-3.5 w-3.5 stroke-[3]" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Add / Remove Set Row */}
              <div className="flex gap-2 justify-end pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveSetActiveSession(itemIdx)}
                  disabled={item.sets.length <= 1}
                  className="h-7 rounded-lg text-[9px] font-bold text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 gap-1"
                >
                  <Minus className="h-3 w-3" /> Remove Set
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAddSetActiveSession(itemIdx)}
                  className="h-7 rounded-lg text-[9px] font-bold text-neutral-600 hover:bg-neutral-100 gap-1"
                >
                  <Plus className="h-3 w-3" /> Add Set
                </Button>
              </div>

            </Card>
          ))}
        </div>

        {/* Add ad-hoc exercise inside the workout */}
        <Card className="p-4 border border-black/5 rounded-2xl bg-white space-y-3">
          <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider block">
            Add Ad-hoc Exercise
          </span>
          <Combobox
            options={exerciseOptions}
            value=""
            placeholder="Search & Insert Exercise..."
            onValueChange={(val) => {
              if (val) addExerciseToActiveSession(val);
            }}
          />
        </Card>

        {/* FLOATING REST TIMER WIDGET (Bottom Right) */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {restSecondsLeft !== null ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-black text-white p-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center gap-3 border border-white/10"
            >
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-black uppercase text-white/40 tracking-wider">Rest</span>
                <span className="text-sm font-black font-mono tracking-tight leading-none mt-0.5">
                  {restSecondsLeft}s
                </span>
              </div>
              
              <div className="h-6 w-px bg-white/10" />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRestTimerIsPaused(!restTimerIsPaused)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
                >
                  <Play className={cn("h-3.5 w-3.5 fill-current", !restTimerIsPaused && "hidden")} />
                  <Pause className={cn("h-3.5 w-3.5 fill-current", restTimerIsPaused && "hidden")} />
                </button>
                <button
                  onClick={() => setRestSecondsLeft(restTimerDuration)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setRestSecondsLeft((prev) => (prev ? prev + 30 : 30))}
                  className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 rounded-md text-[8px] font-bold text-white transition-colors"
                >
                  +30s
                </button>
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className="p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  {isAudioEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </button>
                <button
                  onClick={() => setRestSecondsLeft(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-red-400 hover:text-red-500 transition-colors"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </motion.div>
          ) : (
            <button
              onClick={() => {
                setRestTimerDuration(90);
                setRestSecondsLeft(90);
                setRestTimerIsPaused(false);
              }}
              className="h-10 w-10 bg-black text-white hover:bg-neutral-800 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <Timer className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* FINISH WORKOUT DIALOG */}
        <Dialog open={isFinishingWorkout} onOpenChange={setIsFinishingWorkout}>
          <DialogContent className="max-w-md rounded-3xl p-5 border-none shadow-[0_24px_80px_rgba(0,0,0,0.15)] bg-white">
            <DialogHeader className="pb-3 border-b border-neutral-100 flex flex-row items-start justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-neutral-900">Finish Workout</DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 mt-1">
                  Assess and log your physical telemetry
                </DialogDescription>
              </div>
              <button 
                onClick={() => setIsFinishingWorkout(false)}
                className="p-1 rounded-full text-neutral-300 hover:text-black hover:bg-neutral-50 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              {/* Duration and Stats */}
              <div className="grid grid-cols-2 gap-3.5 p-3.5 bg-neutral-50 rounded-2xl text-center">
                <div>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase block">Duration</span>
                  <span className="text-sm font-black text-neutral-900">{formatTime(elapsedTime)}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-neutral-400 uppercase block">Sets Logged</span>
                  <span className="text-sm font-black text-neutral-900">{totalCompletedSets} Sets</span>
                </div>
              </div>

              {/* Effort rating emojis */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider px-0.5">
                  How did this feel?
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {EFFORT_OPTIONS.map((opt) => {
                    const isSelected = selectedEffort === opt.value;
                    return (
                      <button
                        type="button"
                        key={opt.value}
                        onClick={() => setSelectedEffort(opt.value)}
                        className={cn(
                          "flex flex-col items-center justify-center p-2 border rounded-xl transition-all active:scale-95",
                          isSelected
                            ? "bg-black border-black text-white"
                            : "bg-neutral-50/50 border-black/[0.04] text-neutral-700 hover:bg-neutral-100"
                        )}
                      >
                        <span className="text-lg">{opt.emoji}</span>
                        <span className="text-[7.5px] font-bold mt-1 block truncate w-full text-center">
                          {opt.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Workout notes */}
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider px-0.5">
                  Workout Notes
                </span>
                <Textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Fatigue levels, specific PR targets achieved, minor discomfort, etc."
                  rows={3}
                  className="rounded-2xl border border-black/[0.04] bg-neutral-50 p-3.5 text-xs font-medium focus-visible:ring-0 resize-none"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveWorkoutSession}
                disabled={saving}
                className="w-full rounded-2xl h-11 bg-black text-white hover:bg-neutral-800 text-xs font-bold mt-2"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Log Workout Session
              </Button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  // ==========================================
  // RENDER INTERFACE 2: SPLIT EDITOR SCREEN
  // ==========================================
  if (isEditingSplit && activeDraftPlan) {
    return (
      <div className="mx-auto max-w-xl pb-16 space-y-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditingSplit(false);
              setActiveDraftPlan(null);
            }}
            className="rounded-xl px-2 text-neutral-500 hover:text-black"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Configure split</h1>
            <p className="text-[10px] text-neutral-400">Assemble routine parameters</p>
          </div>
        </div>

        {/* Global info cards */}
        <Card className="p-4.5 border border-black/5 rounded-2xl bg-white space-y-3.5">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Split Name</span>
            <Input
              value={activeDraftPlan.name}
              onChange={(e) => updateDraftPlan((draft) => ({ ...draft, name: e.target.value }))}
              placeholder="e.g. 4-Day Hypertrophy Push/Pull"
              className="h-9 rounded-xl border border-black/[0.04] bg-neutral-50 px-3 text-xs font-semibold focus-visible:ring-0 focus-visible:bg-neutral-100"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Description / Goal</span>
            <Textarea
              value={activeDraftPlan.notes}
              onChange={(e) => updateDraftPlan((draft) => ({ ...draft, notes: e.target.value }))}
              placeholder="Primary stimulus target, cardio schedule, etc."
              rows={2}
              className="rounded-xl border border-black/[0.04] bg-neutral-50 p-3 text-xs font-medium focus-visible:ring-0 focus-visible:bg-neutral-100 resize-none"
            />
          </div>
        </Card>

        {/* Days List */}
        <div className="space-y-5">
          {activeDraftPlan.days.map((day, dayIndex) => (
            <Card key={day.id} className="p-4 border border-black/5 rounded-2xl bg-white space-y-4 relative">
              <div className="flex justify-between items-center pb-2.5 border-b border-neutral-50">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 bg-black text-white rounded-md flex items-center justify-center text-[10px] font-bold">
                    {dayIndex + 1}
                  </span>
                  <Input
                    value={day.title}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, title: e.target.value }))}
                    className="h-7 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0"
                  />
                </div>
                
                <button
                  onClick={() => removeWorkoutDay(day.id)}
                  disabled={activeDraftPlan.days.length <= 1}
                  className="p-1 text-neutral-300 hover:text-red-500 disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Day settings grid */}
              <div className="grid grid-cols-2 gap-3.5">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Focus Target</span>
                  <Input
                    value={day.focus}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, focus: e.target.value }))}
                    placeholder="e.g. Chest & Shoulders"
                    className="h-8 rounded-lg border border-black/[0.03] bg-neutral-50/50 px-2.5 text-[11px] font-semibold focus-visible:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Warmup Notes</span>
                  <Input
                    value={day.warmup}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, warmup: e.target.value }))}
                    placeholder="e.g. 5m incline treadmill, arm circles"
                    className="h-8 rounded-lg border border-black/[0.03] bg-neutral-50/50 px-2.5 text-[11px] font-medium focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Target muscles list toggles */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Target Muscles</span>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_MUSCLES.map((muscle) => {
                    const isSelected = (day.targetMuscles || []).includes(muscle);
                    return (
                      <button
                        type="button"
                        key={muscle}
                        onClick={() => toggleMuscleInDay(day.id, muscle)}
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-bold transition-all border",
                          isSelected
                            ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
                            : "bg-neutral-50 text-neutral-400 border-neutral-100 hover:text-neutral-700"
                        )}
                      >
                        {muscle}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exercises within the day */}
              <div className="space-y-2.5 pt-3.5 border-t border-neutral-50">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Exercises</span>
                </div>

                {day.items.length > 0 ? (
                  <div className="space-y-2">
                    {day.items.map((item) => {
                      const exerciseName = data.exercises.find((e) => e.id === item.exerciseId)?.name || item.exerciseId;
                      return (
                        <div key={item.id} className="p-3 bg-neutral-50/50 border border-neutral-100 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-neutral-800">{exerciseName}</span>
                            <button
                              onClick={() => removeExerciseFromDay(day.id, item.id)}
                              className="text-neutral-300 hover:text-neutral-500"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-4 gap-1.5">
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-neutral-400 uppercase">Sets</span>
                              <Input
                                type="number"
                                value={item.sets}
                                onChange={(e) => updateExerciseField(day.id, item.id, "sets", parseInt(e.target.value) || 1)}
                                className="h-7 text-center rounded bg-white text-[10px] p-0 font-bold"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-neutral-400 uppercase">Reps</span>
                              <Input
                                value={item.reps}
                                onChange={(e) => updateExerciseField(day.id, item.id, "reps", e.target.value)}
                                className="h-7 text-center rounded bg-white text-[10px] p-0 font-bold"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-neutral-400 uppercase">Rest (s)</span>
                              <Input
                                type="number"
                                value={item.restSeconds}
                                onChange={(e) => updateExerciseField(day.id, item.id, "restSeconds", parseInt(e.target.value) || 0)}
                                className="h-7 text-center rounded bg-white text-[10px] p-0 font-bold"
                              />
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-[8px] font-bold text-neutral-400 uppercase">Target Load</span>
                              <Input
                                value={item.targetLoad}
                                onChange={(e) => updateExerciseField(day.id, item.id, "targetLoad", e.target.value)}
                                placeholder="e.g. 60kg"
                                className="h-7 text-center rounded bg-white text-[10px] p-0.5 font-bold"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-400 italic">No exercises added. Add one below.</p>
                )}

                {/* Combobox picker to add exercises */}
                <div className="pt-2">
                  <Combobox
                    options={exerciseOptions}
                    value=""
                    placeholder="Search & Add Exercise..."
                    onValueChange={(val) => {
                      if (val) addExerciseToDay(day.id, val);
                    }}
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action row at bottom */}
        <div className="flex gap-2">
          <Button
            onClick={addWorkoutDay}
            variant="outline"
            className="flex-1 rounded-2xl h-11 text-xs font-bold border-neutral-200"
          >
            <Plus className="h-4 w-4 mr-1" /> Add split day
          </Button>
          <Button
            onClick={handleSavePlan}
            disabled={saving}
            className="flex-1 rounded-2xl h-11 bg-black text-white hover:bg-neutral-800 text-xs font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save split plan
          </Button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER INTERFACE 3: MAIN WORKOUT HUB
  // ==========================================
  return (
    <div className="mx-auto max-w-md md:max-w-4xl px-2 pb-16 space-y-6">
      
      {/* High-end modern Page Title & Banner */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/10 text-emerald-600 border-none hover:bg-emerald-500/10 font-bold uppercase tracking-wider text-[9px]">
            Training Engine V2
          </Badge>
          <Badge className="bg-indigo-500/10 text-indigo-600 border-none hover:bg-indigo-500/10 font-bold uppercase tracking-wider text-[9px] flex items-center gap-1">
            <Sparkles className="h-2 w-2" /> Mobile Optimized
          </Badge>
        </div>
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-black tracking-tight text-neutral-900 md:text-3xl">
            Workout Hub
          </h1>
          <span className="text-xs font-semibold text-neutral-400">
            {sessions.length} sessions logged
          </span>
        </div>
      </div>

      {/* Segmented Pill Navigation Tab Slider */}
      <div className="grid grid-cols-3 gap-1 bg-black/[0.03] p-1 rounded-2xl border border-black/[0.04]">
        {[
          { id: "train", label: "Train Now", icon: Play },
          { id: "splits", label: "My Splits", icon: Dumbbell },
          { id: "history", label: "History", icon: History },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all relative",
                isActive 
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-500 hover:text-neutral-900 hover:bg-white/50"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* VIEW 1: TRAIN NOW */}
        {activeTab === "train" && (
          <motion.div
            key="train"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {/* Quick start empty session card */}
            <Card 
              onClick={startEmptyWorkout}
              className="p-5 border border-black/5 hover:border-black/10 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl cursor-pointer bg-gradient-to-br from-white to-neutral-50 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-black text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight text-neutral-900">
                      Quick Empty Workout
                    </CardTitle>
                    <CardDescription className="text-xs text-neutral-400 mt-0.5">
                      Log a workout from scratch without any pre-configured template.
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-neutral-300 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>

            {/* Active split scheduler / day selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                  Select Day from Split
                </span>
                {selectedPlan && (
                  <span className="text-[10px] font-bold text-emerald-600">
                    Active: {selectedPlan.name}
                  </span>
                )}
              </div>

              {selectedPlan && selectedPlan.days.length > 0 ? (
                <div className="grid gap-3">
                  {selectedPlan.days.map((day) => {
                    const exerciseCount = day.items.length;
                    return (
                      <div
                        key={day.id}
                        onClick={() => startWorkoutFromDay(day, selectedPlan)}
                        className="flex items-center justify-between p-4 bg-white border border-black/5 hover:border-black/10 rounded-2xl transition-all shadow-[0_1px_4px_rgba(0,0,0,0.01)] cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="h-8.5 w-8.5 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            {day.title.slice(0, 3)}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors">
                              {day.title}
                            </h3>
                            <p className="text-[10px] text-neutral-400 font-medium mt-0.5">
                              {day.focus || "No focus specified"} • {exerciseCount} exercises
                            </p>
                          </div>
                        </div>
                        <Play className="h-3.5 w-3.5 text-neutral-300 fill-current ml-auto group-hover:text-emerald-500 group-hover:scale-105 transition-all" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Card className="p-8 text-center border border-dashed border-black/10 rounded-2xl bg-neutral-50/50">
                  <Dumbbell className="h-8 w-8 text-neutral-300 mx-auto stroke-[1.5]" />
                  <h3 className="text-xs font-bold text-neutral-700 mt-3">No Active split loaded</h3>
                  <p className="text-[10px] text-neutral-400 max-w-xs mx-auto mt-1">
                    Set up your workout plan in the "My Splits" tab to start tracking routines instantly.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab("splits")}
                    className="mt-4 rounded-xl text-[10px] h-8 font-bold border-neutral-200"
                  >
                    Go to Splits
                  </Button>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 2: MY SPLITS */}
        {activeTab === "splits" && (
          <motion.div
            key="splits"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                Weekly splits
              </span>
              <Button 
                onClick={() => {
                  const newDraft = blankPlan(data.user.id);
                  setPlans((prev) => [newDraft, ...prev]);
                  setSelectedPlanId(newDraft.id);
                  setActiveDraftPlan(newDraft);
                  setIsEditingSplit(true);
                }}
                size="sm" 
                className="h-8 rounded-xl bg-black text-white hover:bg-neutral-800 text-[10px] font-bold gap-1 px-3"
              >
                <Plus className="h-3 w-3" /> New Split
              </Button>
            </div>

            {plans.length > 0 ? (
              <div className="grid gap-3.5">
                {plans.map((plan) => {
                  const daysCount = plan.days.length;
                  const totalExercises = plan.days.reduce((acc, d) => acc + d.items.length, 0);
                  const isDraft = !isPersistedId(plan.id);

                  return (
                    <Card
                      key={plan.id}
                      className="p-4 border border-black/5 hover:border-black/10 transition-all rounded-2xl bg-white flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold text-neutral-900">{plan.name}</h3>
                              {isDraft && (
                                <Badge className="bg-amber-100 text-amber-700 text-[8px] font-extrabold px-1.5 py-0 border-transparent">
                                  DRAFT
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-1 max-w-md line-clamp-1">
                              {plan.notes || "No extra description provided."}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => setDeletingPlanId(plan.id)}
                            className="p-1.5 text-neutral-300 hover:text-red-500 rounded-lg hover:bg-neutral-50 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-3.5 mt-4 text-[10px] text-neutral-500 font-semibold">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-neutral-400" />
                            {daysCount} {daysCount === 1 ? "day" : "days"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5 text-neutral-400" />
                            {totalExercises} total exercises
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3.5 border-t border-neutral-50">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setViewingPlan(plan);
                          }}
                          className="h-8.5 rounded-xl text-[10px] font-bold border-neutral-200"
                        >
                          View Details & Analysis
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedPlanId(plan.id);
                            setActiveDraftPlan(plan);
                            setIsEditingSplit(true);
                          }}
                          className="h-8.5 rounded-xl text-[10px] font-bold border-neutral-200"
                        >
                          <Edit3 className="h-3 w-3 mr-1" /> Configure Split
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border border-dashed border-black/10 rounded-2xl bg-neutral-50/50">
                <ClipboardList className="h-8 w-8 text-neutral-300 mx-auto stroke-[1.5]" />
                <h3 className="text-xs font-bold text-neutral-700 mt-3">No Splits Configured</h3>
                <p className="text-[10px] text-neutral-400 max-w-xs mx-auto mt-1">
                  Create a custom training template to define your weekly routines and target muscle metrics.
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {/* VIEW 3: WORKOUT HISTORY LOGS */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-1 block">
              Logged Workouts
            </span>

            {sessions.length > 0 ? (
              <div className="grid gap-3">
                {sessions.map((session) => {
                  const dateFormatted = new Date(session.startedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  const durationMins = session.endedAt
                    ? Math.round(
                        (new Date(session.endedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
                      )
                    : 0;

                  return (
                    <div
                      key={session.id}
                      onClick={() => setViewingSession(session)}
                      className="flex items-center justify-between p-4 bg-white border border-black/5 hover:border-black/10 rounded-2xl transition-all shadow-[0_1px_4px_rgba(0,0,0,0.01)] cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-neutral-900 group-hover:text-emerald-600 transition-colors">
                            {session.title}
                          </h3>
                          {session.effort && (
                            <Badge className="bg-neutral-100 text-neutral-600 border-none font-bold text-[8px] px-1 py-0.25">
                              {session.effort}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3.5 text-[9px] text-neutral-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-neutral-300" />
                            {dateFormatted}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-neutral-300" />
                            {durationMins}m duration
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-neutral-300" />
                            {session.items.length} exercises logged
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border border-dashed border-black/10 rounded-2xl bg-neutral-50/50">
                <History className="h-8 w-8 text-neutral-300 mx-auto stroke-[1.5]" />
                <h3 className="text-xs font-bold text-neutral-700 mt-3">No logged history</h3>
                <p className="text-[10px] text-neutral-400 max-w-xs mx-auto mt-1">
                  When you complete a workout session, it will be catalogued here along with stats and effort audits.
                </p>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL: VIEW PLAN & STIMULUS MAP */}
      <Dialog open={Boolean(viewingPlan)} onOpenChange={(open) => !open && setViewingPlan(null)}>
        {viewingPlan && (
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-3xl p-5 md:p-6 border-none shadow-[0_24px_80px_rgba(0,0,0,0.15)] bg-white">
            <DialogHeader className="pb-4 border-b border-neutral-100 flex flex-row items-start justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-neutral-900">{viewingPlan.name}</DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 mt-1">
                  Weekly split exercises and muscle stimulus coverage
                </DialogDescription>
              </div>
              <button 
                onClick={() => setViewingPlan(null)}
                className="p-1 rounded-full text-neutral-300 hover:text-black hover:bg-neutral-50 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {viewingPlan.days.map((day) => (
                <div key={day.id} className="space-y-2.5">
                  <div className="flex items-center justify-between bg-neutral-50 p-2.5 rounded-xl">
                    <span className="text-xs font-bold text-neutral-900">{day.title}</span>
                    <Badge className="bg-emerald-500/10 text-emerald-700 text-[8px] font-extrabold uppercase border-transparent">
                      {day.focus || "Active"}
                    </Badge>
                  </div>
                  {day.items.length > 0 ? (
                    <div className="pl-2 space-y-1.5">
                      {day.items.map((item, idx) => {
                        const exerciseName = data.exercises.find((e) => e.id === item.exerciseId)?.name || item.exerciseId;
                        return (
                          <div key={idx} className="flex justify-between items-center text-[10px] text-neutral-600">
                            <span className="font-semibold">{exerciseName}</span>
                            <span className="font-bold text-neutral-400">
                              {item.sets} x {item.reps} sets
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pl-2 text-[9px] text-neutral-400 italic">No exercises added to this day.</p>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-neutral-100">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-3">
                  Stimulus Audit
                </h4>
                <PlanAnalysis plan={viewingPlan} data={data} />
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* DETAIL MODAL: VIEW COMPLETED WORKOUT */}
      <Dialog open={Boolean(viewingSession)} onOpenChange={(open) => !open && setViewingSession(null)}>
        {viewingSession && (
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-3xl p-5 border-none shadow-[0_24px_80px_rgba(0,0,0,0.15)] bg-white">
            <DialogHeader className="pb-3 border-b border-neutral-100 flex flex-row items-start justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-neutral-900">{viewingSession.title}</DialogTitle>
                <DialogDescription className="text-xs text-neutral-400 mt-1">
                  Completed on {new Date(viewingSession.startedAt).toLocaleDateString()}
                </DialogDescription>
              </div>
              <button 
                onClick={() => setViewingSession(null)}
                className="p-1 rounded-full text-neutral-300 hover:text-black hover:bg-neutral-50 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              {viewingSession.effort && (
                <div className="flex items-center gap-2 p-2.5 bg-indigo-50/40 rounded-xl">
                  <Award className="h-4 w-4 text-indigo-500" />
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                    Effort / Feeling: {viewingSession.effort}
                  </span>
                </div>
              )}

              {viewingSession.notes && (
                <div className="p-3 bg-neutral-50 rounded-xl">
                  <h4 className="text-[9px] font-bold text-neutral-400 uppercase tracking-wider">Notes</h4>
                  <p className="text-[10px] text-neutral-600 mt-1 italic">{viewingSession.notes}</p>
                </div>
              )}

              <div className="space-y-3.5">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-neutral-400 px-1">
                  Logged Sets
                </h4>
                {viewingSession.items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3.5 bg-neutral-50/50 border border-neutral-100 rounded-2xl">
                    <h5 className="text-[11px] font-bold text-neutral-900">{item.exerciseName}</h5>
                    <div className="mt-2 space-y-1">
                      {item.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex justify-between items-center text-[10px] text-neutral-600 font-medium">
                          <span>Set {setIdx + 1}</span>
                          <span className="font-bold">
                            {set.weight ? `${set.weight} kg` : "Bodyweight"} • {set.reps} reps
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-neutral-100 flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingSessionId(viewingSession.id)}
                  className="rounded-xl text-xs font-bold text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Delete Log
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* CONFIRM DELETE MODALS */}
      <Dialog open={Boolean(deletingPlanId)} onOpenChange={(open) => !open && setDeletingPlanId(null)}>
        <DialogContent className="max-w-xs rounded-2xl p-5 border-none bg-white">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Delete Workout Split?</h3>
            <p className="text-[10px] text-neutral-400">
              This action cannot be undone. Any custom configurations will be deleted.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPlanId(null)}
                className="flex-1 rounded-xl text-[10px] font-bold border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => deletingPlanId && handleDeletePlan(deletingPlanId)}
                disabled={saving}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold"
              >
                {saving ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deletingSessionId)} onOpenChange={(open) => !open && setDeletingSessionId(null)}>
        <DialogContent className="max-w-xs rounded-2xl p-5 border-none bg-white">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-neutral-900">Delete Workout Log?</h3>
            <p className="text-[10px] text-neutral-400">
              This will permanently delete this logged workout session.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingSessionId(null)}
                className="flex-1 rounded-xl text-[10px] font-bold border-neutral-200"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => deletingSessionId && handleDeleteSession(deletingSessionId)}
                disabled={saving}
                className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white text-[10px] font-bold"
              >
                {saving ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
