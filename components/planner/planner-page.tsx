"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { 
  Plus, Trash2, Loader2, Dumbbell, Sparkles, Clock, Target, 
  CalendarDays, Play, ChevronRight, CheckCircle2, History,
  Award, Calendar, AlertCircle, Info, X, Edit3, ClipboardList,
  Save, ArrowLeft, RotateCcw, Volume2, VolumeX, Timer, Check, Minus, PlusCircle,
  Pause, Search, Copy, Star, ChevronDown, ChevronUp
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Exercise, WeeklyPlan, WeeklyPlanDay, WeeklyPlanItem, WorkoutSession, WorkoutSessionItem, WorkoutSet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

const TEMPLATE_TAGS = [
  "Warmup", "Dropset", "Failure", "Tempo", "Paused", "AMRAP", "Unilateral"
];

const SUPERSET_GROUPS = ["None", "A", "B", "C", "D", "E", "F"];

const SUPERSET_COLORS: Record<string, string> = {
  A: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  B: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  C: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  D: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  E: "bg-teal-500/20 text-teal-400 border-teal-500/30",
  F: "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
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
  } catch (e) {
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
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
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

  // States for active operations
  const [isEditingSplit, setIsEditingSplit] = useState(false);
  const [activeDraftPlan, setActiveDraftPlan] = useState<WeeklyPlan | null>(null);
  
  // Active Workout session logger states
  const [draftSession, setDraftSession] = useState<Partial<WorkoutSession> | null>(null);
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
          category: newExerciseMuscle as any,
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
  };

  const startWorkoutFromDay = (day: WeeklyPlanDay, plan: WeeklyPlan) => {
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
        return {
          id: item.id,
          exerciseId: item.exerciseId,
          exerciseName: exercises.find((e) => e.id === item.exerciseId)?.name || item.exerciseId,
          plannedSets: item.sets,
          reps: item.reps,
          restSeconds: item.restSeconds,
          targetLoad: item.targetLoad,
          targetRpe: item.targetRpe,
          sets: setList.map((s) => ({
            weight: s.weight,
            reps: s.reps,
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

  const handleSaveWorkoutSession = async () => {
    if (!draftSession) return;
    setSaving(true);
    try {
      const isEdit = Boolean(draftSession.id && isPersistedId(draftSession.id));
      
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
      localStorage.removeItem("kratos_active_session");
      localStorage.removeItem("kratos_completed_sets");
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
      } catch (_) {}
    }
    
    const saved = localStorage.getItem("kratos_active_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDraftSession(parsed);
        setActiveTab("session");
      } catch (e) {
        console.warn("Could not restore active session", e);
      }
    }

    const savedCompleted = localStorage.getItem("kratos_completed_sets");
    if (savedCompleted) {
      try {
        setCompletedSets(JSON.parse(savedCompleted));
      } catch (_) {}
    }
  }, [data.plans, data.sessions, data.exercises]);

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
      <div className="flex h-[50vh] items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F8CFF]" />
      </div>
    );
  }

  // ==========================================
  // RENDER INTERFACE 1: ACTIVE WORKOUT LOGGER
  // ==========================================
  if (draftSession) {
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

    return (
      <div className="mx-auto max-w-xl pb-32 space-y-5 bg-[#0D0D0D] text-white">
        
        {/* Sticky top timer bar */}
        <div className="sticky top-[52px] lg:top-0 z-30 -mx-4 px-4 py-3 bg-[#181818]/90 backdrop-blur-md border-b border-[#2B2B2B] flex items-center justify-between">
          <div>
            <h1 className="text-[10px] font-bold uppercase tracking-widest text-[#AAAAAA]">
              ACTIVE WORKOUT
            </h1>
            <p className="text-xs text-white font-bold truncate max-w-[200px] mt-0.5">
              {draftSession.title}
            </p>
          </div>
          
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-[#1F1F1F] rounded-lg border border-[#2B2B2B]">
              <Clock className="h-3.5 w-3.5 text-[#AAAAAA]" />
              <span className="text-xs font-black font-mono tracking-tight text-white">
                {formatTime(elapsedTime)}
              </span>
            </div>

            <Button
              onClick={() => setIsFinishingWorkout(true)}
              className="h-8 rounded-lg bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white font-bold text-[10px] px-3.5"
            >
              Finish
            </Button>
          </div>
        </div>

        {/* Progress details */}
        <div className="flex justify-between items-center px-1">
          <span className="text-[9px] font-black text-[#AAAAAA] uppercase tracking-wider">
            Done: {totalCompletedSets} / {totalPlannedSets} Sets
          </span>
          <button
            onClick={() => {
              if (confirm("Discard active workout? This cannot be undone.")) {
                setDraftSession(null);
                setRestSecondsLeft(null);
                setCompletedSets({});
                localStorage.removeItem("kratos_active_session");
                localStorage.removeItem("kratos_completed_sets");
              }
            }}
            className="text-[10px] font-bold text-[#FF5A5F] hover:text-[#FF5A5F]/90"
          >
            Discard Session
          </button>
        </div>

        {/* Exercises list with set tracking */}
        <div className="space-y-4">
          {(draftSession.items || []).map((item, itemIdx) => {
            const isExpanded = loggerExpandedExercises[item.id] ?? false;
            
            const pr = getExercisePR(item.exerciseId);
            const prevPerf = getPreviousSessionPerformance(item.exerciseId);
            const extras = deserializeExtraFields(item.targetRpe);
            const isFavorite = favoriteExerciseIds.includes(item.exerciseId);

            return (
              <Card key={item.id} className="p-4 border border-[#2B2B2B] bg-[#181818] rounded-xl space-y-3.5">
                
                <div 
                  onClick={() => setLoggerExpandedExercises((prev) => ({ ...prev, [item.id]: !isExpanded }))}
                  className="flex justify-between items-start cursor-pointer group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs font-bold text-white group-hover:text-[#4F8CFF] transition-colors">
                        {item.exerciseName}
                      </h3>
                      {isFavorite && <Star className="h-3 w-3 fill-[#FFB547] text-[#FFB547]" />}
                    </div>
                    
                    {!isExpanded && (
                      <p className="text-[9.5px] text-[#AAAAAA] font-bold">
                        {item.sets.length} sets • PR: {pr ? `${pr.weight} kg x ${pr.reps}` : "None"}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {extras.supersetGroup && (
                      <Badge className={cn("text-[7.5px] font-black border uppercase px-1.5 py-0.25", SUPERSET_COLORS[extras.supersetGroup] || "bg-[#2B2B2B]")}>
                        SS {extras.supersetGroup}
                      </Badge>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-3.5 w-3.5 text-[#AAAAAA]" />
                    ) : (
                      <ChevronDown className="h-3.5 w-3.5 text-[#AAAAAA]" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="space-y-3.5 pt-1.5">
                    
                    {/* Previous/Best records panel */}
                    <div className="grid grid-cols-2 gap-3 text-[10px] bg-[#1F1F1F] p-2.5 rounded-lg border border-[#2B2B2B]">
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold uppercase text-[#AAAAAA]">Personal Record</span>
                        <p className="font-bold text-white">
                          {pr ? `${pr.weight} kg x ${pr.reps}` : "No logged record"}
                        </p>
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-[8px] font-bold uppercase text-[#AAAAAA]">
                          Last Session {prevPerf ? `(${prevPerf.date})` : ""}
                        </span>
                        <p className="font-bold text-white truncate">
                          {prevPerf 
                            ? prevPerf.sets.map((s) => `${s.weight}x${s.reps}`).join(", ")
                            : "No logged history"}
                        </p>
                      </div>
                    </div>

                    {/* Sets Logger Table */}
                    <div className="space-y-2">
                      <div className="grid grid-cols-[30px_1fr_1fr_42px] gap-2.5 text-[8.5px] font-bold text-[#AAAAAA] uppercase tracking-wider text-center">
                        <span>Set</span>
                        <span>Weight kg</span>
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
                              "grid grid-cols-[30px_1fr_1fr_42px] gap-2.5 items-center text-center p-1 rounded-lg border transition-all",
                              isDone 
                                ? "bg-[#34C759]/5 text-[#34C759] border-[#34C759]/20" 
                                : "bg-[#1F1F1F]/40 border-transparent"
                            )}
                          >
                            <span className="text-[10px] font-black">{setIdx + 1}</span>
                            
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder={prevSet?.weight || "0"}
                              value={set.weight}
                              onChange={(e) => handleUpdateActiveSetField(itemIdx, setIdx, "weight", e.target.value)}
                              className="h-7.5 text-center text-[10.5px] font-bold rounded-lg border border-[#2B2B2B] bg-[#1F1F1F] text-white focus-visible:ring-0 focus-visible:bg-[#2B2B2B]"
                            />
                            
                            <Input
                              type="number"
                              inputMode="numeric"
                              placeholder={prevSet?.reps || "8"}
                              value={set.reps}
                              onChange={(e) => handleUpdateActiveSetField(itemIdx, setIdx, "reps", e.target.value)}
                              className="h-7.5 text-center text-[10.5px] font-bold rounded-lg border border-[#2B2B2B] bg-[#1F1F1F] text-white focus-visible:ring-0 focus-visible:bg-[#2B2B2B]"
                            />

                            <button
                              onClick={() => handleToggleSetComplete(itemIdx, setIdx)}
                              className={cn(
                                "h-7 w-7 rounded-full flex items-center justify-center border mx-auto transition-all active:scale-90",
                                isDone
                                  ? "bg-[#34C759] border-[#34C759] text-white"
                                  : "border-[#2B2B2B] text-transparent hover:border-[#AAAAAA]"
                              )}
                            >
                              <Check className="h-3.5 w-3.5 stroke-[3.5]" />
                            </button>
                            
                            {isDone && isNewPR && (
                              <span className="col-span-4 text-[8px] font-extrabold text-[#FFB547] bg-[#FFB547]/10 py-0.5 rounded uppercase tracking-wider block text-left px-2">
                                ★ NEW PERSONAL RECORD
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
                        className="h-7 rounded-lg text-[9px] font-bold text-[#AAAAAA] hover:text-white hover:bg-white/5 gap-1"
                      >
                        <Minus className="h-3 w-3" /> Remove Set
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleAddSetActiveSession(itemIdx)}
                        className="h-7 rounded-lg text-[9px] font-bold text-[#4F8CFF] hover:bg-[#4F8CFF]/10 gap-1"
                      >
                        <Plus className="h-3 w-3" /> Add Set
                      </Button>
                    </div>

                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <Card className="p-4 border border-[#2B2B2B] bg-[#181818] rounded-xl space-y-3">
          <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider block">
            Add ad-hoc exercise
          </span>
          <Button
            onClick={() => {
              setExercisePickerTargetDayId(null);
              setIsExercisePickerOpen(true);
              setPickerSearchQuery("");
            }}
            className="w-full h-8.5 rounded-lg border border-[#2B2B2B] bg-[#1F1F1F] text-white hover:bg-[#2B2B2B] text-xs font-semibold gap-1"
          >
            <Plus className="h-4 w-4" /> Add Exercise
          </Button>
        </Card>

        {/* FLOATING REST TIMER PILL WIDGET */}
        <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-2">
          {restSecondsLeft !== null ? (
            <motion.div
              layoutId="restTimerWidget"
              className="bg-[#181818] border border-[#2B2B2B] text-white p-3 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] flex items-center gap-3 select-none"
            >
              <div 
                onClick={() => setIsRestTimerExpanded(!isRestTimerExpanded)}
                className="flex flex-col items-center cursor-pointer min-w-[40px]"
              >
                <span className="text-[7.5px] font-bold uppercase text-[#AAAAAA] tracking-wider">Rest</span>
                <span className="text-sm font-black font-mono mt-0.5 leading-none">
                  {restSecondsLeft}s
                </span>
              </div>
              
              <div className="h-6 w-px bg-[#2B2B2B]" />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setRestTimerIsPaused(!restTimerIsPaused)}
                  className="p-1 rounded-lg hover:bg-white/5 text-white transition-colors"
                >
                  {restTimerIsPaused ? (
                    <Play className="h-3.5 w-3.5 fill-current text-[#4F8CFF]" />
                  ) : (
                    <Pause className="h-3.5 w-3.5 fill-current text-white" />
                  )}
                </button>
                <button
                  onClick={() => setRestSecondsLeft(restTimerDuration)}
                  className="p-1 rounded-lg hover:bg-white/5 text-[#AAAAAA] hover:text-white transition-colors"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setRestSecondsLeft((prev) => (prev ? prev + 15 : 15))}
                  className="px-1.5 py-0.5 bg-[#2B2B2B] hover:bg-[#2B2B2B]/80 rounded text-[8px] font-bold text-white transition-colors"
                >
                  +15s
                </button>
                <button
                  onClick={() => setRestSecondsLeft((prev) => (prev && prev > 15 ? prev - 15 : 1))}
                  className="px-1.5 py-0.5 bg-[#2B2B2B] hover:bg-[#2B2B2B]/80 rounded text-[8px] font-bold text-white transition-colors"
                >
                  -15s
                </button>
                <button
                  onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                  className="p-1 rounded-lg hover:bg-white/5 text-[#AAAAAA] hover:text-white transition-colors"
                >
                  {isAudioEnabled ? <Volume2 className="h-3.5 w-3.5 text-[#34C759]" /> : <VolumeX className="h-3.5 w-3.5 text-[#FF5A5F]" />}
                </button>
                <button
                  onClick={() => setRestSecondsLeft(null)}
                  className="p-1 rounded-lg hover:bg-[#FF5A5F]/10 text-[#FF5A5F] hover:text-[#FF5A5F] transition-colors"
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
              className="h-10 w-10 bg-[#4F8CFF] text-white hover:bg-[#4F8CFF]/90 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-all"
            >
              <Timer className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* FINISH WORKOUT SUMMARY MODAL */}
        <Dialog open={isFinishingWorkout} onOpenChange={setIsFinishingWorkout}>
          <DialogContent className="max-w-md rounded-2xl p-5 border-none bg-[#181818] text-white">
            <DialogHeader className="pb-3 border-b border-[#2B2B2B] flex flex-row items-start justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-white">Finish Workout</DialogTitle>
                <DialogDescription className="text-xs text-[#AAAAAA] mt-1">
                  Rate fatigue and save historic session log
                </DialogDescription>
              </div>
              <button 
                onClick={() => setIsFinishingWorkout(false)}
                className="p-1 rounded-full text-[#AAAAAA] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              <div className="grid grid-cols-2 gap-3 p-3 bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl text-center">
                <div>
                  <span className="text-[8px] font-bold text-[#AAAAAA] uppercase block">Duration</span>
                  <span className="text-xs font-black text-white font-mono">{formatTime(elapsedTime)}</span>
                </div>
                <div>
                  <span className="text-[8px] font-bold text-[#AAAAAA] uppercase block">Sets Logged</span>
                  <span className="text-xs font-black text-white font-mono">{totalCompletedSets} Sets</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider px-0.5">
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
                            ? "bg-[#4F8CFF] border-[#4F8CFF] text-white"
                            : "bg-[#1F1F1F]/40 border-[#2B2B2B] text-[#AAAAAA] hover:bg-[#2B2B2B]"
                        )}
                      >
                        <span className="text-base">{opt.emoji}</span>
                        <span className="text-[8px] font-bold mt-1 block truncate w-full text-center">
                          {opt.value}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider px-0.5">
                  Session Notes
                </span>
                <Textarea
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Notes about specific weights, minor fatigue levels..."
                  rows={2}
                  className="rounded-xl border border-[#2B2B2B] bg-[#1F1F1F] p-3 text-xs font-medium focus-visible:ring-0 resize-none text-white placeholder-[#AAAAAA]"
                />
              </div>

              <Button
                onClick={handleSaveWorkoutSession}
                disabled={saving}
                className="w-full rounded-xl h-11 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-xs font-bold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1.5" />}
                Log workout session
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* EXERCISE PICKER DIALOG */}
        <Dialog open={isExercisePickerOpen} onOpenChange={setIsExercisePickerOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-4 border-none bg-[#181818] text-white">
            <DialogHeader className="pb-3 border-b border-[#2B2B2B] flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-white">Add Exercise</DialogTitle>
                <DialogDescription className="text-xs text-[#AAAAAA] mt-1">
                  Search catalog for ad-hoc additions
                </DialogDescription>
              </div>
              <button 
                onClick={() => setIsExercisePickerOpen(false)}
                className="p-1 rounded-full text-[#AAAAAA] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#AAAAAA]" />
                <Input
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="Fuzzy search movement..."
                  className="pl-9 h-9 rounded-lg border-[#2B2B2B] bg-[#1F1F1F] text-white placeholder-[#AAAAAA] text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[#4F8CFF]"
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
                    className="p-2.5 bg-[#1F1F1F] hover:bg-[#2B2B2B]/40 rounded-lg border border-[#2B2B2B]/60 cursor-pointer transition-colors"
                  >
                    <h4 className="text-xs font-bold text-white">{ex.name}</h4>
                    <span className="text-[9.5px] text-[#AAAAAA] font-semibold mt-0.5 block">
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
      <div className="mx-auto max-w-xl pb-16 space-y-5 bg-[#0D0D0D] text-white">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsEditingSplit(false);
              setActiveDraftPlan(null);
            }}
            className="rounded-lg px-2 text-[#AAAAAA] hover:text-white"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">Edit Plan Template</h1>
            <p className="text-[10px] text-[#AAAAAA]">Configure targets and set schema</p>
          </div>
        </div>

        {/* Global info cards */}
        <Card className="p-4 border border-[#2B2B2B] bg-[#181818] rounded-xl space-y-3.5">
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Plan Name</span>
            <Input
              value={activeDraftPlan.name}
              maxLength={100}
              onChange={(e) => updateDraftPlanName(e.target.value)}
              placeholder="e.g. Upper Body Hypertrophy"
              className="h-9 rounded-lg border-[#2B2B2B] bg-[#1F1F1F] text-white px-3 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[#4F8CFF]"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Description</span>
            <Textarea
              value={activeDraftPlan.notes}
              maxLength={500}
              onChange={(e) => updateDraftPlanNotes(e.target.value)}
              placeholder="Primary hypertrophy targets, tempos..."
              rows={2}
              className="rounded-lg border-[#2B2B2B] bg-[#1F1F1F] text-white p-3 text-xs font-medium focus-visible:ring-0 focus-visible:ring-[#4F8CFF] resize-none"
            />
          </div>
        </Card>

        {/* Days List */}
        <div className="space-y-4">
          {activeDraftPlan.days.map((day, dayIndex) => (
            <Card key={day.id} className="p-4 border border-[#2B2B2B] bg-[#181818] rounded-xl space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-[#2B2B2B]">
                <div className="flex items-center gap-2">
                  <span className="h-5 w-5 bg-[#1F1F1F] border border-[#2B2B2B] text-white rounded flex items-center justify-center text-[10px] font-black">
                    {dayIndex + 1}
                  </span>
                  <Input
                    value={day.title}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, title: e.target.value }))}
                    className="h-7 w-32 border-none bg-transparent font-bold text-xs p-0 focus-visible:ring-0 focus-visible:ring-[#4F8CFF]"
                  />
                </div>
                
                <button
                  onClick={() => removeWorkoutDay(day.id)}
                  disabled={activeDraftPlan.days.length <= 1}
                  className="p-1 text-[#AAAAAA] hover:text-[#FF5A5F] disabled:opacity-30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Day settings grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Focus Area</span>
                  <Input
                    value={day.focus}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, focus: e.target.value }))}
                    placeholder="e.g. Chest & Shoulders"
                    className="h-8 rounded-lg border-[#2B2B2B] bg-[#1F1F1F] px-2.5 text-[11px] font-semibold focus-visible:ring-0"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Warmup description</span>
                  <Input
                    value={day.warmup}
                    onChange={(e) => updateDraftDay(day.id, (d) => ({ ...d, warmup: e.target.value }))}
                    placeholder="Incline walks, bands..."
                    className="h-8 rounded-lg border-[#2B2B2B] bg-[#1F1F1F] px-2.5 text-[11px] font-medium focus-visible:ring-0"
                  />
                </div>
              </div>

              {/* Target muscles list toggles */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Target Muscles</span>
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
                            ? "bg-[#4F8CFF]/15 text-[#4F8CFF] border-[#4F8CFF]/20"
                            : "bg-[#1F1F1F] text-[#AAAAAA] border-[#2B2B2B] hover:text-white"
                        )}
                      >
                        {muscle}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Exercises within the day */}
              <div className="space-y-3 pt-3 border-t border-[#2B2B2B]">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Exercise templates</span>
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
                        <div key={item.id} className="border border-[#2B2B2B] bg-[#1F1F1F] rounded-xl overflow-hidden">
                          
                          {/* COLLAPSED HEADER */}
                          <div 
                            onClick={() => setExpandedExerciseId(isExpanded ? null : item.id)}
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-[#2B2B2B]/20 transition-colors"
                          >
                            <div className="flex items-center gap-2">
                              {extras.supersetGroup && (
                                <Badge className={cn("text-[8px] font-extrabold px-1 border", SUPERSET_COLORS[extras.supersetGroup] || "bg-[#2B2B2B]")}>
                                  SS {extras.supersetGroup}
                                </Badge>
                              )}
                              <span className="text-xs font-bold text-white leading-none">{exerciseName}</span>
                              {isFavorite && <Star className="h-3 w-3 fill-[#FFB547] text-[#FFB547] shrink-0" />}
                            </div>
                            
                            <div className="flex items-center gap-3">
                              <span className="text-[10px] font-bold text-[#AAAAAA]">
                                {item.sets} {item.sets === 1 ? "set" : "sets"} • {item.restSeconds}s rest
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-3.5 w-3.5 text-[#AAAAAA]" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5 text-[#AAAAAA]" />
                              )}
                            </div>
                          </div>

                          {/* EXPANDED DETAILS */}
                          {isExpanded && (
                            <div className="p-3 border-t border-[#2B2B2B] space-y-3.5 bg-[#181818]">
                              
                              {/* Exercise actions */}
                              <div className="flex justify-between items-center pb-2 border-b border-[#2B2B2B]">
                                <span className="text-[9.5px] font-bold text-[#AAAAAA]">
                                  Muscle: {exercise?.category || "Other"} • {exercise?.equipment || "Barbell"}
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => moveExerciseInDay(day.id, item.id, "up")}
                                    className="p-1 text-[#AAAAAA] hover:text-white bg-[#1F1F1F] rounded border border-[#2B2B2B]"
                                  >
                                    <ChevronUp className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => moveExerciseInDay(day.id, item.id, "down")}
                                    className="p-1 text-[#AAAAAA] hover:text-white bg-[#1F1F1F] rounded border border-[#2B2B2B]"
                                  >
                                    <ChevronDown className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => duplicateExerciseInDay(day.id, item)}
                                    className="p-1 text-[#AAAAAA] hover:text-[#4F8CFF] bg-[#1F1F1F] rounded border border-[#2B2B2B]"
                                  >
                                    <Copy className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => removeExerciseFromDay(day.id, item.id)}
                                    className="p-1 text-[#AAAAAA] hover:text-[#FF5A5F] bg-[#1F1F1F] rounded border border-[#2B2B2B]"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Rest & superset options */}
                              <div className="grid grid-cols-2 gap-3.5">
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-[#AAAAAA] uppercase">Rest Time</span>
                                  <select
                                    value={item.restSeconds}
                                    onChange={(e) => updateExerciseField(day.id, item.id, "restSeconds", parseInt(e.target.value))}
                                    className="w-full h-7 text-[10px] rounded bg-[#1F1F1F] border border-[#2B2B2B] text-white px-1 outline-none"
                                  >
                                    <option value={30}>30s</option>
                                    <option value={45}>45s</option>
                                    <option value={60}>60s</option>
                                    <option value={90}>90s</option>
                                    <option value={120}>120s</option>
                                    <option value={180}>180s</option>
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-[8px] font-bold text-[#AAAAAA] uppercase">Superset Link</span>
                                  <select
                                    value={extras.supersetGroup || "None"}
                                    onChange={(e) => {
                                      const groupVal = e.target.value === "None" ? "" : e.target.value;
                                      updateExerciseField(day.id, item.id, "prGoal", serializeExtraFields(extras.tags, groupVal));
                                    }}
                                    className="w-full h-7 text-[10px] rounded bg-[#1F1F1F] border border-[#2B2B2B] text-white px-1 outline-none"
                                  >
                                    {SUPERSET_GROUPS.map((grp) => (
                                      <option key={grp} value={grp}>{grp === "None" ? "No group" : `Group ${grp}`}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              {/* Tags selection */}
                              <div className="space-y-1.5">
                                <span className="text-[8px] font-bold text-[#AAAAAA] uppercase">Exercise Tags</span>
                                <div className="flex flex-wrap gap-1">
                                  {TEMPLATE_TAGS.map((tag) => {
                                    const isTagged = extras.tags.includes(tag);
                                    return (
                                      <button
                                        type="button"
                                        key={tag}
                                        onClick={() => {
                                          const nextTags = isTagged 
                                            ? extras.tags.filter((t: string) => t !== tag)
                                            : [...extras.tags, tag];
                                          updateExerciseField(day.id, item.id, "prGoal", serializeExtraFields(nextTags, extras.supersetGroup));
                                        }}
                                        className={cn(
                                          "px-2 py-0.5 rounded text-[8px] font-bold transition-all border",
                                          isTagged
                                            ? "bg-[#4F8CFF]/15 text-[#4F8CFF] border-[#4F8CFF]/20"
                                            : "bg-[#1F1F1F] text-[#AAAAAA] border-[#2B2B2B]"
                                        )}
                                      >
                                        {tag}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Exercise notes */}
                              <div className="space-y-1">
                                <span className="text-[8px] font-bold text-[#AAAAAA] uppercase">Instructions / Notes</span>
                                <Input
                                  value={item.notes}
                                  onChange={(e) => updateExerciseField(day.id, item.id, "notes", e.target.value)}
                                  placeholder="e.g. Focus on deep stretch at bottom of range"
                                  className="h-7 text-[10.5px] rounded bg-[#1F1F1F] border-[#2B2B2B] text-white px-2 focus-visible:ring-0"
                                />
                              </div>

                              {/* Sets Table */}
                              <div className="space-y-1.5 pt-2">
                                <span className="text-[8.5px] font-bold text-[#AAAAAA] uppercase">Set Schema</span>
                                <div className="space-y-1.5">
                                  <div className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 text-[8px] font-black text-[#AAAAAA] uppercase text-center">
                                    <span>Set</span>
                                    <span>Weight (kg)</span>
                                    <span>Reps Target</span>
                                    <span>Actions</span>
                                  </div>
                                  
                                  {setList.map((set, setIdx) => (
                                    <div key={setIdx} className="grid grid-cols-[30px_1fr_1fr_45px] gap-2 items-center text-center">
                                      <span className="text-[10px] font-bold text-[#AAAAAA]">{setIdx + 1}</span>
                                      <Input
                                        type="number"
                                        placeholder="Load"
                                        value={set.weight}
                                        onChange={(e) => handleUpdateTemplateSet(day.id, item.id, setIdx, "weight", e.target.value, item)}
                                        className="h-7 text-center rounded bg-[#1F1F1F] border-[#2B2B2B] text-[10px] font-bold"
                                      />
                                      <Input
                                        placeholder="Target reps"
                                        value={set.reps}
                                        onChange={(e) => handleUpdateTemplateSet(day.id, item.id, setIdx, "reps", e.target.value, item)}
                                        className="h-7 text-center rounded bg-[#1F1F1F] border-[#2B2B2B] text-[10px] font-bold"
                                      />
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => handleDuplicateTemplateSet(day.id, item.id, setIdx, item)}
                                          className="p-1 hover:text-white text-[#AAAAAA] bg-[#1F1F1F] border border-[#2B2B2B] rounded"
                                        >
                                          <Copy className="h-3 w-3" />
                                        </button>
                                        <button
                                          onClick={() => handleRemoveTemplateSet(day.id, item.id, setIdx, item)}
                                          disabled={setList.length <= 1}
                                          className="p-1 hover:text-[#FF5A5F] text-[#AAAAAA] disabled:opacity-20 bg-[#1F1F1F] border border-[#2B2B2B] rounded"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleAddTemplateSet(day.id, item.id, item)}
                                  className="h-7 w-full text-[9px] font-bold text-[#4F8CFF] hover:bg-[#4F8CFF]/10 rounded mt-1.5 gap-1"
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
                  <p className="text-[10px] text-[#AAAAAA] italic">No exercises templates added.</p>
                )}

                <div className="pt-2">
                  <Button
                    onClick={() => {
                      setExercisePickerTargetDayId(day.id);
                      setIsExercisePickerOpen(true);
                      setPickerSearchQuery("");
                    }}
                    className="w-full h-8.5 rounded-lg border border-[#2B2B2B] bg-[#1F1F1F] text-white hover:bg-[#2B2B2B] text-xs font-semibold gap-1.5"
                  >
                    <Plus className="h-4 w-4" /> Add Exercise Template
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Action row at bottom */}
        <div className="flex gap-2 sticky bottom-0 bg-[#0D0D0D] py-2 z-10 border-t border-[#2B2B2B]">
          <Button
            onClick={addWorkoutDay}
            variant="outline"
            className="flex-1 rounded-lg h-10.5 text-xs font-bold border-[#2B2B2B] bg-[#181818]"
          >
            <Plus className="h-4 w-4 mr-1" /> Add split day
          </Button>
          <Button
            onClick={handleSavePlan}
            disabled={saving}
            className="flex-1 rounded-lg h-10.5 bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-xs font-bold"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
            Save plan template
          </Button>
        </div>

        {/* EXERCISE PICKER DIALOG */}
        <Dialog open={isExercisePickerOpen} onOpenChange={setIsExercisePickerOpen}>
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-4 border-none bg-[#181818] text-white">
            <DialogHeader className="pb-3 border-b border-[#2B2B2B] flex flex-row items-center justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-white">Pick Exercise</DialogTitle>
                <DialogDescription className="text-xs text-[#AAAAAA] mt-1">
                  Choose exercise templates to add to split
                </DialogDescription>
              </div>
              <button 
                onClick={() => setIsExercisePickerOpen(false)}
                className="p-1 rounded-full text-[#AAAAAA] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            <div className="space-y-4 pt-3">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#AAAAAA]" />
                <Input
                  value={pickerSearchQuery}
                  onChange={(e) => setPickerSearchQuery(e.target.value)}
                  placeholder="Fuzzy search movement..."
                  className="pl-9 h-9 rounded-lg border-[#2B2B2B] bg-[#1F1F1F] text-white placeholder-[#AAAAAA] text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[#4F8CFF]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-3 gap-1 bg-[#1F1F1F] p-0.5 rounded-lg border border-[#2B2B2B]">
                {[
                  { id: "all", label: "All Movements" },
                  { id: "favorites", label: "Favorites" },
                  { id: "recent", label: "Recent" },
                ].map((flt) => (
                  <button
                    key={flt.id}
                    onClick={() => setPickerFilter(flt.id as any)}
                    className={cn(
                      "py-1 text-[10px] font-bold rounded transition-all",
                      pickerFilter === flt.id
                        ? "bg-[#2B2B2B] text-white"
                        : "text-[#AAAAAA] hover:text-white"
                    )}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>

              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {filteredPickerExercises.length > 0 ? (
                  filteredPickerExercises.map((ex) => {
                    const isFavorite = favoriteExerciseIds.includes(ex.id);
                    return (
                      <div
                        key={ex.id}
                        className="flex items-center justify-between p-2.5 bg-[#1F1F1F] hover:bg-[#2B2B2B]/40 rounded-lg border border-[#2B2B2B]/60 transition-colors"
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
                          <h4 className="text-xs font-bold text-white">{ex.name}</h4>
                          <span className="text-[9.5px] text-[#AAAAAA] font-semibold mt-0.5 block">
                            {ex.category} • {ex.equipment}
                          </span>
                        </div>

                        <button
                          onClick={() => toggleFavoriteExercise(ex.id)}
                          className="p-1 hover:bg-white/5 rounded-lg text-[#AAAAAA] transition-colors"
                        >
                          <Star className={cn("h-4 w-4", isFavorite ? "fill-[#FFB547] text-[#FFB547]" : "text-[#AAAAAA]")} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-6 space-y-3">
                    <p className="text-[11px] text-[#AAAAAA] italic">No matching movement found.</p>
                    <Button
                      onClick={() => {
                        setNewExerciseName(pickerSearchQuery);
                        setIsCreateExerciseOpen(true);
                      }}
                      className="h-8.5 rounded-lg bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-[10px] font-bold"
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
          <DialogContent className="max-w-xs rounded-xl p-5 border-none bg-[#181818] text-white">
            <DialogHeader className="pb-2 border-b border-[#2B2B2B]">
              <DialogTitle className="text-sm font-bold text-white">Create Custom Exercise</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-3.5">
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Exercise Name</span>
                <Input
                  value={newExerciseName}
                  onChange={(e) => setNewExerciseName(e.target.value)}
                  placeholder="e.g. Incline DB Press"
                  className="h-8.5 rounded-lg border-[#2B2B2B] bg-[#1F1F1F] text-white px-2.5 text-xs focus-visible:ring-1"
                />
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Primary Muscle</span>
                <select
                  value={newExerciseMuscle}
                  onChange={(e) => setNewExerciseMuscle(e.target.value)}
                  className="w-full h-8.5 text-xs rounded-lg bg-[#1F1F1F] border border-[#2B2B2B] text-white px-2 outline-none"
                >
                  {AVAILABLE_MUSCLES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Equipment</span>
                <select
                  value={newExerciseEquipment}
                  onChange={(e) => setNewExerciseEquipment(e.target.value)}
                  className="w-full h-8.5 text-xs rounded-lg bg-[#1F1F1F] border border-[#2B2B2B] text-white px-2 outline-none"
                >
                  {["Barbell", "Dumbbell", "Machine", "Cable", "Smith", "EZ Bar", "Trap Bar", "Bodyweight", "Other"].map((eq) => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateExerciseOpen(false)}
                  className="flex-1 rounded-lg text-[10px] font-bold border-[#2B2B2B] bg-[#1F1F1F]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCreateCustomExercise}
                  disabled={!newExerciseName.trim()}
                  className="flex-1 rounded-lg bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-[10px] font-bold"
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
  return (
    <div className="mx-auto max-w-md md:max-w-4xl px-2 pb-16 space-y-6">
      
      {/* Top Bar with Brand and Tabs */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center px-1">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-[#4F8CFF]/15 text-[#4F8CFF] flex items-center justify-center shrink-0">
              <Dumbbell className="h-3.5 w-3.5" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white font-[family:var(--font-display)]">
              Kratos tracker
            </h1>
          </div>
          {draftSession && (
            <Badge className="bg-[#FFB547]/10 text-[#FFB547] border-none text-[9px] font-bold tracking-wider uppercase animate-pulse">
              Active workout
            </Badge>
          )}
        </div>

        {/* Tab switcher: Plans, Session, History */}
        <div className="grid grid-cols-3 gap-1 bg-[#181818] p-1 rounded-xl border border-[#2B2B2B]">
          {[
            { id: "plans", label: "Plans", icon: ClipboardList },
            { id: "session", label: "Session", icon: Play },
            { id: "history", label: "History", icon: History },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all select-none",
                  isActive 
                    ? "bg-[#4F8CFF] text-white shadow-sm"
                    : "text-[#AAAAAA] hover:text-white hover:bg-white/5"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence mode="wait">
        
        {/* VIEW 1: PLANS MANAGEMENT */}
        {activeTab === "plans" && (
          <motion.div
            key="plans"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Search and Sort controls */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#AAAAAA]" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search plan name..."
                  className="pl-9 h-9 rounded-xl border-[#2B2B2B] bg-[#181818] text-white placeholder-[#AAAAAA] text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[#4F8CFF]"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-9 rounded-xl border border-[#2B2B2B] bg-[#181818] text-white text-xs font-semibold px-2.5 outline-none focus:ring-1 focus:ring-[#4F8CFF]"
              >
                <option value="edited">Recently Edited</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="exercises">Exercises Count</option>
              </select>
            </div>

            {/* Create new plan button */}
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#AAAAAA]">
                Workout templates ({filteredPlans.length})
              </span>
              <Button 
                onClick={() => {
                  const newDraft = blankPlan(data.user.id);
                  setPlans((prev) => [newDraft, ...prev]);
                  setActiveDraftPlan(newDraft);
                  setIsEditingSplit(true);
                }}
                size="sm" 
                className="h-8 rounded-xl bg-[#4F8CFF] hover:bg-[#4F8CFF]/90 text-white text-[10px] font-bold gap-1 px-3"
              >
                <Plus className="h-3.5 w-3.5" /> Create Plan
              </Button>
            </div>

            {filteredPlans.length > 0 ? (
              <div className="grid gap-3">
                {filteredPlans.map((plan) => {
                  const daysCount = plan.days.length;
                  const totalExercises = plan.days.reduce((acc: number, d: WeeklyPlanDay) => acc + d.items.length, 0);
                  const isDraft = !isPersistedId(plan.id);

                  return (
                    <Card
                      key={plan.id}
                      className="p-4 border border-[#2B2B2B] bg-[#181818] rounded-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold text-white">{plan.name}</h3>
                              {isDraft && (
                                <Badge className="bg-[#FFB547]/10 text-[#FFB547] text-[8px] font-bold px-1.5 py-0.25 border-none">
                                  DRAFT
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-[#AAAAAA] mt-1 line-clamp-1">
                              {plan.notes || "No description."}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleDuplicatePlan(plan)}
                              title="Duplicate Plan"
                              className="p-1.5 text-[#AAAAAA] hover:text-[#4F8CFF] rounded-lg transition-colors"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => setDeletingPlanId(plan.id)}
                              title="Delete Plan"
                              className="p-1.5 text-[#AAAAAA] hover:text-[#FF5A5F] rounded-lg transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-[10px] text-[#AAAAAA] font-bold">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5 text-[#AAAAAA]/60" />
                            {daysCount} {daysCount === 1 ? "day" : "days"}
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5 text-[#AAAAAA]/60" />
                            {totalExercises} exercises
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-[#2B2B2B]">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingPlan(plan)}
                          className="h-8.5 rounded-lg text-[10px] font-bold border-[#2B2B2B] bg-[#1F1F1F] text-white hover:bg-[#2B2B2B]"
                        >
                          Stimulus Audit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setActiveDraftPlan(plan);
                            setIsEditingSplit(true);
                          }}
                          className="h-8.5 rounded-lg text-[10px] font-bold border-[#2B2B2B] bg-[#1F1F1F] text-white hover:bg-[#2B2B2B]"
                        >
                          <Edit3 className="h-3 w-3 mr-1" /> Edit Template
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border border-dashed border-[#2B2B2B] bg-[#181818] rounded-xl">
                <ClipboardList className="h-8 w-8 text-[#AAAAAA]/50 mx-auto stroke-[1.5]" />
                <h3 className="text-xs font-bold text-white mt-3">No workout plans yet.</h3>
                <p className="text-[10px] text-[#AAAAAA] max-w-xs mx-auto mt-1">
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
            className="space-y-5"
          >
            <Card 
              onClick={startEmptyWorkout}
              className="p-5 border border-[#2B2B2B] bg-[#181818] hover:border-[#4F8CFF]/50 transition-all rounded-xl cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="h-10 w-10 rounded-xl bg-[#4F8CFF] text-white flex items-center justify-center shrink-0">
                    <Play className="h-5 w-5 fill-current ml-0.5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold tracking-tight text-white">
                      Start Empty Workout
                    </CardTitle>
                    <CardDescription className="text-xs text-[#AAAAAA] mt-0.5">
                      Log a fast session without template constraints.
                    </CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-4.5 w-4.5 text-[#AAAAAA] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Card>

            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#AAAAAA] px-1 block">
                Log Template Split
              </span>

              {plans.length > 0 ? (
                <div className="grid gap-2.5">
                  {plans.flatMap((plan) => 
                    plan.days.map((day) => {
                      const exerciseCount = day.items.length;
                      return (
                        <div
                          key={`${plan.id}-${day.id}`}
                          onClick={() => startWorkoutFromDay(day, plan)}
                          className="flex items-center justify-between p-3.5 bg-[#181818] border border-[#2B2B2B] hover:border-[#4F8CFF]/30 rounded-xl transition-all cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-lg bg-[#4F8CFF]/15 text-[#4F8CFF] flex items-center justify-center font-bold text-xs shrink-0">
                              {day.title.slice(0, 3)}
                            </div>
                            <div>
                              <h3 className="text-xs font-bold text-white group-hover:text-[#4F8CFF] transition-colors">
                                {plan.name} • {day.title}
                              </h3>
                              <p className="text-[9.5px] text-[#AAAAAA] mt-0.5 font-semibold">
                                Focus: {day.focus || "Routine"} • {exerciseCount} exercises
                              </p>
                            </div>
                          </div>
                          <Play className="h-3.5 w-3.5 text-[#AAAAAA] fill-current group-hover:text-[#4F8CFF] transition-colors" />
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <Card className="p-8 text-center border border-dashed border-[#2B2B2B] bg-[#181818] rounded-xl">
                  <Dumbbell className="h-8 w-8 text-[#AAAAAA]/50 mx-auto stroke-[1.5]" />
                  <h3 className="text-xs font-bold text-white mt-3">No splits ready</h3>
                  <p className="text-[10px] text-[#AAAAAA] max-w-xs mx-auto mt-1">
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#AAAAAA] px-1 block">
              Completed workouts history
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
                      className="flex items-center justify-between p-3.5 bg-[#181818] border border-[#2B2B2B] hover:border-[#4F8CFF]/20 rounded-xl transition-all cursor-pointer group"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-white group-hover:text-[#4F8CFF] transition-colors">
                            {session.title}
                          </h3>
                          {session.effort && (
                            <Badge className="bg-[#4F8CFF]/15 text-[#4F8CFF] border-none font-bold text-[8px] px-1.5 py-0.25">
                              {session.effort}
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3.5 text-[9px] text-[#AAAAAA] font-bold">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-[#AAAAAA]/60" />
                            {dateFormatted}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3 text-[#AAAAAA]/60" />
                            {durationMins} min
                          </span>
                          <span className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-[#AAAAAA]/60" />
                            {session.items.length} exercises logged
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="h-4 w-4 text-[#AAAAAA] group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <Card className="p-8 text-center border border-dashed border-[#2B2B2B] bg-[#181818] rounded-xl">
                <History className="h-8 w-8 text-[#AAAAAA]/50 mx-auto stroke-[1.5]" />
                <h3 className="text-xs font-bold text-white mt-3">No history logs found</h3>
                <p className="text-[10px] text-[#AAAAAA] max-w-xs mx-auto mt-1">
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
          <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl p-5 border-none bg-[#181818] text-white">
            <DialogHeader className="pb-3 border-b border-[#2B2B2B] flex flex-row items-start justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-white">{viewingPlan.name}</DialogTitle>
                <DialogDescription className="text-xs text-[#AAAAAA] mt-1">
                  Stimulus audit per muscle group
                </DialogDescription>
              </div>
              <button 
                onClick={() => setViewingPlan(null)}
                className="p-1 rounded-full text-[#AAAAAA] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            <div className="space-y-6 pt-4">
              {viewingPlan.days.map((day) => (
                <div key={day.id} className="space-y-2">
                  <div className="flex items-center justify-between bg-[#1F1F1F] p-2 rounded-lg">
                    <span className="text-xs font-bold text-white">{day.title}</span>
                    <Badge className="bg-[#4F8CFF]/15 text-[#4F8CFF] text-[8px] font-bold uppercase border-none">
                      {day.focus || "Focus"}
                    </Badge>
                  </div>
                  {day.items.length > 0 ? (
                    <div className="pl-2 space-y-1">
                      {day.items.map((item, idx) => {
                        const exerciseName = data.exercises.find((e) => e.id === item.exerciseId)?.name || item.exerciseId;
                        return (
                          <div key={idx} className="flex justify-between items-center text-[10px] text-[#AAAAAA]">
                            <span className="font-semibold">{exerciseName}</span>
                            <span className="font-bold text-[#AAAAAA]">
                              {item.sets} x {item.reps} sets
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="pl-2 text-[9px] text-[#AAAAAA] italic">No exercises added to this day.</p>
                  )}
                </div>
              ))}

              <div className="pt-4 border-t border-[#2B2B2B]">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#AAAAAA] mb-3">
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
          <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto rounded-2xl p-5 border-none bg-[#181818] text-white">
            <DialogHeader className="pb-3 border-b border-[#2B2B2B] flex flex-row items-start justify-between">
              <div>
                <DialogTitle className="text-base font-bold text-white">{viewingSession.title}</DialogTitle>
                <DialogDescription className="text-xs text-[#AAAAAA] mt-1">
                  Completed on {new Date(viewingSession.startedAt).toLocaleDateString()}
                </DialogDescription>
              </div>
              <button 
                onClick={() => setViewingSession(null)}
                className="p-1 rounded-full text-[#AAAAAA] hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </DialogHeader>

            <div className="space-y-5 pt-3">
              {viewingSession.effort && (
                <div className="flex items-center gap-2 p-2.5 bg-[#1F1F1F] rounded-lg">
                  <Award className="h-4 w-4 text-[#4F8CFF]" />
                  <span className="text-[10px] font-bold text-[#4F8CFF] uppercase tracking-wider">
                    Effort / Feeling: {viewingSession.effort}
                  </span>
                </div>
              )}

              {viewingSession.notes && (
                <div className="p-3 bg-[#1F1F1F] rounded-lg">
                  <h4 className="text-[9px] font-bold text-[#AAAAAA] uppercase tracking-wider">Notes</h4>
                  <p className="text-[10px] text-[#AAAAAA] mt-1 italic">{viewingSession.notes}</p>
                </div>
              )}

              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#AAAAAA] px-1">
                  Logged Sets
                </h4>
                {viewingSession.items.map((item, idx) => (
                  <div key={item.id || idx} className="p-3 bg-[#1F1F1F] border border-[#2B2B2B] rounded-xl">
                    <h5 className="text-[11px] font-bold text-white">{item.exerciseName}</h5>
                    <div className="mt-2 space-y-1">
                      {item.sets.map((set, setIdx) => (
                        <div key={setIdx} className="flex justify-between items-center text-[10px] text-[#AAAAAA] font-semibold">
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

              <div className="pt-4 border-t border-[#2B2B2B] flex justify-end">
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

      {/* CONFIRM DELETE PLANS */}
      <Dialog open={Boolean(deletingPlanId)} onOpenChange={(open) => !open && setDeletingPlanId(null)}>
        <DialogContent className="max-w-xs rounded-xl p-5 border-none bg-[#181818] text-white">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 bg-[#FF5A5F]/10 text-[#FF5A5F] rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Delete Workout Split?</h3>
            <p className="text-[10px] text-[#AAAAAA]">
              This action cannot be undone. Any custom configurations will be deleted.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingPlanId(null)}
                className="flex-1 rounded-lg text-[10px] font-bold border-[#2B2B2B] bg-[#1F1F1F]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => deletingPlanId && handleDeletePlan(deletingPlanId)}
                disabled={saving}
                className="flex-1 rounded-lg bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white text-[10px] font-bold"
              >
                {saving ? "Deleting..." : "Yes, Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* CONFIRM DELETE LOGS */}
      <Dialog open={Boolean(deletingSessionId)} onOpenChange={(open) => !open && setDeletingSessionId(null)}>
        <DialogContent className="max-w-xs rounded-xl p-5 border-none bg-[#181818] text-white">
          <div className="text-center space-y-3">
            <div className="h-10 w-10 bg-[#FF5A5F]/10 text-[#FF5A5F] rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Delete Workout Log?</h3>
            <p className="text-[10px] text-[#AAAAAA]">
              This will permanently delete this logged workout session.
            </p>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeletingSessionId(null)}
                className="flex-1 rounded-lg text-[10px] font-bold border-[#2B2B2B] bg-[#1F1F1F]"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => deletingSessionId && handleDeleteSession(deletingSessionId)}
                disabled={saving}
                className="flex-1 rounded-lg bg-[#FF5A5F] hover:bg-[#FF5A5F]/90 text-white text-[10px] font-bold"
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
