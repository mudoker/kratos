"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { 
  Plus, Trash2, Loader2, Dumbbell, Clock, 
  CalendarDays, Play, ChevronRight, CheckCircle2, History,
  Award, Calendar, AlertCircle, X, Edit3, ClipboardList,
  Save, ArrowLeft, RotateCcw, Volume2, VolumeX, Timer, Check, Minus,
  Pause, Search, Copy, Star, ChevronDown, ChevronUp
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Exercise, ExerciseCategory, WeeklyPlan, WeeklyPlanDay, WeeklyPlanItem, WorkoutSession, WorkoutSessionItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActionDialog } from "@/components/shared/action-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { PlanAnalysis } from "./plan-analysis";
import { useData } from "@/components/shared/data-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const randomId = () => Math.random().toString(36).substring(2, 15);
const createDraftId = () => `draft_${randomId()}`;
const isPersistedId = (id: string) => Boolean(id) && !id.startsWith("draft_");
const isDraftPlan = (plan: WeeklyPlan) => !isPersistedId(plan.id);

const AVAILABLE_MUSCLES = [
  "Chest", "Upper Back", "Lats", "Shoulders", "Triceps", "Biceps", 
  "Forearms", "Quads", "Hamstrings", "Glutes", "Calves", "Abs", "Core", "Cardio", "Active Recovery"
];

const TEMPLATE_TAGS = [
  "Warmup", "Dropset", "Failure", "Tempo", "Paused", "AMRAP", "Unilateral"
];

const SUPERSET_GROUPS = ["None", "A", "B", "C", "D", "E", "F"];

const SUPERSET_COLORS: Record<string, string> = {
  A: "bg-card/10 text-foreground/85 border-border-strong",
  B: "bg-card/[0.075] text-foreground/75 border-border",
  C: "bg-card/[0.06] text-foreground/70 border-border",
  D: "bg-brand/20 text-foreground/80 border-border",
  E: "bg-brand/30 text-foreground/75 border-border",
  F: "bg-card/[0.045] text-foreground/65 border-border",
};

const EFFORT_OPTIONS = [
  { emoji: "🌟", value: "Relaxed", desc: "Easy RPE 1-3" },
  { emoji: "💪", value: "Moderate", desc: "Solid RPE 4-6" },
  { emoji: "🔥", value: "Challenging", desc: "Hard RPE 7-8" },
  { emoji: "🥵", value: "Exhausting", desc: "Max RPE 9-10" },
  { emoji: "💀", value: "Failure", desc: "RPE 10+ / PR push" },
];

const blankPlan = (userId: string, name = "New Plan"): WeeklyPlan => ({
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

// Extra fields deserializer/serializer helpers
const deserializeExtraFields = (prGoal: string) => {
  try {
    const parsed = JSON.parse(prGoal);
    return {
      tags: (parsed.tags || []) as string[],
      supersetGroup: (parsed.supersetGroup || "") as string,
    };
  } catch {
    return {
      tags: [] as string[],
      supersetGroup: "",
    };
  }
};

const serializeExtraFields = (tags: string[], supersetGroup: string) => {
  return JSON.stringify({ tags, supersetGroup });
};

// Deserialize set arrays from database format
const deserializeSetArray = (setsCount: number, repsStr: string, loadStr: string) => {
  const repsArr = repsStr ? repsStr.split(",") : [];
  const loadArr = loadStr ? loadStr.split(",") : [];
  const list = [];
  for (let i = 0; i < setsCount; i++) {
    list.push({
      reps: repsArr[i] || repsStr || "8-12",
      weight: loadArr[i] || loadStr || "",
    });
  }
  return list;
};

const playBeep = () => {
  if (typeof window === "undefined") return;
  try {
    const AudioContextCtor = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = new AudioContextCtor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(800, ctx.currentTime);
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
  const searchParams = useSearchParams();

  // Navigation tab: "plans" (Manage templates), "session" (Resume/Start workout), "history" (Past logs)
  const [activeTab, setActiveTab] = useState<"plans" | "session" | "history">("session");
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  
  // Exercise catalog
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [favoriteExerciseIds, setFavoriteExerciseIds] = useState<string[]>([]);

  // Search and Sort states for Plans
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alphabetical" | "edited" | "exercises">("edited");

  // Viewing details modal
  const [viewingPlan, setViewingPlan] = useState<WeeklyPlan | null>(null);
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [draftPlanPrompt, setDraftPlanPrompt] = useState<WeeklyPlan | null>(null);
  const [isStartWorkoutDialogOpen, setIsStartWorkoutDialogOpen] = useState(false);
  const [startDialogPlanId, setStartDialogPlanId] = useState<string | null>(null);

  // States for active operations
  const [isEditingSplit, setIsEditingSplit] = useState(false);
  const [activeDraftPlan, setActiveDraftPlan] = useState<WeeklyPlan | null>(null);
  
  // Active Workout session logger states
  const [draftSession, setDraftSession] = useState<Partial<WorkoutSession> | null>(null);
  const [isWorkoutLoggerOpen, setIsWorkoutLoggerOpen] = useState(false);
  const [completedSets, setCompletedSets] = useState<Record<string, boolean>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isFinishingWorkout, setIsFinishingWorkout] = useState(false);
  const [feedbackNotes, setFeedbackNotes] = useState("");
  const [selectedEffort, setSelectedEffort] = useState("Moderate");

  // Rest Timer states
  const [restSecondsLeft, setRestSecondsLeft] = useState<number | null>(null);
  const [restTimerDuration, setRestTimerDuration] = useState<number>(90);
  const [restTimerIsPaused, setRestTimerIsPaused] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRestTimerExpanded, setIsRestTimerExpanded] = useState(false);

  // Expanded exercises in workout logger
  const [loggerExpandedExercises, setLoggerExpandedExercises] = useState<Record<string, boolean>>({});

  // Expanded state for exercise cards inside the template editor
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Exercise Picker states
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [exercisePickerTargetDayId, setExercisePickerTargetDayId] = useState<string | null>(null);
  const [pickerSearchQuery, setPickerSearchQuery] = useState("");
  const [pickerFilter, setPickerFilter] = useState<"all" | "favorites" | "recent">("all");

  // Exercise Creation Modal states
  const [isCreateExerciseOpen, setIsCreateExerciseOpen] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseMuscle, setNewExerciseMuscle] = useState("Chest");
  const [newExerciseEquipment, setNewExerciseEquipment] = useState("Dumbbell");

  const [saving, setSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  // Focus ref for auto-scrolling
  const activeLoggerRowRef = useRef<HTMLDivElement | null>(null);

  // ==========================================
  // PLAN EDITOR ACTIONS AND HELPERS
  // ==========================================
  const updateDraftPlan = (updater: (draft: WeeklyPlan) => WeeklyPlan) => {
    if (!activeDraftPlan) return;
    setActiveDraftPlan(updater(activeDraftPlan));
  };

  const updateDraftPlanName = (val: string) => {
    updateDraftPlan((draft) => ({ ...draft, name: val }));
  };

  const updateDraftPlanNotes = (val: string) => {
    updateDraftPlan((draft) => ({ ...draft, notes: val }));
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
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newItem: WeeklyPlanItem = {
      id: createDraftId(),
      exerciseId,
      sets: 3,
      reps: "8,8,8",
      restSeconds: exercise.defaultRestSeconds || 90,
      targetLoad: "0,0,0",
      targetRpe: "",
      prGoal: serializeExtraFields([], ""),
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

  const duplicateExerciseInDay = (dayId: string, item: WeeklyPlanItem) => {
    const duplicated: WeeklyPlanItem = {
      ...item,
      id: createDraftId(),
    };
    updateDraftDay(dayId, (day) => {
      const idx = day.items.findIndex((itm) => itm.id === item.id);
      const nextList = [...day.items];
      nextList.splice(idx + 1, 0, duplicated);
      return {
        ...day,
        items: nextList.map((itm, index) => ({ ...itm, order: index })),
      };
    });
  };

  const moveExerciseInDay = (dayId: string, itemId: string, direction: "up" | "down") => {
    updateDraftDay(dayId, (day) => {
      const index = day.items.findIndex((itm) => itm.id === itemId);
      if (index === -1) return day;
      if (direction === "up" && index === 0) return day;
      if (direction === "down" && index === day.items.length - 1) return day;

      const nextList = [...day.items];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      const temp = nextList[index];
      nextList[index] = nextList[targetIndex];
      nextList[targetIndex] = temp;

      return {
        ...day,
        items: nextList.map((itm, idx) => ({ ...itm, order: idx })),
      };
    });
  };

  const updateExerciseField = <K extends keyof WeeklyPlanItem>(dayId: string, itemId: string, field: K, value: WeeklyPlanItem[K]) => {
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
    if (activeDraftPlan.name.trim().length === 0) {
      alert("Plan name is required.");
      return;
    }
    const hasExercises = activeDraftPlan.days.some((day) => day.items.length > 0);
    if (!hasExercises) {
      alert("Please add at least 1 exercise template to your split.");
      return;
    }

    setSaving(true);
    try {
      const isEdit = isPersistedId(activeDraftPlan.id);
      const response = await fetch("/api/plans", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(activeDraftPlan),
      });

      if (!response.ok) throw new Error("Could not save plan");
      const res = await response.json();
      
      setPlans((prev) => {
        const filtered = prev.filter((p) => p.id !== activeDraftPlan.id);
        return [res.plan, ...filtered];
      });
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

  // Set Table manipulation in editor
  const handleUpdateTemplateSet = (dayId: string, itemId: string, setIndex: number, field: "weight" | "reps", value: string, item: WeeklyPlanItem) => {
    const list = deserializeSetArray(item.sets, item.reps, item.targetLoad);
    list[setIndex] = {
      ...list[setIndex],
      [field]: value,
    };
    
    updateExerciseField(dayId, itemId, "sets", list.length);
    updateExerciseField(dayId, itemId, "reps", list.map((s) => s.reps).join(","));
    updateExerciseField(dayId, itemId, "targetLoad", list.map((s) => s.weight).join(","));
  };

  const handleAddTemplateSet = (dayId: string, itemId: string, item: WeeklyPlanItem) => {
    const list = deserializeSetArray(item.sets, item.reps, item.targetLoad);
    const last = list[list.length - 1] || { reps: "8", weight: "" };
    list.push({ ...last });

    updateExerciseField(dayId, itemId, "sets", list.length);
    updateExerciseField(dayId, itemId, "reps", list.map((s) => s.reps).join(","));
    updateExerciseField(dayId, itemId, "targetLoad", list.map((s) => s.weight).join(","));
  };

  const handleRemoveTemplateSet = (dayId: string, itemId: string, setIndex: number, item: WeeklyPlanItem) => {
    const list = deserializeSetArray(item.sets, item.reps, item.targetLoad);
    if (list.length <= 1) return;
    list.splice(setIndex, 1);

    updateExerciseField(dayId, itemId, "sets", list.length);
    updateExerciseField(dayId, itemId, "reps", list.map((s) => s.reps).join(","));
    updateExerciseField(dayId, itemId, "targetLoad", list.map((s) => s.weight).join(","));
  };

  const handleDuplicateTemplateSet = (dayId: string, itemId: string, setIndex: number, item: WeeklyPlanItem) => {
    const list = deserializeSetArray(item.sets, item.reps, item.targetLoad);
    const target = list[setIndex];
    list.splice(setIndex + 1, 0, { ...target });

    updateExerciseField(dayId, itemId, "sets", list.length);
    updateExerciseField(dayId, itemId, "reps", list.map((s) => s.reps).join(","));
    updateExerciseField(dayId, itemId, "targetLoad", list.map((s) => s.weight).join(","));
  };

  // Custom Exercise Creation Action
  const handleCreateCustomExercise = async () => {
    if (!newExerciseName.trim()) return;
    
    try {
      const response = await fetch("/api/exercises", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newExerciseName.trim(),
          category: newExerciseMuscle as ExerciseCategory,
          primaryMuscles: [newExerciseMuscle],
          equipment: newExerciseEquipment,
          defaultRestSeconds: 90,
        }),
      });

      if (!response.ok) throw new Error("Failed to create custom exercise");
      const res = await response.json();
      
      setExercises((prev) => [...prev, res.exercise]);
      if (exercisePickerTargetDayId) {
        addExerciseToDay(exercisePickerTargetDayId, res.exercise.id);
      }
      setIsCreateExerciseOpen(false);
      setNewExerciseName("");
    } catch (e) {
      console.error(e);
      alert("Could not register custom exercise.");
    }
  };

  const toggleFavoriteExercise = (id: string) => {
    const nextFavs = favoriteExerciseIds.includes(id)
      ? favoriteExerciseIds.filter((fid) => fid !== id)
      : [...favoriteExerciseIds, id];
    setFavoriteExerciseIds(nextFavs);
    localStorage.setItem("kratos_favorite_exercises", JSON.stringify(nextFavs));
  };

  const handleDuplicatePlan = (plan: WeeklyPlan) => {
    const duplicated: WeeklyPlan = {
      ...plan,
      id: createDraftId(),
      name: `${plan.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      days: plan.days.map((day) => ({
        ...day,
        id: `draft-day-${randomId()}`,
        items: day.items.map((item) => ({
          ...item,
          id: createDraftId(),
        })),
      })),
    };
    setPlans((prev) => [duplicated, ...prev]);
    setActiveDraftPlan(duplicated);
    setIsEditingSplit(true);
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

  // ==========================================
  // METRICS AND HISTORY RETRIEVALS
  // ==========================================
  const getExercisePR = (exerciseId: string) => {
    const record = data.records.find((r) => r.exerciseId === exerciseId);
    if (record) {
      return {
        weight: String(record.value),
        reps: String(record.reps),
      };
    }
    
    let bestWeight = 0;
    let bestReps = 0;
    sessions.forEach((s) => {
      s.items.forEach((item) => {
        if (item.exerciseId === exerciseId) {
          item.sets.forEach((set) => {
            const w = parseFloat(set.weight) || 0;
            const r = parseInt(set.reps) || 0;
            if (w > bestWeight || (w === bestWeight && r > bestReps)) {
              bestWeight = w;
              bestReps = r;
            }
          });
        }
      });
    });

    if (bestWeight > 0) {
      return {
        weight: String(bestWeight),
        reps: String(bestReps),
      };
    }
    return null;
  };

  const getPreviousSessionPerformance = (exerciseId: string) => {
    const latest = [...sessions]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .find((s) => s.items.some((item) => item.exerciseId === exerciseId));
    
    if (latest) {
      const item = latest.items.find((i) => i.exerciseId === exerciseId);
      return {
        date: new Date(latest.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        sets: item?.sets || [],
      };
    }
    return null;
  };

  const getPreviousSessionItem = (exerciseId: string) => {
    const latest = [...sessions]
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
      .find((s) => s.items.some((item) => item.exerciseId === exerciseId));

    return latest?.items.find((item) => item.exerciseId === exerciseId) ?? null;
  };

  const checkIsNewPR = (exerciseId: string, weightStr: string, repsStr: string) => {
    const w = parseFloat(weightStr) || 0;
    const r = parseInt(repsStr) || 0;
    if (w <= 0 || r <= 0) return false;
    
    const pr = getExercisePR(exerciseId);
    if (!pr) return true;
    
    const prW = parseFloat(pr.weight) || 0;
    const prR = parseInt(pr.reps) || 0;
    
    return w > prW || (w === prW && r > prR);
  };

  const wasCompletedPreviously = (exerciseId: string, weight: string, reps: string) => {
    const pr = getExercisePR(exerciseId);
    if (!pr) return false;
    return parseFloat(weight) === parseFloat(pr.weight) && parseInt(reps) === parseInt(pr.reps);
  };

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

  // ==========================================
  // ACTIVE WORKOUT SESSIONS HANDLERS
  // ==========================================
  const startEmptyWorkout = () => {
    const session: Partial<WorkoutSession> = {
      id: createDraftId(),
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
    setCompletedSets({});
    setIsWorkoutLoggerOpen(true);
    setIsStartWorkoutDialogOpen(false);
    setStartDialogPlanId(null);
  };

  const openStartWorkoutDialog = (planId?: string) => {
    setStartDialogPlanId(planId ?? null);
    setIsStartWorkoutDialogOpen(true);
  };

  const startWorkoutFromDay = (day: WeeklyPlanDay, plan: WeeklyPlan) => {
    if (isDraftPlan(plan)) {
      setDraftPlanPrompt(plan);
      return;
    }

    const session: Partial<WorkoutSession> = {
      id: createDraftId(),
      planId: plan.id,
      planDayId: day.id,
      startedAt: new Date().toISOString(),
      endedAt: null,
      day: day.day,
      title: `${plan.name} • ${day.title}`,
      effort: "",
      notes: day.notes || "",
      items: day.items.map((item, order) => {
        const setList = deserializeSetArray(item.sets, item.reps, item.targetLoad);
        const previousItem = getPreviousSessionItem(item.exerciseId);
        return {
          id: createDraftId(),
          exerciseId: item.exerciseId,
          exerciseName: exercises.find((e) => e.id === item.exerciseId)?.name || item.exerciseId,
          plannedSets: item.sets,
          reps: item.reps,
          restSeconds: previousItem?.restSeconds || item.restSeconds,
          targetLoad: item.targetLoad,
          targetRpe: item.targetRpe,
          sets: setList.map((s, setIndex) => ({
            weight: previousItem?.sets?.[setIndex]?.weight || s.weight,
            reps: previousItem?.sets?.[setIndex]?.reps || s.reps,
          })),
          notes: item.notes,
          order,
        };
      }),
    };
    setDraftSession(session);
    setElapsedTime(0);
    setRestSecondsLeft(null);
    setIsFinishingWorkout(false);
    setFeedbackNotes(day.notes || "");
    setSelectedEffort("Moderate");
    setCompletedSets({});
    setIsWorkoutLoggerOpen(true);
    setIsStartWorkoutDialogOpen(false);
    setStartDialogPlanId(null);

    if (session.items && session.items.length > 0) {
      setLoggerExpandedExercises({ [session.items[0].id]: true });
    }
  };

  const handleToggleSetComplete = (itemIndex: number, setIndex: number) => {
    if (!draftSession || !draftSession.items) return;

    const currentItem = draftSession.items[itemIndex];
    const key = `${currentItem.id}-${setIndex}`;
    const wasCompleted = Boolean(completedSets[key]);

    setCompletedSets((prev) => {
      const next = { ...prev, [key]: !wasCompleted };
      localStorage.setItem("kratos_completed_sets", JSON.stringify(next));
      return next;
    });

    if (!wasCompleted) {
      if (isAudioEnabled) playBeep();

      const restSecs = currentItem.restSeconds || 90;
      setRestTimerDuration(restSecs);
      setRestSecondsLeft(restSecs);
      setRestTimerIsPaused(false);

      const allSetsDone = currentItem.sets.every((_, sIdx) => {
        const checkKey = `${currentItem.id}-${sIdx}`;
        return sIdx === setIndex ? true : Boolean(completedSets[checkKey]);
      });

      if (allSetsDone) {
        setLoggerExpandedExercises((prev) => ({
          ...prev,
          [currentItem.id]: false,
        }));
        
        const nextIncompleteIdx = draftSession.items.findIndex((itm, idx) => {
          if (idx <= itemIndex) return false;
          return itm.sets.some((_, sIdx) => !completedSets[`${itm.id}-${sIdx}`]);
        });

        if (nextIncompleteIdx !== -1) {
          const nextItem = draftSession.items[nextIncompleteIdx];
          setLoggerExpandedExercises((prev) => ({
            ...prev,
            [nextItem.id]: true,
          }));
          
          setTimeout(() => {
            if (activeLoggerRowRef.current) {
              activeLoggerRowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 150);
        }
      }
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

  const handleRemoveSetActiveSession = (itemIndex: number, setIndex: number) => {
    if (!draftSession || !draftSession.items) return;
    
    const newItems = [...draftSession.items];
    const currentItem = newItems[itemIndex];
    if (currentItem.sets.length <= 1) return;
    
    currentItem.sets = currentItem.sets.filter((_, idx) => idx !== setIndex);
    
    // Clear completed key for safety
    const key = `${currentItem.id}-${setIndex}`;
    setCompletedSets((prev) => {
      const next = { ...prev };
      delete next[key];
      localStorage.setItem("kratos_completed_sets", JSON.stringify(next));
      return next;
    });

    setDraftSession((prev) => ({
      ...prev,
      items: newItems,
    }));
  };

  const addExerciseToActiveSession = (exerciseId: string) => {
    if (!draftSession || !draftSession.items) return;
    const exercise = exercises.find((e) => e.id === exerciseId);
    if (!exercise) return;

    const newItem: WorkoutSessionItem = {
      id: createDraftId(),
      exerciseId,
      exerciseName: exercise.name,
      plannedSets: 3,
      reps: "8,8,8",
      restSeconds: exercise.defaultRestSeconds || 90,
      targetLoad: "0,0,0",
      targetRpe: "",
      sets: Array.from({ length: 3 }).map(() => ({ weight: "", reps: "" })),
      notes: "",
      order: draftSession.items.length,
    };

    setDraftSession((prev) => ({
      ...prev,
      items: [...(prev?.items || []), newItem],
    }));

    setLoggerExpandedExercises((prev) => ({
      ...prev,
      [newItem.id]: true,
    }));
  };

  const discardActiveWorkout = () => {
    setDraftSession(null);
    setIsWorkoutLoggerOpen(false);
    setRestSecondsLeft(null);
    setCompletedSets({});
    setIsFinishingWorkout(false);
    setFeedbackNotes("");
    setSelectedEffort("Moderate");
    localStorage.removeItem("kratos_active_session");
    localStorage.removeItem("kratos_completed_sets");
  };

  const handleSaveWorkoutSession = async () => {
    if (!draftSession) return;
    setSaving(true);
    try {
      const isEdit = Boolean(draftSession.id && isPersistedId(draftSession.id));
      
      const cleanedItems = (draftSession.items || []).map((item) => ({
        ...item,
        sets: item.sets.map((set) => ({
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
      discardActiveWorkout();
      router.refresh();
      setActiveTab("history");
    } catch (err) {
      console.error(err);
      alert("Error saving workout session");
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // SEARCH FILTER MEMOS
  // ==========================================
  const filteredPlans = useMemo(() => {
    const list = plans.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const notesMatch = p.notes.toLowerCase().includes(searchQuery.toLowerCase());
      return nameMatch || notesMatch;
    });

    if (sortBy === "alphabetical") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === "exercises") {
      return [...list].sort((a, b) => {
        const countA = a.days.reduce((acc, d) => acc + d.items.length, 0);
        const countB = b.days.reduce((acc, d) => acc + d.items.length, 0);
        return countB - countA;
      });
    }
    return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [plans, searchQuery, sortBy]);

  const filteredPickerExercises = useMemo(() => {
    let list = exercises;
    
    if (pickerFilter === "favorites") {
      list = list.filter((e) => favoriteExerciseIds.includes(e.id));
    } else if (pickerFilter === "recent") {
      list = list.slice(0, 15);
    }

    if (pickerSearchQuery.trim()) {
      list = list.filter((e) => 
        e.name.toLowerCase().includes(pickerSearchQuery.toLowerCase()) || 
        e.category.toLowerCase().includes(pickerSearchQuery.toLowerCase())
      );
    }
    
    return list;
  }, [exercises, favoriteExerciseIds, pickerFilter, pickerSearchQuery]);

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    setIsClient(true);
    setPlans(data.plans || []);
    setSessions(data.sessions || []);
    setExercises(data.exercises || []);

    const favs = localStorage.getItem("kratos_favorite_exercises");
    if (favs) {
      try {
        setFavoriteExerciseIds(JSON.parse(favs));
      } catch {
        // Ignore malformed local preference data.
      }
    }
    
    const saved = localStorage.getItem("kratos_active_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDraftSession(parsed);
        setIsWorkoutLoggerOpen(true);
        setActiveTab("session");
      } catch (e) {
        console.warn("Could not restore active session", e);
      }
    }

    const savedCompleted = localStorage.getItem("kratos_completed_sets");
    if (savedCompleted) {
      try {
        setCompletedSets(JSON.parse(savedCompleted));
      } catch {
        // Ignore malformed local session state.
      }
    }
  }, [data.plans, data.sessions, data.exercises]);

  useEffect(() => {
    const action = searchParams.get("action");
    const planId = searchParams.get("planId");
    if (!action || !planId || plans.length === 0) return;

    const plan = plans.find((candidate) => candidate.id === planId);
    if (!plan) return;

    if (action === "edit") {
      setActiveDraftPlan(plan);
      setIsEditingSplit(true);
    }

    if (action === "start") {
      setActiveTab("session");
      openStartWorkoutDialog(plan.id);
    }

    router.replace("/train");
  }, [plans, router, searchParams]);

  // Stopwatch ticking logic
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
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
    let timer: ReturnType<typeof setInterval> | undefined;
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

  // Autosave active session changes instantly
  useEffect(() => {
    if (isClient) {
      if (draftSession) {
        localStorage.setItem("kratos_active_session", JSON.stringify(draftSession));
      } else {
        localStorage.removeItem("kratos_active_session");
      }
    }
  }, [draftSession, isClient]);

  if (!isClient) {
    return (
      <div className="flex h-[50vh] items-center justify-center bg-[color:var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-foreground/60" />
      </div>
    );
  }

  // ==========================================
  // RENDER INTERFACE 1: ACTIVE WORKOUT LOGGER
  // ==========================================
  if (draftSession && isWorkoutLoggerOpen) {
    const totalCompletedSets = (draftSession.items || []).reduce((acc, item) => {
      let count = 0;
      item.sets.forEach((_, setIdx) => {
        if (completedSets[`${item.id}-${setIdx}`]) {
          count++;
        }
      });
      return acc + count;
    }, 0);
    const totalPlannedSets = (draftSession.items || []).reduce((acc, item) => {
      return acc + item.sets.length;
    }, 0);
    const completionPercent = totalPlannedSets > 0 ? Math.round((totalCompletedSets / totalPlannedSets) * 100) : 0;
    const currentItemIndex = (draftSession.items || []).findIndex((item) =>
      item.sets.some((_, setIdx) => !completedSets[`${item.id}-${setIdx}`])
    );
    const currentItem = currentItemIndex >= 0 ? draftSession.items?.[currentItemIndex] : null;
    const currentSetIndex = currentItem
      ? currentItem.sets.findIndex((_, setIdx) => !completedSets[`${currentItem.id}-${setIdx}`])
      : -1;
    const currentPreviousSet = currentItem
      ? getPreviousSessionPerformance(currentItem.exerciseId)?.sets[currentSetIndex]
      : undefined;

    return (
      <div className="mx-auto w-full max-w-5xl min-h-[calc(100dvh-5rem)] space-y-3 bg-[color:var(--background)] pb-28 text-foreground sm:space-y-4 lg:min-h-[calc(100dvh-2rem)] lg:pb-8">
        
        {/* Sticky top timer bar */}
        <div className="sticky top-[47px] z-30 rounded-none border-b border-border bg-card px-3 py-2.5 shadow-[0_8px_24px_rgba(0,0,0,0.035)] sm:rounded-2xl sm:border lg:top-0 lg:px-4">
          <div className="flex items-center justify-between gap-2.5">
            <div className="flex min-w-0 items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsWorkoutLoggerOpen(false);
                  setActiveTab("session");
                }}
                aria-label="Back to training"
                className="h-8 w-8 shrink-0 rounded-lg p-0 text-muted-foreground hover:bg-card/10 hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0">
                <h1 className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[10px]">
                  Active workout
                </h1>
                <p className="mt-0.5 truncate text-sm font-semibold text-foreground">
                  {draftSession.title}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg border border-border bg-foreground/[0.035] px-2 py-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-black font-mono tracking-tight text-foreground">
                  {formatTime(elapsedTime)}
                </span>
              </div>

              <Button
                onClick={() => setIsFinishingWorkout(true)}
                className="h-8 rounded-lg px-3 text-[10px] font-bold"
              >
                Finish
              </Button>
            </div>
          </div>

          <div className="mt-2.5 flex items-center gap-2.5">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-foreground/10">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${completionPercent}%` }} />
            </div>
            <span className="text-[10px] font-black text-muted-foreground">{completionPercent}%</span>
          </div>
        </div>

        <Card className="rounded-xl p-3 sm:rounded-2xl sm:p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-foreground/45">Current set</p>
              <h2 className="mt-1 truncate text-sm font-semibold text-foreground sm:text-base">
                {currentItem ? currentItem.exerciseName : "Workout complete"}
              </h2>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground">
                {currentItem && currentSetIndex >= 0
                  ? `Set ${currentSetIndex + 1} of ${currentItem.sets.length}`
                  : "Review and finish your session."}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-foreground/[0.035] px-2.5 py-2 text-right">
              <p className="text-[9px] font-bold uppercase text-muted-foreground">Done</p>
              <p className="text-sm font-black text-foreground">{totalCompletedSets}/{totalPlannedSets}</p>
            </div>
          </div>
          {currentItem && currentSetIndex >= 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-3 border-t border-border pt-3">
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase text-muted-foreground">Target</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-foreground">{currentItem.reps || "8-12"} reps</p>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase text-muted-foreground">Previous</p>
                <p className="mt-1 truncate text-[11px] font-semibold text-foreground">
                  {currentPreviousSet ? `${currentPreviousSet.weight || 0} x ${currentPreviousSet.reps}` : "None"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[8px] font-bold uppercase text-muted-foreground">Rest</p>
                <p className="mt-1 text-[11px] font-semibold text-foreground">{currentItem.restSeconds || 90}s</p>
              </div>
            </div>
          ) : null}
        </Card>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm("Discard active workout? This cannot be undone.")) {
                discardActiveWorkout();
              }
            }}
            className="h-7 rounded-lg px-2.5 text-[10px] font-semibold text-[#FF5A5F] hover:bg-[#FF5A5F]/10 hover:text-[#FF5A5F]"
          >
            Discard
          </Button>
        </div>

        {/* Exercises list with set tracking */}
        <div className="space-y-3">
          {(draftSession.items || []).map((item, itemIdx) => {
            const isExpanded = loggerExpandedExercises[item.id] ?? false;
            
            const pr = getExercisePR(item.exerciseId);
            const prevPerf = getPreviousSessionPerformance(item.exerciseId);
            const extras = deserializeExtraFields(item.targetRpe);
            const isFavorite = favoriteExerciseIds.includes(item.exerciseId);
            const isCurrentExercise = currentItem?.id === item.id;

            return (
              <Card
                key={item.id}
                className={cn(
                  "rounded-2xl border bg-card p-3.5 space-y-3 transition sm:p-4",
                  isCurrentExercise ? "border-border-strong shadow-[0_14px_52px_rgba(255,255,255,0.05)]" : "border-border"
                )}
              >
                
                <div 
                  onClick={() => setLoggerExpandedExercises((prev) => ({ ...prev, [item.id]: !isExpanded }))}
                  className="flex justify-between items-start cursor-pointer group"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <h3 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-foreground/75">
                        {item.exerciseName}
                      </h3>
                      {isFavorite && <Star className="h-3 w-3 fill-[#FFB547] text-[#FFB547]" />}
                    </div>
                    
                    {!isExpanded && (
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {item.sets.length} sets • PR: {pr ? `${pr.weight} kg x ${pr.reps}` : "None"}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {extras.supersetGroup && (
                      <Badge className={cn("text-[7.5px] font-black border uppercase px-1.5 py-0.25", SUPERSET_COLORS[extras.supersetGroup] || "bg-foreground/10")}>
                        SS {extras.supersetGroup}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-3 pt-1">
                    
                    {/* Previous/Best records panel */}
                    <div className="hidden grid-cols-2 gap-3 text-[10px] bg-foreground/[0.035] p-2.5 rounded-lg border border-border sm:grid">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold uppercase text-muted-foreground">Personal Record</span>
                        <p className="font-bold text-foreground">
                          {pr ? `${pr.weight} kg x ${pr.reps}` : "No logged record"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold uppercase text-muted-foreground">
                          Last Session {prevPerf ? `(${prevPerf.date})` : ""}
                        </span>
                        <p className="font-bold text-foreground truncate">
                          {prevPerf 
                            ? prevPerf.sets.map((s) => `${s.weight}x${s.reps}`).join(", ")
                            : "No logged history"}
                        </p>
                      </div>
                    </div>

                    {/* Sets Logger Table */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-[26px_1fr_1fr_40px] gap-2 text-[8px] font-bold text-muted-foreground uppercase tracking-wider text-center sm:grid-cols-[32px_1fr_1fr_44px]">
                        <span>Set</span>
                        <span>Kg</span>
                        <span>Reps</span>
                        <span>Done</span>
                      </div>

                      {item.sets.map((set, setIdx) => {
                        const checkKey = `${item.id}-${setIdx}`;
                        const isDone = Boolean(completedSets[checkKey]);
                        const isNewPR = !wasCompletedPreviously(item.exerciseId, set.weight, set.reps) && checkIsNewPR(item.exerciseId, set.weight, set.reps);
                        const prevSet = prevPerf?.sets[setIdx];

                        return (
                          <div
                            key={setIdx}
                            ref={(!isDone && setIdx === 0) ? activeLoggerRowRef : null}
                            className={cn(
                              "grid grid-cols-[26px_1fr_1fr_40px] gap-2 items-center rounded-xl border p-1 text-center transition-all sm:grid-cols-[32px_1fr_1fr_44px]",
                              isDone 
                                ? "bg-[#34C759]/5 text-[#34C759] border-[#34C759]/20" 
                                : "bg-foreground/[0.03] border-transparent"
                            )}
                          >
                            <span className="text-[10px] font-black">{setIdx + 1}</span>
                            
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder={prevSet?.weight || "0"}
                              value={set.weight}
                              onChange={(e) => handleUpdateActiveSetField(itemIdx, setIdx, "weight", e.target.value)}
                              className="h-10 rounded-xl border border-border bg-foreground/[0.035] text-center text-sm font-semibold text-foreground focus-visible:ring-0 focus-visible:bg-foreground/10 sm:h-9"
                            />
                            
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder={prevSet?.reps || "8"}
                              value={set.reps}
                              onChange={(e) => handleUpdateActiveSetField(itemIdx, setIdx, "reps", e.target.value)}
                              className="h-10 rounded-xl border border-border bg-foreground/[0.035] text-center text-sm font-semibold text-foreground focus-visible:ring-0 focus-visible:bg-foreground/10 sm:h-9"
                            />

                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleToggleSetComplete(itemIdx, setIdx)}
                              className={cn(
                                "mx-auto flex h-8 w-8 items-center justify-center rounded-full border p-0 transition-all active:scale-95 sm:h-9 sm:w-9",
                                isDone
                                  ? "bg-[#34C759] border-[#34C759] text-foreground"
                                  : "border-border text-transparent hover:border-[#AAAAAA]"
                              )}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                            </Button>
                            
                            {isDone && isNewPR && (
                              <span className="col-span-4 text-[8px] font-extrabold text-[#FFB547] bg-[#FFB547]/10 py-0.5 rounded uppercase tracking-wider block text-left px-2">
                                NEW PR
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSetActiveSession(itemIdx, item.sets.length - 1)}
                        disabled={item.sets.length <= 1}
                        className="h-7 rounded-lg text-[9px] font-bold text-muted-foreground hover:text-foreground hover:bg-card/10 gap-1"
                      >
                        <Minus className="h-3 w-3" /> Remove
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddSetActiveSession(itemIdx)}
                        className="h-7 rounded-lg text-[9px] font-bold text-foreground/70 hover:bg-card/10 hover:text-foreground gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add
                      </Button>
                    </div>

                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="rounded-xl p-3 sm:p-4">
          <span className="hidden text-[9px] font-bold text-muted-foreground uppercase tracking-wider sm:block">
            Add exercise
          </span>
          <Button
            onClick={() => {
              setExercisePickerTargetDayId(null);
              setIsExercisePickerOpen(true);
              setPickerSearchQuery("");
            }}
            variant="outline"
            className="w-full h-8.5 rounded-lg text-xs font-semibold gap-1"
          >
            <Plus className="h-4 w-4" /> Add Exercise
          </Button>
        </Card>

        {/* FLOATING REST TIMER PILL WIDGET */}
        <div className="fixed bottom-24 right-4 z-40 flex flex-col items-end gap-2 sm:bottom-6 sm:right-6">
          {restSecondsLeft !== null ? (
            <motion.div
              layoutId="restTimerWidget"
              className="bg-card border border-border text-foreground p-2.5 rounded-2xl shadow-[0_12px_36px_rgba(0,0,0,0.12)] flex items-center gap-2 select-none sm:p-3 sm:gap-3"
            >
              <div 
                onClick={() => setIsRestTimerExpanded(!isRestTimerExpanded)}
                className="flex flex-col items-center cursor-pointer min-w-[40px]"
              >
                <span className="text-[7.5px] font-bold uppercase text-muted-foreground tracking-wider">Rest</span>
                <span className="text-sm font-black font-mono mt-0.5 leading-none">
                  {restSecondsLeft}s
                </span>
              </div>
              
              <div className="h-6 w-px bg-foreground/10" />

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRestTimerIsPaused(!restTimerIsPaused)}
                  className="h-7 w-7 rounded-lg p-0 text-foreground hover:bg-card/10"
                >
                  {restTimerIsPaused ? (
                    <Play className="h-3.5 w-3.5 fill-current text-foreground" />
                  ) : (
                    <Pause className="h-3.5 w-3.5 fill-current text-foreground" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRestSecondsLeft(restTimerDuration)}
                  className="h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-card/10 hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRestSecondsLeft((prev) => (prev ? prev + 15 : 15))}
                  className="h-7 rounded-lg bg-foreground/10 px-2 py-0 text-[8px] font-bold text-foreground hover:bg-foreground/10"
                >
                  +15s
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setRestSecondsLeft((prev) => (prev && prev > 15 ? prev - 15 : 1))}
                  className="hidden h-7 rounded-lg bg-foreground/10 px-2 py-0 text-[8px] font-bold text-foreground hover:bg-foreground/10 sm:inline-flex"
                >
                  -15s
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className="h-7 w-7 rounded-lg p-0 text-muted-foreground hover:bg-card/10 hover:text-foreground"
                >
                  {isAudioEnabled ? <Volume2 className="h-3.5 w-3.5 text-[#34C759]" /> : <VolumeX className="h-3.5 w-3.5 text-[#FF5A5F]" />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setRestSecondsLeft(null)}
                  className="h-7 w-7 rounded-lg p-0 text-[#FF5A5F] hover:bg-[#FF5A5F]/10 hover:text-[#FF5A5F]"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ) : (
            <Button
              type="button"
              size="icon"
              onClick={() => {
                setRestTimerDuration(90);
                setRestSecondsLeft(90);
                setRestTimerIsPaused(false);
              }}
              className="h-10 w-10 rounded-full shadow-lg"
            >
              <Timer className="h-5 w-5" />
            </Button>
          )}
        </div>

        {/* FINISH WORKOUT SUMMARY MODAL */}
        <Dialog open={isFinishingWorkout} onOpenChange={setIsFinishingWorkout}>
          <DialogContent className="max-w-md rounded-2xl p-5 border-none bg-card text-foreground">
            <DialogHeader className="pb-3 pr-10 border-b border-border">
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Finish Workout</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Rate fatigue and save historic session log
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              <div className="grid grid-cols-2 gap-3 p-3 bg-foreground/[0.035] border border-border rounded-xl text-center">
                <div>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase block">Duration</span>
                  <span className="text-xs font-black text-foreground font-mono">{formatTime(elapsedTime)}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-muted-foreground uppercase block">Sets Logged</span>
                  <span className="text-xs font-black text-foreground font-mono">{totalCompletedSets} Sets</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-0.5">
                  How did this feel?
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {EFFORT_OPTIONS.map((opt) => {
                    const isSelected = selectedEffort === opt.value;
                    return (
                      <Button
                        type="button"
                        key={opt.value}
                        variant="ghost"
                        onClick={() => setSelectedEffort(opt.value)}
                        className={cn(
                          "h-auto min-w-0 flex-col items-center justify-center rounded-xl border p-2 transition-all active:scale-95 hover:bg-foreground/10",
                          isSelected
                            ? "bg-card border-brand text-foreground"
                            : "bg-foreground/[0.03] border-border text-muted-foreground hover:bg-foreground/10"
                        )}
                      >
                        <span className="text-base">{opt.emoji}</span>
                        <span className="text-[8px] font-bold mt-1 block truncate w-full text-center">
                          {opt.value}
                        </span>
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider px-0.5">
                  Session Notes
                </span>
                <Textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Notes about specific weights, minor fatigue levels..."
                  rows={2}
                  className="rounded-xl border border-border bg-foreground/[0.035] p-3 text-xs font-medium focus-visible:ring-0 resize-none text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                <Button
                  onClick={handleSaveWorkoutSession}
                  disabled={saving}
                  className="h-11 rounded-xl text-xs font-bold"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                  Save workout
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => {
                    if (confirm("Discard active workout? This cannot be undone.")) {
                      discardActiveWorkout();
                    }
                  }}
                  className="h-11 rounded-xl text-xs font-bold text-[#FF5A5F] hover:bg-[#FF5A5F]/10 hover:text-[#FF5A5F]"
                >
                  Discard
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* EXERCISE PICKER DIALOG */}
        <Dialog open={isExercisePickerOpen} onOpenChange={setIsExercisePickerOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-4 border-none bg-card text-foreground">
            <DialogHeader className="pb-3 pr-10 border-b border-border">
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Add Exercise</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Search catalog for ad-hoc additions
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="Fuzzy search movement..."
                  className="pl-9 h-9 rounded-lg border-border bg-foreground/[0.035] text-foreground placeholder:text-muted-foreground text-xs font-semibold focus-visible:ring-1 focus-visible:ring-brand"
                  autoFocus
                />
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredPickerExercises.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => {
                      addExerciseToActiveSession(ex.id);
                      setIsExercisePickerOpen(false);
                    }}
                    className="p-2.5 bg-foreground/[0.035] hover:bg-foreground/10 rounded-lg border border-border cursor-pointer transition-colors"
                  >
                    <h4 className="text-xs font-bold text-foreground">{ex.name}</h4>
                    <span className="text-[9.5px] text-muted-foreground font-semibold mt-0.5 block">
                      {ex.category} • {ex.equipment}
                    </span>
                  </div>
                ))}
              </div>
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
      <div className="mx-auto max-w-xl pb-32 space-y-3.5 bg-[color:var(--background)] text-foreground sm:space-y-4 lg:pb-16">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditingSplit(false);
              setActiveDraftPlan(null);
            }}
            className="rounded-lg px-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <h1 className="text-base font-semibold tracking-tight text-foreground">Edit plan</h1>
            <p className="text-[10px] text-muted-foreground">Configure targets and set schema</p>
          </div>
        </div>

        {/* Global info cards */}
        <Card className="rounded-2xl border border-border bg-card p-3.5 space-y-3 sm:p-4">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Plan Name</span>
            <Input
              value={activeDraftPlan.name}
              maxLength={100}
              onChange={(e) => updateDraftPlanName(e.target.value)}
              placeholder="e.g. Upper Body Hypertrophy"
              className="h-9 rounded-lg border-border bg-foreground/[0.035] text-foreground px-3 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-brand"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Description</span>
            <Textarea
              value={activeDraftPlan.notes}
              maxLength={500}
              onChange={(e) => updateDraftPlanNotes(e.target.value)}
              placeholder="Primary hypertrophy targets, tempos..."
              rows={2}
              className="rounded-lg border-border bg-foreground/[0.035] text-foreground p-3 text-xs font-medium focus-visible:ring-0 focus-visible:ring-brand resize-none"
            />
          </div>
        </Card>

        {/* Days List */}
        <div className="space-y-3">
          {activeDraftPlan.days.map((day, dayIndex) => (
            <Card key={day.id} className="rounded-2xl border border-border bg-card p-3.5 space-y-3 sm:p-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-border">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 bg-foreground/[0.035] border border-border text-foreground rounded flex items-center justify-center text-[10px] font-black">
                    {dayIndex + 1}
                  </span>
                  <Input
                    value={day.title}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, title: e.target.value }))}
                    className="h-7 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0 focus-visible:ring-brand"
                  />
                </div>
                
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeWorkoutDay(day.id)}
                  disabled={activeDraftPlan.days.length <= 1}
                  className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-[#FF5A5F]/10 hover:text-[#FF5A5F] disabled:opacity-30"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Day settings grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Focus Area</span>
                  <Input
                    value={day.focus}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, focus: e.target.value }))}
                    placeholder="e.g. Chest & Shoulders"
                    className="h-8 rounded-lg border-border bg-foreground/[0.035] px-2.5 text-[11px] font-semibold focus-visible:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Warmup description</span>
                  <Input
                    value={day.warmup}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, warmup: e.target.value }))}
                    placeholder="Incline walks, bands..."
                    className="h-8 rounded-lg border-border bg-foreground/[0.035] px-2.5 text-[11px] font-medium focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Target muscles list toggles */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Target Muscles</span>
                <div className="flex flex-wrap gap-1">
                  {AVAILABLE_MUSCLES.map((muscle) => {
                    const isSelected = (day.targetMuscles || []).includes(muscle);
                    return (
                      <Button
                        type="button"
                        key={muscle}
                        variant="outline"
                        size="sm"
                        onClick={() => toggleMuscleInDay(day.id, muscle)}
                        className={cn(
                          "h-6 rounded-full px-2 py-0 text-[9px] font-bold transition-all",
                          isSelected
                            ? "bg-card/10 text-foreground border-border"
                            : "bg-foreground/[0.035] text-muted-foreground border-border hover:text-foreground"
                        )}
                      >
                        {muscle}
                      </Button>
                    );
                  })}
                </div>
              </div>

              {/* Exercises within the day */}
              <div className="space-y-3 pt-3 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Exercise templates</span>
                </div>

                {day.items.length > 0 ? (
                  <div className="space-y-2.5">
                    {day.items.map((item) => {
                      const exercise = exercises.find((e) => e.id === item.exerciseId);
                      const exerciseName = exercise?.name || item.exerciseId;
                      const isExpanded = expandedExerciseId === item.id;
                      
                      const extras = deserializeExtraFields(item.prGoal);
                      const isFavorite = favoriteExerciseIds.includes(item.exerciseId);
                      const setList = deserializeSetArray(item.sets, item.reps, item.targetLoad);

                      return (
                        <div key={item.id} className="border border-border bg-foreground/[0.035] rounded-xl overflow-hidden">
                          
                          {/* COLLAPSED HEADER */}
                          <div 
                            onClick={() => setExpandedExerciseId(isExpanded ? null : item.id)}
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-foreground/5 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {extras.supersetGroup && (
                                <Badge className={cn("text-[8px] font-extrabold px-1 border", SUPERSET_COLORS[extras.supersetGroup] || "bg-foreground/10")}>
                                  SS {extras.supersetGroup}
                                </Badge>
                              )}
                              <span className="text-xs font-bold text-foreground leading-none">{exerciseName}</span>
                              {isFavorite && <Star className="h-3 w-3 fill-[#FFB547] text-[#FFB547] shrink-0" />}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-muted-foreground">
                                {item.sets} {item.sets === 1 ? "set" : "sets"} • {item.restSeconds}s rest
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                              )}
                            </div>
                          </div>

                          {/* EXPANDED DETAILS */}
                          {isExpanded && (
                            <div className="p-3 border-t border-border space-y-3.5 bg-card">
                              
                              {/* Exercise actions */}
                              <div className="flex justify-between items-center pb-2 border-b border-border">
                                <span className="text-[9.5px] font-bold text-muted-foreground">
                                  Muscle: {exercise?.category || "Other"} • {exercise?.equipment || "Barbell"}
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => moveExerciseInDay(day.id, item.id, "up")}
                                    className="h-7 w-7 rounded-lg border-border bg-foreground/[0.035] p-0 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => moveExerciseInDay(day.id, item.id, "down")}
                                    className="h-7 w-7 rounded-lg border-border bg-foreground/[0.035] p-0 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => duplicateExerciseInDay(day.id, item)}
                                    className="h-7 w-7 rounded-lg border-border bg-foreground/[0.035] p-0 text-muted-foreground hover:bg-card/10 hover:text-foreground"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => removeExerciseFromDay(day.id, item.id)}
                                    className="h-7 w-7 rounded-lg border-border bg-foreground/[0.035] p-0 text-muted-foreground hover:bg-[#FF5A5F]/10 hover:text-[#FF5A5F]"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>

                              {/* Rest & superset options */}
                              <div className="grid grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase">Rest Time</span>
                                  <Select
                                    value={String(item.restSeconds)}
                                    onValueChange={(value) => updateExerciseField(day.id, item.id, "restSeconds", parseInt(value))}
                                  >
                                    <SelectTrigger className="h-8 rounded-lg border-border bg-foreground/[0.035] px-2 text-[10px] text-foreground focus:ring-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {[30, 45, 60, 90, 120, 180].map((seconds) => (
                                        <SelectItem key={seconds} value={String(seconds)}>
                                          {seconds}s
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-muted-foreground uppercase">Superset Link</span>
                                  <Select
                                    value={extras.supersetGroup || "None"}
                                    onValueChange={(value) => {
                                      const groupVal = value === "None" ? "" : value;
                                      updateExerciseField(day.id, item.id, "prGoal", serializeExtraFields(extras.tags, groupVal));
                                    }}
                                  >
                                    <SelectTrigger className="h-8 rounded-lg border-border bg-foreground/[0.035] px-2 text-[10px] text-foreground focus:ring-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {SUPERSET_GROUPS.map((grp) => (
                                        <SelectItem key={grp} value={grp}>
                                          {grp === "None" ? "No group" : `Group ${grp}`}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Tags selection */}
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase">Exercise Tags</span>
                                <div className="flex flex-wrap gap-1">
                                  {TEMPLATE_TAGS.map((tag) => {
                                    const isTagged = extras.tags.includes(tag);
                                    return (
                                      <Button
                                        type="button"
                                        key={tag}
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                          const nextTags = isTagged 
                                            ? extras.tags.filter((t: string) => t !== tag)
                                            : [...extras.tags, tag];
                                          updateExerciseField(day.id, item.id, "prGoal", serializeExtraFields(nextTags, extras.supersetGroup));
                                        }}
                                        className={cn(
                                          "h-6 rounded-lg px-2 py-0 text-[8px] font-bold transition-all",
                                          isTagged
                                            ? "bg-card/10 text-foreground border-border"
                                            : "bg-foreground/[0.035] text-muted-foreground border-border"
                                        )}
                                      >
                                        {tag}
                                      </Button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Exercise notes */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-muted-foreground uppercase">Instructions / Notes</span>
                                <Input
                                  value={item.notes}
                                  onChange={(e) => updateExerciseField(day.id, item.id, "notes", e.target.value)}
                                  placeholder="e.g. Focus on deep stretch at bottom of range"
                                  className="h-7 text-[10.5px] rounded bg-foreground/[0.035] border-border text-foreground px-2 focus-visible:ring-0"
                                />
                              </div>

                              {/* Sets Table */}
                              <div className="space-y-1.5 pt-2">
                                <span className="text-[8.5px] font-bold text-muted-foreground uppercase">Set Schema</span>
                                <div className="space-y-1.5">
                                  <div className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 text-[8px] font-black text-muted-foreground uppercase text-center">
                                    <span>Set</span>
                                    <span>Weight (kg)</span>
                                    <span>Reps Target</span>
                                    <span>Actions</span>
                                  </div>
                                  
                                  {setList.map((set, setIdx) => (
                                    <div key={setIdx} className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 items-center text-center">
                                      <span className="text-[10px] font-bold text-muted-foreground">{setIdx + 1}</span>
                                      <Input
                                        type="number"
                                        placeholder="Load"
                                        value={set.weight}
                                        onChange={(e) => handleUpdateTemplateSet(day.id, item.id, setIdx, "weight", e.target.value, item)}
                                        className="h-7 text-center rounded bg-foreground/[0.035] border-border text-[10px] font-bold"
                                      />
                                      <Input
                                        placeholder="Target reps"
                                        value={set.reps}
                                        onChange={(e) => handleUpdateTemplateSet(day.id, item.id, setIdx, "reps", e.target.value, item)}
                                        className="h-7 text-center rounded bg-foreground/[0.035] border-border text-[10px] font-bold"
                                      />
                                      <div className="flex items-center gap-1">
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleDuplicateTemplateSet(day.id, item.id, setIdx, item)}
                                          className="h-7 w-7 rounded-lg border-border bg-foreground/[0.035] p-0 text-muted-foreground hover:bg-foreground/10 hover:text-foreground"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </Button>
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="icon"
                                          onClick={() => handleRemoveTemplateSet(day.id, item.id, setIdx, item)}
                                          disabled={setList.length <= 1}
                                          className="h-7 w-7 rounded-lg border-border bg-foreground/[0.035] p-0 text-muted-foreground hover:bg-[#FF5A5F]/10 hover:text-[#FF5A5F] disabled:opacity-20"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddTemplateSet(day.id, item.id, item)}
                                  className="h-7 w-full text-[9px] font-bold text-foreground/75 hover:bg-card/10 hover:text-foreground rounded mt-1.5 gap-1"
                                >
                                  <Plus className="h-3 w-3" /> Add Set Schema
                                </Button>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground italic">No exercises templates added.</p>
                )}

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setExercisePickerTargetDayId(day.id);
                      setIsExercisePickerOpen(true);
                      setPickerSearchQuery("");
                    }}
                    className="w-full h-8.5 rounded-lg border border-border bg-foreground/[0.035] text-foreground hover:bg-foreground/10 text-xs font-semibold gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add Exercise Template
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action row at bottom */}
        <div className="flex gap-2 sticky bottom-20 bg-[color:var(--background)] py-2 z-30 border-t border-border lg:bottom-0">
          <Button
            onClick={addWorkoutDay}
            variant="outline"
            className="flex-1 rounded-lg h-10.5 text-xs font-bold border-border bg-card"
          >
            <Plus className="h-4 w-4 mr-1" /> Add split day
          </Button>
          <Button
            onClick={handleSavePlan}
            disabled={saving}
            className="flex-1 rounded-lg h-10.5 bg-card hover:bg-card/90 text-foreground text-xs font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save plan template
          </Button>
        </div>

        {/* EXERCISE PICKER DIALOG */}
        <Dialog open={isExercisePickerOpen} onOpenChange={setIsExercisePickerOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-4 border-none bg-card text-foreground">
            <DialogHeader className="pb-3 pr-10 border-b border-border">
              <div>
                <DialogTitle className="text-base font-bold text-foreground">Pick Exercise</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Choose exercise templates to add to split
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="Fuzzy search movement..."
                  className="pl-9 h-9 rounded-lg border-border bg-foreground/[0.035] text-foreground placeholder:text-muted-foreground text-xs font-semibold focus-visible:ring-1 focus-visible:ring-brand"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-1 bg-foreground/[0.035] p-0.5 rounded-lg border border-border">
                {([
                  { id: "all", label: "All Movements" },
                  { id: "favorites", label: "Favorites" },
                  { id: "recent", label: "Recent" },
                ] as const).map((flt) => (
                  <Button
                    key={flt.id}
                    type="button"
                    variant="ghost"
                    onClick={() => setPickerFilter(flt.id)}
                    className={cn(
                      "h-8 rounded-lg px-2 text-[10px] font-bold transition-all hover:bg-foreground/10 hover:text-foreground",
                      pickerFilter === flt.id
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {flt.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredPickerExercises.length > 0 ? (
                  filteredPickerExercises.map((ex) => {
                    const isFavorite = favoriteExerciseIds.includes(ex.id);
                    return (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between p-2.5 bg-foreground/[0.035] hover:bg-foreground/10 rounded-lg border border-border transition-colors"
                      >
                        <div 
                          onClick={() => {
                            if (exercisePickerTargetDayId) {
                              addExerciseToDay(exercisePickerTargetDayId, ex.id);
                              setIsExercisePickerOpen(false);
                            }
                          }}
                          className="flex-1 cursor-pointer"
                        >
                          <h4 className="text-xs font-bold text-foreground">{ex.name}</h4>
                          <span className="text-[9.5px] text-muted-foreground font-semibold mt-0.5 block">
                            {ex.category} • {ex.equipment}
                          </span>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleFavoriteExercise(ex.id)}
                          className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:bg-card/5"
                        >
                          <Star className={cn("h-4 w-4", isFavorite ? "fill-[#FFB547] text-[#FFB547]" : "text-muted-foreground")} />
                        </Button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-[11px] text-muted-foreground italic">No matching movement found.</p>
                    <Button
                      onClick={() => {
                        setNewExerciseName(pickerSearchQuery);
                        setIsCreateExerciseOpen(true);
                      }}
                      className="h-8.5 rounded-lg bg-card hover:bg-card/90 text-foreground text-[10px] font-bold"
                    >
                      Create Custom Exercise
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* CUSTOM EXERCISE CREATION MODAL */}
        <Dialog open={isCreateExerciseOpen} onOpenChange={setIsCreateExerciseOpen}>
          <DialogContent className="max-w-xs rounded-xl p-5 border-none bg-card text-foreground">
            <DialogHeader className="pb-2 border-b border-border">
              <DialogTitle className="text-sm font-bold text-foreground">Create Custom Exercise</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-3.5">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Exercise Name</span>
                <Input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="e.g. Incline DB Press"
                  className="h-8.5 rounded-lg border-border bg-foreground/[0.035] text-foreground px-2.5 text-xs focus-visible:ring-1"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Primary Muscle</span>
                <Select value={newExerciseMuscle} onValueChange={setNewExerciseMuscle}>
                  <SelectTrigger className="h-9 rounded-lg border-border bg-foreground/[0.035] px-2 text-xs text-foreground focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_MUSCLES.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Equipment</span>
                <Select value={newExerciseEquipment} onValueChange={setNewExerciseEquipment}>
                  <SelectTrigger className="h-9 rounded-lg border-border bg-foreground/[0.035] px-2 text-xs text-foreground focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {["Barbell", "Dumbbell", "Machine", "Cable", "Smith", "EZ Bar", "Trap Bar", "Bodyweight", "Other"].map((eq) => (
                      <SelectItem key={eq} value={eq}>{eq}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateExerciseOpen(false)}
                  className="flex-1 rounded-lg text-[10px] font-bold border-border bg-foreground/[0.035]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateCustomExercise}
                  disabled={!newExerciseName.trim()}
                  className="flex-1 rounded-lg bg-card hover:bg-card/90 text-foreground text-[10px] font-bold"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    );
  }

  // ==========================================
  // RENDER INTERFACE 3: MAIN WORKOUT HUB
  // ==========================================
  const totalPlanDays = plans.reduce((acc, plan) => acc + plan.days.length, 0);
  const totalPlanExercises = plans.reduce(
    (acc, plan) => acc + plan.days.reduce((dayAcc, day) => dayAcc + day.items.length, 0),
    0
  );
  const latestSession = sessions[0];
  const templateEntries = plans.flatMap((plan) =>
    plan.days.map((day) => ({
      plan,
      day,
      exerciseCount: day.items.length,
    }))
  );
  const startDialogTemplateEntries = startDialogPlanId
    ? templateEntries.filter((entry) => entry.plan.id === startDialogPlanId)
    : templateEntries;
  const mobileTemplateLimit = 4;
  const desktopTemplateLimit = 8;

  return (
      <div className="mx-auto max-w-5xl pb-14 space-y-3 md:space-y-5">
      
      <Card className="rounded-xl p-3 sm:rounded-2xl sm:p-5">
        <div className="flex items-center justify-between gap-3 md:items-end">
          <div className="min-w-0 space-y-1">
            <div className="hidden items-center gap-2 text-foreground/70 sm:flex">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-foreground/5">
                <Dumbbell className="h-3.5 w-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider">Training hub</span>
            </div>
            <h1 className="truncate text-base font-semibold tracking-tight text-foreground sm:text-2xl">Training</h1>
            <p className="hidden max-w-xl text-xs font-medium leading-relaxed text-muted-foreground md:block">
              Build reusable gym plans, start today&apos;s session, and keep your logged sets connected to progress.
            </p>
          </div>
          <Button
            onClick={() => {
              const newDraft = blankPlan(data.user.id);
              setPlans((prev) => [newDraft, ...prev]);
              setActiveDraftPlan(newDraft);
              setIsEditingSplit(true);
            }}
            aria-label="New plan"
            className="h-7 shrink-0 rounded-lg px-2.5 text-[11px] font-semibold sm:h-10 sm:rounded-xl sm:px-4 sm:text-xs"
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">New plan</span>
          </Button>
        </div>

        <div className="mt-4 hidden grid-cols-4 gap-x-3 border-t border-border pt-3 sm:grid">
          {[
            { label: "Plans", value: plans.length },
            { label: "Days", value: totalPlanDays },
            { label: "Lifts", value: totalPlanExercises },
            { label: "Logged", value: sessions.length },
          ].map((item) => (
            <div key={item.label} className="min-w-0">
              <p className="truncate text-[8px] font-bold uppercase tracking-wider text-muted-foreground sm:text-[9px]">{item.label}</p>
              <p className="mt-0.5 truncate text-sm font-semibold text-foreground sm:text-base">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Tab switcher: Plans, Session, History */}
        <div className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg border border-border bg-[color:var(--background)] p-1 sm:mt-3 sm:rounded-xl">
          {([
            { id: "plans", label: "Plans", icon: ClipboardList },
            { id: "session", label: "Session", icon: Play },
            { id: "history", label: "History", icon: History },
          ] as const).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <Button
                type="button"
                variant="ghost"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "h-7 rounded-md px-2 text-[10px] font-medium transition-all select-none hover:bg-card/5 hover:text-foreground sm:h-9 sm:rounded-lg sm:text-xs",
                  isActive 
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-card/5"
                )}
              >
                <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>{tab.label}</span>
              </Button>
            );
          })}
        </div>
      </Card>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: PLANS MANAGEMENT */}
        {activeTab === "plans" && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <div className="grid gap-2.5 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[1fr_auto]">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plans..."
                  className="h-9 rounded-xl border-border bg-card pl-9 text-xs font-medium text-foreground placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-brand"
                />
              </div>
              <div className="grid grid-cols-3 gap-1 rounded-xl bg-[color:var(--background)] p-1">
                {([
                  ["edited", "Recent"],
                  ["alphabetical", "A-Z"],
                  ["exercises", "Volume"],
                ] as const).map(([value, label]) => (
                  <Button
                    key={value}
                    type="button"
                    variant="ghost"
                    onClick={() => setSortBy(value)}
                    className={cn(
                      "h-8 rounded-lg px-3 text-[10px] font-bold transition hover:bg-card/5 hover:text-foreground",
                      sortBy === value ? "bg-card text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Create new plan button */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Manage plans ({filteredPlans.length})
              </span>
              <Button
                onClick={() => {
                  const newDraft = blankPlan(data.user.id);
                  setPlans((prev) => [newDraft, ...prev]);
                  setActiveDraftPlan(newDraft);
                  setIsEditingSplit(true);
                }}
                size="sm"
                className="h-8 rounded-lg px-3 text-[10px] font-semibold"
              >
                <Plus className="h-3.5 w-3.5" /> Create
              </Button>
            </div>

            {filteredPlans.length > 0 ? (
              <div className="grid gap-3 md:grid-cols-2">
                {filteredPlans.map((plan) => {
                  const daysCount = plan.days.length;
                  const totalExercises = plan.days.reduce((acc: number, d: WeeklyPlanDay) => acc + d.items.length, 0);
                  const isDraft = isDraftPlan(plan);

                  return (
                    <ContextActionMenu
                      key={plan.id}
                      actions={[
                        {
                          label: "Review",
                          icon: <ClipboardList className="h-3.5 w-3.5" />,
                          onSelect: () => setViewingPlan(plan),
                        },
                        {
                          label: "Edit",
                          icon: <Edit3 className="h-3.5 w-3.5" />,
                          onSelect: () => {
                            setActiveDraftPlan(plan);
                            setIsEditingSplit(true);
                          },
                        },
                        {
                          label: "Duplicate",
                          icon: <Copy className="h-3.5 w-3.5" />,
                          onSelect: () => handleDuplicatePlan(plan),
                        },
                        {
                          label: "Remove",
                          icon: <Trash2 className="h-3.5 w-3.5" />,
                          destructive: true,
                          onSelect: () => setDeletingPlanId(plan.id),
                        },
                      ]}
                    >
                      <Card className="flex flex-col justify-between rounded-2xl border border-border bg-card p-3.5 pr-12 shadow-[0_12px_42px_rgba(0,0,0,0.1)] sm:p-4 sm:pr-12">
                        <div>
                        <div className="flex justify-between items-start">
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <h3 className="truncate text-sm font-semibold text-foreground">{plan.name}</h3>
                              {isDraft && (
                                <Badge className="bg-[#FFB547]/10 text-[#FFB547] text-[8px] font-bold px-1.5 py-0.25 border-none">
                                  DRAFT
                                </Badge>
                              )}
                            </div>
                              <p className="hidden text-[11px] text-muted-foreground mt-1 line-clamp-1 sm:block">
                                {plan.notes || "No description."}
                              </p>
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-medium text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground/60" />
                            {daysCount} {daysCount === 1 ? "day" : "days"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5 text-muted-foreground/60" />
                            {totalExercises} lifts
                          </span>
                          <span>{Math.round(totalExercises / Math.max(daysCount, 1))} / day</span>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingPlan(plan)}
                          className="h-10 rounded-xl text-[10px] font-bold"
                        >
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveDraftPlan(plan);
                            setIsEditingSplit(true);
                          }}
                          className="h-10 rounded-xl text-[10px] font-bold"
                        >
                          <Edit3 className="h-3 w-3 mr-1" /> Edit
                        </Button>
                      </div>
                      </Card>
                    </ContextActionMenu>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border border-dashed border-border bg-card rounded-xl">
                <ClipboardList className="h-8 w-8 text-muted-foreground/50 mx-auto stroke-[1.5]" />
                <h3 className="text-xs font-bold text-foreground mt-3">No workout plans yet.</h3>
                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-1">
                  Click Create Plan to configure templates and log sessions with minimum swipes.
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {/* VIEW 2: ACTIVE SESSION HOME */}
        {activeTab === "session" && (
          <motion.div
            key="session"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {draftSession ? (
              <Card
                onClick={() => setIsWorkoutLoggerOpen(true)}
                className="cursor-pointer rounded-xl border border-border bg-card p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all hover:border-border-strong group sm:rounded-2xl sm:p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/5 text-foreground sm:h-8 sm:w-8">
                      <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="truncate text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                        Resume Workout
                      </CardTitle>
                      <CardDescription className="hidden truncate text-xs text-muted-foreground mt-0.5 sm:block">
                        {draftSession.title || "Active session"} is still in progress.
                      </CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="h-4.5 w-4.5 shrink-0 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Card>
            ) : null}

            <Card
              onClick={() => openStartWorkoutDialog()}
              className="cursor-pointer rounded-xl border border-border bg-card p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-all hover:border-border group sm:rounded-2xl sm:p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-7 w-7 rounded-lg bg-foreground/5 text-foreground flex items-center justify-center shrink-0 sm:h-8 sm:w-8">
                    <Play className="h-3.5 w-3.5 fill-current ml-0.5 sm:h-4 sm:w-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-semibold tracking-tight text-foreground sm:text-sm">
                      Start Workout
                    </CardTitle>
                      <CardDescription className="hidden text-xs text-muted-foreground mt-0.5 sm:block">
                        Log a fast session without template constraints.
                      </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>

            {latestSession ? (
              <div className="hidden rounded-2xl border border-border bg-card p-3.5 sm:block">
                <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Last workout</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{latestSession.title}</p>
                    <p className="mt-1 text-[10px] font-semibold text-muted-foreground">
                      {latestSession.items.length} exercises • {new Date(latestSession.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setViewingSession(latestSession);
                      setActiveTab("history");
                    }}
                    className="h-8 rounded-lg text-[10px] font-semibold"
                  >
                    View
                  </Button>
                </div>
              </div>
            ) : null}

            <div className="space-y-2.5 sm:space-y-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
                Templates
              </span>

              {templateEntries.length > 0 ? (
                <div className="max-h-[430px] overflow-y-auto pr-0.5 grid gap-2.5 md:grid-cols-2">
                  {templateEntries.map(({ plan, day, exerciseCount }, index) => {
                      const isDraft = isDraftPlan(plan);
                      return (
                        <Button
                          type="button"
                          variant="ghost"
                          key={`${plan.id}-${day.id}`}
                          onClick={() => startWorkoutFromDay(day, plan)}
                          className={cn(
                            "group h-auto min-h-12 w-full justify-between rounded-xl border border-border bg-card p-2 text-left transition-all hover:border-border hover:bg-card sm:min-h-0 sm:rounded-2xl sm:p-4",
                            index >= mobileTemplateLimit && "hidden sm:flex",
                            index >= desktopTemplateLimit && "sm:hidden"
                          )}
                        >
                          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                            <div className="h-7 w-7 rounded-lg bg-foreground/5 text-foreground flex items-center justify-center font-bold text-[10px] shrink-0 sm:h-8 sm:w-8 sm:text-xs">
                              {day.title.slice(0, 3)}
                            </div>
                            <div className="min-w-0">
                              <div className="flex min-w-0 items-center gap-1.5">
                                <h3 className="line-clamp-1 text-xs font-semibold text-foreground transition-colors group-hover:text-foreground/75">
                                  {plan.name} • {day.title}
                                </h3>
                                {isDraft ? (
                                  <Badge className="shrink-0 border-none bg-[#FFB547]/10 px-1.5 py-0.25 text-[7.5px] font-bold text-[#FFB547]">
                                    Draft
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="truncate text-[9px] text-muted-foreground mt-0.5 font-semibold sm:text-[9.5px]">
                                {day.focus || "Routine"} • {exerciseCount} exercises
                              </p>
                            </div>
                          </div>
                          <Play className="h-3.5 w-3.5 text-muted-foreground fill-current group-hover:text-foreground transition-colors" />
                        </Button>
                      );
                    })}
                  {templateEntries.length > mobileTemplateLimit ? (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setActiveTab("plans")}
                      className="h-8 rounded-xl border border-border bg-card text-[11px] font-semibold text-muted-foreground hover:bg-foreground/[0.035] hover:text-foreground sm:hidden"
                    >
                      View all templates
                    </Button>
                  ) : null}
                  {templateEntries.length > desktopTemplateLimit ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("plans")}
                      className="hidden h-10 rounded-xl text-[11px] font-semibold sm:flex md:col-span-2"
                    >
                      Manage all {templateEntries.length} templates
                    </Button>
                  ) : null}
                </div>
              ) : (
                <Card className="p-8 text-center border border-dashed border-border bg-card rounded-xl">
                  <Dumbbell className="h-8 w-8 text-muted-foreground/50 mx-auto stroke-[1.5]" />
                  <h3 className="text-xs font-bold text-foreground mt-3">No splits ready</h3>
                  <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-1">
                    Templates created in Plans will appear here to start logging sessions with prefilled weights.
                  </p>
                </Card>
              )}
            </div>
          </motion.div>
        )}

        {/* VIEW 3: HISTORICAL LOGS */}
        {activeTab === "history" && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1 block">
              Workout history
            </span>

            {sessions.length > 0 ? (
              <div className="grid gap-2.5">
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
                      className="flex items-center justify-between p-3.5 bg-card border border-border hover:border-border rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-foreground group-hover:text-foreground/75 transition-colors">
                            {session.title}
                          </h3>
                          {session.effort && (
                            <Badge className="bg-card/10 text-foreground/75 border-none font-bold text-[8px] px-1.5 py-0.25">
                              {session.effort}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] text-muted-foreground font-bold sm:gap-3.5">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-muted-foreground/60" />
                            {dateFormatted}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground/60" />
                            {durationMins} min
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-muted-foreground/60" />
                            {session.items.length} exercises
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border border-dashed border-border bg-card rounded-xl">
                <History className="h-8 w-8 text-muted-foreground/50 mx-auto stroke-[1.5]" />
                <h3 className="text-xs font-bold text-foreground mt-3">No history logs found</h3>
                <p className="text-[10px] text-muted-foreground max-w-xs mx-auto mt-1">
                  Finished logs will populate here to view historic volume metrics and target RPE achievements.
                </p>
              </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* DETAIL MODAL: VIEW PLAN & STIMULUS MAP */}
      <Dialog open={Boolean(viewingPlan)} onOpenChange={(open) => !open && setViewingPlan(null)}>
        {viewingPlan && (
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl p-5 border-none bg-card text-foreground">
            <DialogHeader className="pb-3 pr-10 border-b border-border">
              <div>
                <DialogTitle className="text-base font-bold text-foreground">{viewingPlan.name}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Stimulus audit per muscle group
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {viewingPlan.days.map((day) => (
                <div key={day.id} className="space-y-2">
                  <div className="flex items-center justify-between bg-foreground/[0.035] p-2 rounded-lg">
                    <span className="text-xs font-bold text-foreground">{day.title}</span>
                    <Badge className="bg-card/10 text-foreground/75 text-[8px] font-bold uppercase border-none">
                      {day.focus || "Focus"}
                    </Badge>
                  </div>
                  {day.items.length > 0 ? (
                    <div className="pl-2 space-y-1">
                      {day.items.map((item, idx) => {
                        const exerciseName = data.exercises.find((e) => e.id === item.exerciseId)?.name || item.exerciseId;
                        return (
                          <div key={idx} className="flex justify-between items-center text-[10px] text-muted-foreground">
                            <span className="font-semibold">{exerciseName}</span>
                            <span className="font-bold text-muted-foreground">
                              {item.sets} x {item.reps} sets
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pl-2 text-[9px] text-muted-foreground italic">No exercises added to this day.</p>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-border">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  Stimulus Audit
                </h4>
                <PlanAnalysis plan={viewingPlan} data={data} />
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={isStartWorkoutDialogOpen} onOpenChange={setIsStartWorkoutDialogOpen}>
        <DialogContent className="w-[min(92vw,520px)] max-h-[82vh] overflow-y-auto rounded-2xl border border-border bg-card p-4 text-foreground sm:p-5">
          <DialogHeader className="pr-8">
            <DialogTitle className="text-base font-bold text-foreground">Start workout</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Choose freestyle or start from a saved template with previous weights prefilled.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={startEmptyWorkout}
              className="h-auto w-full justify-between rounded-xl border-border bg-foreground/[0.025] p-3 text-left hover:bg-foreground/[0.05]"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background">
                  <Play className="h-3.5 w-3.5 fill-current" />
                </span>
                <span className="min-w-0">
                  <span className="block text-xs font-bold text-foreground">Freestyle workout</span>
                  <span className="mt-0.5 block text-[10px] font-semibold text-muted-foreground">Start empty and add exercises as you go.</span>
                </span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Button>

            <div className="space-y-2">
              <p className="px-1 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Templates ({startDialogTemplateEntries.length})
              </p>
              {startDialogTemplateEntries.length ? (
                <div className="grid max-h-[46vh] gap-2 overflow-y-auto pr-1">
                  {startDialogTemplateEntries.map(({ plan, day, exerciseCount }) => (
                    <Button
                      key={`${plan.id}-${day.id}-start-dialog`}
                      type="button"
                      variant="ghost"
                      onClick={() => startWorkoutFromDay(day, plan)}
                      className="h-auto justify-between rounded-xl border border-border bg-card p-3 text-left hover:bg-foreground/[0.035]"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-bold text-foreground">{day.title}</span>
                        <span className="mt-0.5 block truncate text-[10px] font-semibold text-muted-foreground">
                          {plan.name} • {exerciseCount} exercises
                        </span>
                      </span>
                      <Play className="h-3.5 w-3.5 shrink-0 fill-current text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No templates available yet.
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* DETAIL MODAL: VIEW COMPLETED WORKOUT */}
      <Dialog open={Boolean(viewingSession)} onOpenChange={(open) => !open && setViewingSession(null)}>
        {viewingSession && (
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-5 border-none bg-card text-foreground">
            <DialogHeader className="pb-3 pr-10 border-b border-border">
              <div>
                <DialogTitle className="text-base font-bold text-foreground">{viewingSession.title}</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Completed on {new Date(viewingSession.startedAt).toLocaleDateString()}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              {viewingSession.effort && (
                <div className="flex items-center gap-2 p-2.5 bg-foreground/[0.035] rounded-lg">
                  <Award className="h-4 w-4 text-foreground/70" />
                  <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-wider">
                    Effort / Feeling: {viewingSession.effort}
                  </span>
                </div>
              )}

              {viewingSession.notes && (
                <div className="p-3 bg-foreground/[0.035] rounded-lg">
                  <h4 className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Notes</h4>
                  <p className="text-[10px] text-muted-foreground mt-1 italic">{viewingSession.notes}</p>
                </div>
              )}

              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-1">
                  Logged Sets
                </h4>
                {viewingSession.items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-foreground/[0.035] border border-border rounded-xl">
                    <h5 className="text-[11px] font-bold text-foreground">{item.exerciseName}</h5>
                    <div className="mt-2 space-y-1">
                      {item.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
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

              <div className="pt-4 border-t border-border flex justify-end">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingSessionId(viewingSession.id)}
                  className="rounded-lg text-xs font-bold text-[#FF5A5F] hover:bg-[#FF5A5F]/10 hover:text-[#FF5A5F]"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" /> Delete Log
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      <ActionDialog
        open={Boolean(draftPlanPrompt)}
        onOpenChange={(open) => !open && setDraftPlanPrompt(null)}
        variant="warning"
        icon={<AlertCircle className="h-5 w-5" />}
        title="Save Plan First"
        description="This plan is still a draft. Save it before starting a workout from this template."
        cancelLabel="Not now"
        actionLabel="Edit draft"
        onAction={() => {
          if (!draftPlanPrompt) return;
          setActiveDraftPlan(draftPlanPrompt);
          setDraftPlanPrompt(null);
          setActiveTab("plans");
          setIsEditingSplit(true);
        }}
      />

      <ActionDialog
        open={Boolean(deletingPlanId)}
        onOpenChange={(open) => !open && setDeletingPlanId(null)}
        variant="danger"
        icon={<AlertCircle className="h-5 w-5" />}
        title="Delete Workout Split?"
        description="This action cannot be undone. Any custom configurations will be deleted."
        actionLabel="Yes, Delete"
        actionBusyLabel="Deleting..."
        busy={saving}
        onAction={() => deletingPlanId && handleDeletePlan(deletingPlanId)}
      />

      <ActionDialog
        open={Boolean(deletingSessionId)}
        onOpenChange={(open) => !open && setDeletingSessionId(null)}
        variant="danger"
        icon={<AlertCircle className="h-5 w-5" />}
        title="Delete Workout Log?"
        description="This will permanently delete this logged workout session."
        actionLabel="Yes, Delete"
        actionBusyLabel="Deleting..."
        busy={saving}
        onAction={() => deletingSessionId && handleDeleteSession(deletingSessionId)}
      />

    </div>
  );
}
