"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Plus, Save, Trash2, Loader2, Dumbbell, Sparkles, 
  BarChart3, Clock, Target, CalendarDays, ChevronRight, Play, Square,
  TrendingUp, Compass, PlusCircle, AlertCircle, Info, ChevronDown, Check, X,
  Edit2, Settings2, ShieldAlert, Award, Calendar, Volume2, VolumeX, Timer,
  Pause, RotateCcw, ChevronUp, History, ClipboardList, Flame
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { WeeklyPlan, WeeklyPlanDay, WeeklyPlanItem, WorkoutSession, WorkoutSessionItem, WorkoutSet } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlanAnalysis } from "./plan-analysis";
import { useData } from "@/components/shared/data-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

/** Swipe-left-to-delete wrapper for split library cards */
function SwipeToDeleteCard({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const [offset, setOffset] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const startX = useRef(0);
  const DELETE_THRESHOLD = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    const dx = e.touches[0].clientX - startX.current;
    if (dx < 0) setOffset(Math.max(dx, -DELETE_THRESHOLD - 20));
  };
  const handleTouchEnd = () => {
    if (offset < -DELETE_THRESHOLD) {
      setDeleting(true);
      onDelete();
    } else {
      setOffset(0);
    }
  };

  if (deleting) return null;

  return (
    <div
      style={{ position: "relative", overflow: "hidden", borderRadius: "16px" }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div style={{
        position: "absolute", inset: 0, background: "#ff3b30",
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        paddingRight: "20px", borderRadius: "16px",
      }}>
        <Trash2 size={16} color="#fff" />
      </div>
      <div style={{ transform: `translateX(${offset}px)`, transition: offset === 0 ? "transform 0.25s ease" : "none" }}>
        {children}
      </div>
    </div>
  );
}

const parseProtocolLines = (text: string) => {
  if (!text) return [];
  const clean = text.replace(/^(cool-down stretch|cool-down stretches|cool-down|cooldown|warm-up|warmup|stretches|stretch):\s*/i, "");
  const rawLines = clean.split(/(?:\r?\n)|(?:\.\s+(?=[A-Z0-9]))|(?<=\))\s*,\s*(?=[A-Z0-9])/);
  return rawLines
    .map(line => line.trim())
    .filter(line => line.length > 0)
    .map(line => line.replace(/,$/, "").trim());
};

const getCustomTagsFromNotes = (notes: string): string[] => {
  const tagsMatch = (notes || "").match(/TAGS:\s*([^\n\r]+)/i);
  if (tagsMatch && tagsMatch[1]) {
    return tagsMatch[1].split(",").map(t => t.trim()).filter(Boolean);
  }
  return [];
};

const setCustomTagsInNotes = (notes: string, tags: string[]): string => {
  const cleanNotes = notes.replace(/TAGS:\s*[^\n\r]+/i, "").trim();
  if (tags.length === 0) return cleanNotes;
  const tagsLine = `TAGS: ${tags.join(", ")}`;
  return cleanNotes ? `${cleanNotes}\n${tagsLine}` : tagsLine;
};

const getItemTags = (notes: string, exerciseId: string, exerciseCategory?: string, exercises: any[] = []) => {
  const tags: Array<{ label: string; type: string; color: string }> = [];
  const lowerNotes = (notes || "").toLowerCase();
  const lowerId = (exerciseId || "").toLowerCase();
  
  const exercise = exercises.find(e => e.id === exerciseId);
  const categoryLower = (exerciseCategory || exercise?.category || "").toLowerCase();

  if (lowerNotes.includes("superset") || lowerId.includes("superset")) {
    tags.push({ label: "SUPERSET", type: "superset", color: "bg-purple-100 text-purple-700 border-transparent" });
  }
  if (lowerNotes.includes("dropset") || lowerNotes.includes("drop-set") || lowerNotes.includes("drop set")) {
    tags.push({ label: "DROPSET", type: "dropset", color: "bg-amber-100 text-amber-700 border-transparent" });
  }
  if (lowerNotes.includes("warm-up") || lowerNotes.includes("warmup") || categoryLower === "mobility") {
    if (!tags.some(t => t.label === "WARM-UP")) {
      tags.push({ label: "WARM-UP", type: "warmup", color: "bg-blue-100 text-blue-700 border-transparent" });
    }
  }
  
  const hasStretch = (lowerNotes.includes("stretch") && !lowerNotes.includes("deep stretch") && !lowerNotes.includes("tempo")) || 
                     lowerNotes.includes("cooldown") || 
                     lowerNotes.includes("cool-down") || 
                     lowerNotes.includes("flow");
  if (hasStretch) {
    tags.push({ label: "STRETCH / FLOW", type: "stretch", color: "bg-teal-100 text-teal-700 border-transparent" });
  }

  const tagsMatch = (notes || "").match(/TAGS:\s*([^\n\r]+)/i);
  if (tagsMatch && tagsMatch[1]) {
    const customList = tagsMatch[1].split(",").map(t => t.trim()).filter(Boolean);
    customList.forEach(tagName => {
      const upperName = tagName.toUpperCase();
      if (!tags.some(t => t.label === upperName)) {
        tags.push({ 
          label: upperName, 
          type: "custom", 
          color: "bg-neutral-100 text-neutral-700 border-neutral-200" 
        });
      }
    });
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
      focus: "Focus Area",
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

  // Views: 
  // "library": Overview of splits list
  // "view_split": Details overview of selected split, days list, audit
  // "edit_split": Form to configure/reorder split details (dialogs avoid cluttering inputs)
  // "log_workout": Active workout session stopwatch/exercise checklist
  // "log_exercise": Single-exercise outcome logger with Sets Table and Rest Timer triggers
  const [view, setView] = useState<"library" | "view_split" | "edit_split" | "log_workout" | "log_exercise">("library");

  const [currentPage, setCurrentPage] = useState(1);
  const [isClient, setIsClient] = useState(false);
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [activeDayId, setActiveDayId] = useState("");
  const [saving, setSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Edit dialog states
  const [isEditSplitNameOpen, setIsSplitNameOpen] = useState(false);
  const [isEditDayOpen, setIsEditDayOpen] = useState(false);
  const [isEditingExerciseOpen, setIsEditingExerciseOpen] = useState(false);
  const [editingExerciseIndex, setEditingExerciseIndex] = useState<number | null>(null);
  
  const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
  const [searchExerciseQuery, setSearchExerciseQuery] = useState("");
  const [supersetModalOpen, setSupersetModalOpen] = useState(false);
  const [supersetExercises, setSupersetExercises] = useState<string[]>([]);
  const [newTagInputValue, setNewTagInputValue] = useState("");


  // Active logging states
  const [draftSession, setDraftSession] = useState<Partial<WorkoutSession> | null>(null);
  const [workoutElapsedTime, setWorkoutElapsedTime] = useState(0);
  const [activeExerciseIndex, setActiveExerciseIndex] = useState<number | null>(null);
  const [sessionSavingStatus, setSessionSavingStatus] = useState("");

  // Rest Timer states
  const [restTimerSecondsLeft, setRestTimerSecondsLeft] = useState<number | null>(null);
  const [restTimerDuration, setRestTimerDuration] = useState<number>(90);
  const [restTimerIsPaused, setRestTimerIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Loaded database sessions for display on Split overview
  const [sessions, setSessions] = useState<WorkoutSession[]>(data.sessions);

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

  // Debounced Auto-save during EDIT mode
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (view !== "edit_split" || !isPersistedId(selectedPlan.id)) return;

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
  }, [plans, selectedPlan, view]);

  // Active workout stopwatch ticking
  useEffect(() => {
    let interval: any;
    if (draftSession && (view === "log_workout" || view === "log_exercise")) {
      interval = setInterval(() => {
        setWorkoutElapsedTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [draftSession, view]);

  // Rest Timer countdown
  useEffect(() => {
    let timer: any;
    if (restTimerSecondsLeft !== null && restTimerSecondsLeft > 0 && !restTimerIsPaused) {
      timer = setInterval(() => {
        setRestTimerSecondsLeft((s) => {
          if (s !== null && s <= 1) {
            playBeep();
            if (typeof navigator !== "undefined" && navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return null;
          }
          return s !== null ? s - 1 : null;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [restTimerSecondsLeft, restTimerIsPaused]);

  const formattedElapsedTime = useMemo(() => {
    const mins = Math.floor(workoutElapsedTime / 60);
    const secs = workoutElapsedTime % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }, [workoutElapsedTime]);

  const exerciseOptions = useMemo(
    () => data.exercises.map((exercise) => ({ value: exercise.id, label: exercise.name })),
    [data.exercises]
  );

  const startRestTimer = (seconds: number) => {
    setRestTimerDuration(seconds || 90);
    setRestTimerSecondsLeft(seconds || 90);
    setRestTimerIsPaused(false);
  };

  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      console.error("Audio beep failed", e);
    }
  };

  const visualGroups = useMemo(() => {
    if (!activeDay || !activeDay.items) return [];
    
    const getSupersetKey = (notes: string) => {
      const match = (notes || "").match(/SUPERSET\s*([0-9]+)/i);
      if (match) return `SUPERSET ${match[1]}`;
      const matchColon = (notes || "").match(/SUPERSET:\s*([^\n\r]+)/i);
      if (matchColon) return `SUPERSET ${matchColon[1].trim().replace(/\s+[A-Z0-9]$/i, "").toUpperCase()}`;
      if ((notes || "").toLowerCase().includes("superset")) return "SUPERSET";
      return null;
    };

    const groups: Array<{
      type: "single" | "superset";
      supersetKey?: string;
      items: Array<{ item: WeeklyPlanItem; originalIndex: number }>;
    }> = [];
    let currentSupersetKey: string | null = null;
    let currentSupersetGroup: typeof groups[number] | null = null;

    activeDay.items.forEach((item, index) => {
      const key = getSupersetKey(item.notes);
      
      if (key) {
        if (currentSupersetGroup && (currentSupersetKey === key)) {
          currentSupersetGroup.items.push({ item, originalIndex: index });
        } else {
          currentSupersetKey = key;
          currentSupersetGroup = {
            type: "superset",
            supersetKey: key,
            items: [{ item, originalIndex: index }]
          };
          groups.push(currentSupersetGroup);
        }
      } else {
        currentSupersetKey = null;
        currentSupersetGroup = null;
        groups.push({
          type: "single",
          items: [{ item, originalIndex: index }]
        });
      }
    });

    return groups;
  }, [activeDay]);

  const patchSelectedPlan = (updater: (plan: WeeklyPlan) => WeeklyPlan) => {
    setPlans((current) =>
      current.map((plan) => (plan.id === selectedPlan.id ? updater(plan) : plan))
    );
  };

  const updateDay = (dayId: string, updater: (day: WeeklyPlanDay) => WeeklyPlanDay) => {
    patchSelectedPlan((plan) => ({
      ...plan,
      days: plan.days.map((entry) => (entry.id === dayId ? updater(entry) : entry)),
    }));
  };

  const updateItem = (
    dayId: string,
    itemIndex: number,
    updater: (item: WeeklyPlanItem) => WeeklyPlanItem
  ) => {
    updateDay(dayId, (day) => ({
      ...day,
      items: day.items.map((item, currentIndex) => (currentIndex === itemIndex ? updater(item) : item)),
    }));
  };

  // Workout Session Logging Actions
  const startWorkoutSession = () => {
    if (!activeDay || !activeDay.items.length) return;
    
    // Set up draft session structure
    const session: Partial<WorkoutSession> = {
      planId: selectedPlan.id,
      planDayId: activeDay.id,
      startedAt: new Date().toISOString(),
      endedAt: null,
      day: activeDay.day,
      title: `${selectedPlan.name} • ${activeDay.title}`,
      effort: "",
      notes: activeDay.notes,
      items: activeDay.items.map((item, order) => ({
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
    setWorkoutElapsedTime(0);
    setRestTimerSecondsLeft(null);
    setSessionSavingStatus("");
    setView("log_workout");
  };

  const startEditCompletedSession = (session: WorkoutSession) => {
    setDraftSession({
      ...session,
      items: session.items.map(item => ({
        ...item,
        sets: item.sets.map(s => ({ ...s, completed: true } as any))
      }))
    });
    setWorkoutElapsedTime(0);
    setRestTimerSecondsLeft(null);
    setSessionSavingStatus("Editing session...");
    setView("log_workout");
  };

  const removeSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;
    const response = await fetch(`/api/workouts?id=${sessionId}`, { method: "DELETE" });
    if (response.ok) {
      setSessions((current) => current.filter((s) => s.id !== sessionId));
      router.refresh();
    }
  };

  const saveWorkoutSession = async () => {
    if (!draftSession) return;
    setSaving(true);
    setSessionSavingStatus("");

    // Strip temporary client properties like `completed` if needed, though Postgres handles it
    const isEdit = Boolean(draftSession.id);
    const payloadBody = {
      ...draftSession,
      endedAt: draftSession.endedAt || new Date().toISOString(),
    };

    const response = await fetch("/api/workouts", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payloadBody),
    });

    const payload = (await response.json()) as { session?: WorkoutSession; error?: string };
    if (!response.ok || !payload.session) {
      setSessionSavingStatus(payload.error || "Could not save the session.");
      setSaving(false);
      return;
    }

    setSessions((current) => [payload.session!, ...current.filter((s) => s.id !== payload.session!.id)]);
    setSaving(false);
    setDraftSession(null);
    setRestTimerSecondsLeft(null);
    setView("view_split");
    router.refresh();
  };

  const toggleSetCompleted = (itemIdx: number, setIdx: number) => {
    if (!draftSession || !draftSession.items) return;

    const currentItem = draftSession.items[itemIdx];
    const currentSet = currentItem.sets[setIdx] as any;
    const wasCompleted = Boolean(currentSet.completed);
    const nextCompleted = !wasCompleted;

    let nextWeight = currentSet.weight;
    let nextReps = currentSet.reps;

    // Smart autofill logic on set checkmark
    if (nextCompleted) {
      if (!nextWeight) {
        // Look at previous sets
        const prevFilledSet = currentItem.sets.slice(0, setIdx).reverse().find(s => s.weight);
        nextWeight = prevFilledSet ? prevFilledSet.weight : (currentItem.targetLoad && !isNaN(parseFloat(currentItem.targetLoad)) ? currentItem.targetLoad : "");
      }
      if (!nextReps) {
        // Parse from rep bracket prescription (e.g. "8-10" -> "8")
        const repsMatch = currentItem.reps.match(/^([0-9]+)/);
        nextReps = repsMatch ? repsMatch[1] : currentItem.reps;
      }
    }

    setDraftSession(current => {
      if (!current || !current.items) return current;
      return {
        ...current,
        items: current.items.map((item, idx) => {
          if (idx !== itemIdx) return item;
          return {
            ...item,
            sets: item.sets.map((set, sIdx) => {
              if (sIdx !== setIdx) return set;
              return {
                ...set,
                weight: nextWeight,
                reps: nextReps,
                completed: nextCompleted
              } as any;
            })
          };
        })
      };
    });

    if (nextCompleted) {
      // Trigger rest timer
      setTimeout(() => {
        startRestTimer(currentItem.restSeconds || 90);
      }, 50);
    }
  };

  const updateSessionSetInput = (itemIdx: number, setIdx: number, field: keyof WorkoutSet, value: string) => {
    setDraftSession(current => {
      if (!current || !current.items) return current;
      return {
        ...current,
        items: current.items.map((item, idx) => {
          if (idx !== itemIdx) return item;
          return {
            ...item,
            sets: item.sets.map((set, sIdx) => {
              if (sIdx !== setIdx) return set;
              return { ...set, [field]: value };
            })
          };
        })
      };
    });
  };

  const addSessionSet = (itemIdx: number) => {
    setDraftSession(current => {
      if (!current || !current.items) return current;
      return {
        ...current,
        items: current.items.map((item, idx) => {
          if (idx !== itemIdx) return item;
          return {
            ...item,
            sets: [...item.sets, { weight: "", reps: "", completed: false } as any]
          };
        })
      };
    });
  };

  const removeSessionSet = (itemIdx: number, setIdx: number) => {
    setDraftSession(current => {
      if (!current || !current.items) return current;
      return {
        ...current,
        items: current.items.map((item, idx) => {
          if (idx !== itemIdx) return item;
          return {
            ...item,
            sets: item.sets.filter((_, sIdx) => sIdx !== setIdx)
          };
        })
      };
    });
  };

  // Plan creation and deletions
  const createPlan = () => {
    const next = blankPlan(data.user.id, `Split ${plans.length + 1}`);
    setPlans((current) => [next, ...current]);
    setSelectedPlanId(next.id);
    setActiveDayId(next.days[0]?.id ?? "");
    setMessage("");
    setView("edit_split");
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
    setMessage("Split saved successfully.");
    setSaving(false);
    setView("view_split");
    router.refresh();
  };

  const removePlan = async () => {
    if (!confirm("Are you sure you want to delete this weekly split?")) return;
    if (!isPersistedId(selectedPlan.id)) {
      const remainingDrafts = plans.filter((plan) => plan.id !== selectedPlan.id);
      const nextPlans = remainingDrafts.length ? remainingDrafts : [blankPlan(data.user.id)];
      setPlans(nextPlans);
      setSelectedPlanId(nextPlans[0]?.id ?? "");
      setActiveDayId(nextPlans[0]?.days[0]?.id ?? "");
      setView("library");
      return;
    }

    await fetch(`/api/plans/${selectedPlan.id}`, { method: "DELETE" });
    const remaining = plans.filter((plan) => plan.id !== selectedPlan.id);
    const nextPlans = remaining.length ? remaining : [blankPlan(data.user.id)];
    setPlans(nextPlans);
    setSelectedPlanId(nextPlans[0]?.id ?? "");
    setActiveDayId(nextPlans[0]?.days[0]?.id ?? "");
    setView("library");
    router.refresh();
  };

  // Day Management
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
          focus: "Focus Area",
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

  // Exercise Editing Helper Actions
  const openEditExerciseDialog = (idx: number) => {
    setEditingExerciseIndex(idx);
    setIsEditingExerciseOpen(true);
  };

  const deleteExerciseItem = (idx: number) => {
    updateDay(activeDay.id, (entry) => ({
      ...entry,
      items: entry.items.filter((_, currentIndex) => currentIndex !== idx),
    }));
  };

  const moveExercise = (direction: "up" | "down", index: number) => {
    const items = [...activeDay.items];
    if (direction === "up" && index > 0) {
      const temp = items[index];
      items[index] = items[index - 1];
      items[index - 1] = temp;
    } else if (direction === "down" && index < items.length - 1) {
      const temp = items[index];
      items[index] = items[index + 1];
      items[index + 1] = temp;
    }
    updateDay(activeDay.id, (day) => ({
      ...day,
      items: items.map((item, idx) => ({ ...item, order: idx })),
    }));
  };

  const filteredExercisesList = useMemo(() => {
    if (!searchExerciseQuery) return data.exercises;
    return data.exercises.filter(e => 
      e.name.toLowerCase().includes(searchExerciseQuery.toLowerCase()) || 
      e.category.toLowerCase().includes(searchExerciseQuery.toLowerCase()) ||
      e.primaryMuscles.some(m => m.toLowerCase().includes(searchExerciseQuery.toLowerCase()))
    );
  }, [searchExerciseQuery, data.exercises]);

  const selectAndAddExercise = (exerciseId: string) => {
    const ex = data.exercises.find(e => e.id === exerciseId);
    if (!ex) return;

    const newItem: WeeklyPlanItem = {
      id: `draft-item-${randomId()}`,
      exerciseId,
      sets: 3,
      reps: "8-10",
      restSeconds: ex.defaultRestSeconds || 90,
      targetLoad: "Moderate",
      targetRpe: "8",
      prGoal: "",
      notes: "",
      order: activeDay.items.length,
    };

    updateDay(activeDay.id, (day) => ({
      ...day,
      items: [...day.items, newItem]
    }));

    setIsExercisePickerOpen(false);
    setSearchExerciseQuery("");
    
    // Automatically open edit dialog for this new item to configure
    setTimeout(() => {
      openEditExerciseDialog(activeDay.items.length);
    }, 100);
  };

  const createSuperset = () => {
    if (supersetExercises.length < 2) return;
    
    let maxNumber = 0;
    activeDay.items.forEach(item => {
      const match = (item.notes || "").match(/SUPERSET\s*([0-9]+)/i);
      if (match) {
        const num = parseInt(match[1], 10);
        if (num > maxNumber) maxNumber = num;
      }
    });
    const nextNumber = maxNumber + 1;

    const newItems = supersetExercises.map((exId, idx) => {
      const letter = String.fromCharCode(65 + idx);
      const ex = data.exercises.find(e => e.id === exId);
      return {
        id: `draft-item-${randomId()}`,
        exerciseId: exId,
        sets: 3,
        reps: "8-10",
        restSeconds: ex?.defaultRestSeconds || 90,
        targetLoad: "Moderate",
        targetRpe: "8",
        prGoal: "",
        notes: `SUPERSET ${nextNumber}${letter}. Perform back-to-back.`,
        order: activeDay.items.length + idx,
      };
    });

    updateDay(activeDay.id, (day) => ({
      ...day,
      items: [...day.items, ...newItems],
    }));

    setSupersetModalOpen(false);
  };

  // Filter completed sessions specifically for this split to render history
  const planSessionsHistory = useMemo(() => {
    return sessions.filter((s) => s.planId === selectedPlan.id);
  }, [sessions, selectedPlan.id]);

  const getSessionDurationMin = (start: string, end: string | null | undefined) => {
    if (!end) return 0;
    return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
  };

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(
      new Date(value)
    );

  const renderRestTimer = () => {
    if (restTimerSecondsLeft === null) return null;
    const progress = (restTimerSecondsLeft / restTimerDuration) * 100;
    const mins = Math.floor(restTimerSecondsLeft / 60);
    const secs = restTimerSecondsLeft % 60;
    const timeStr = `${mins}:${String(secs).padStart(2, "0")}`;

    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-neutral-950 text-white rounded-2xl p-4 shadow-2xl border border-neutral-800 flex flex-col gap-3 z-50 animate-in slide-in-from-bottom duration-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Rest Timer</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="h-6 w-6 p-0 hover:bg-neutral-900 text-neutral-400 hover:text-white"
            >
              {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5 text-neutral-600" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setRestTimerSecondsLeft(null)}
              className="h-6 w-6 p-0 hover:bg-neutral-900 text-neutral-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-3xl font-black tabular-nums tracking-tight">{timeStr}</span>
            <span className="text-[9px] font-medium text-neutral-500">Target: {restTimerDuration}s</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Button
              onClick={() => setRestTimerIsPaused(!restTimerIsPaused)}
              className="h-8 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs border-none"
            >
              {restTimerIsPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </Button>
            <Button
              onClick={() => setRestTimerSecondsLeft((s) => (s ? s + 15 : 15))}
              className="h-8 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs border border-neutral-800"
            >
              +15s
            </Button>
            <Button
              onClick={() => setRestTimerSecondsLeft(null)}
              className="h-8 px-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-semibold text-xs border border-neutral-800"
            >
              Skip
            </Button>
          </div>
        </div>

        {/* Custom Progress Bar */}
        <div className="h-1.5 w-full bg-neutral-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all duration-1000 ease-linear animate-pulse" style={{ width: `${progress}%` }} />
        </div>
      </div>
    );
  };

  if (!isClient) return null;

  // Pagination calculations for Splits Library
  const PLANS_PER_PAGE = 6;
  const totalPages = Math.ceil(plans.length / PLANS_PER_PAGE);
  const paginatedPlans = plans.slice((currentPage - 1) * PLANS_PER_PAGE, currentPage * PLANS_PER_PAGE);

  return (
    <div className="space-y-4 pb-20 relative">
      
      {/* ---------------------------------------------------- */}
      {/* VIEW 1: Splits Library List Grid                     */}
      {/* ---------------------------------------------------- */}
      {view === "library" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/40">Weekly planner</span>
              <h1 className="text-2xl font-black tracking-tight text-black">Program Splits</h1>
            </div>
            <Button onClick={createPlan} className="bg-black hover:bg-neutral-900 text-white rounded-xl font-bold text-xs h-9 px-4 shadow-sm flex items-center gap-1.5 transition">
              <Plus className="h-4 w-4" />
              <span>New Split</span>
            </Button>
          </div>

          {plans.length === 0 ? (
            <Card className="flex h-64 flex-col items-center justify-center border-dashed p-6 text-center border-neutral-200">
              <Dumbbell className="h-8 w-8 text-neutral-300 mb-3" />
              <p className="text-sm font-semibold text-neutral-600">No program splits created yet.</p>
              <p className="text-xs text-neutral-400 mt-1 max-w-xs mx-auto">Establish a structured training split first, then use it to launch workout telemetry sessions.</p>
              <Button onClick={createPlan} className="mt-4 bg-black text-white hover:bg-neutral-900">
                Create First Split
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {paginatedPlans.map((p) => {
                  const totalLifts = p.days.reduce((count, day) => count + day.items.length, 0);
                  return (
                    <SwipeToDeleteCard
                      key={p.id}
                      onDelete={async () => {
                        if (isPersistedId(p.id)) {
                          await fetch(`/api/plans/${p.id}`, { method: "DELETE" });
                        }
                        setPlans(prev => prev.filter(x => x.id !== p.id));
                        router.refresh();
                      }}
                    >
                      <Card 
                        className="p-5 border border-black/5 bg-white hover:bg-neutral-50/50 hover:shadow-md transition duration-200 flex flex-col justify-between cursor-pointer rounded-2xl min-h-[140px]"
                        onClick={() => {
                          setSelectedPlanId(p.id);
                          setActiveDayId(p.days[0]?.id ?? "");
                          setView("view_split");
                        }}
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <h3 className="font-extrabold text-sm text-neutral-900 truncate">{p.name}</h3>
                            <Badge className="bg-black/5 text-black/60 border-transparent text-[9px] font-extrabold py-0.5 px-2 shrink-0">
                              {p.days.length}d split
                            </Badge>
                          </div>
                          <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                            {p.notes || "No split description configured."}
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5 text-neutral-400" />
                            {totalLifts} planned exercises
                          </span>
                          <span className="text-[10px] text-neutral-900 font-extrabold">Open Split →</span>
                        </div>
                      </Card>
                    </SwipeToDeleteCard>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="h-9 rounded-xl text-xs font-semibold px-4"
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-bold text-neutral-500 px-3">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="h-9 rounded-xl text-xs font-semibold px-4"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW 2: Detail Overview View of a Selected Split     */}
      {/* ---------------------------------------------------- */}
      {view === "view_split" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Actions */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => setView("library")}
              className="h-9 px-3 rounded-xl border border-black/5 bg-white text-neutral-600 hover:text-black font-semibold text-xs transition flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>All Splits</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setView("edit_split")}
                className="h-9 px-4 bg-white border border-black/5 hover:bg-neutral-55 text-neutral-900 font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-none transition"
              >
                <Settings2 className="h-4 w-4" />
                <span>Configure Split</span>
              </Button>
              <Button
                variant="ghost"
                onClick={removePlan}
                className="h-9 w-9 p-0 text-rose-500 hover:bg-rose-50 rounded-xl transition flex items-center justify-center border border-transparent hover:border-rose-100"
                title="Delete Split"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Split Detail Title Area */}
          <Card className="p-6 border border-black/5 bg-white shadow-sm rounded-2xl space-y-3">
            <div className="flex justify-between items-start gap-4">
              <div className="space-y-1">
                <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block">Active split program</span>
                <h2 className="text-xl font-black text-black tracking-tight leading-tight">{selectedPlan.name}</h2>
              </div>
              <Badge className="bg-black text-white text-[10px] font-black px-2.5 py-1 shrink-0 rounded-lg">
                {selectedPlan.days.length} Days Block
              </Badge>
            </div>
            {selectedPlan.notes && (
              <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl">{selectedPlan.notes}</p>
            )}
          </Card>

          {/* Horizontal Days Selector timeline */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Select training day</span>
            
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-2 flex-nowrap md:grid md:grid-cols-8 md:overflow-visible md:pb-0">
              {selectedPlan.days.map((day) => {
                const isActive = day.id === activeDayId;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id)}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-xl border text-left transition-all shrink-0 w-[110px] md:w-auto select-none",
                      isActive
                        ? "bg-black text-white border-black shadow-sm"
                        : "bg-white border-black/5 hover:bg-neutral-50 text-neutral-600"
                    )}
                  >
                    <span className={cn("text-[9px] font-extrabold tracking-widest uppercase mb-1", isActive ? "text-neutral-400" : "text-neutral-400")}>
                      Day {day.day + 1}
                    </span>
                    <span className="font-bold text-xs truncate w-full leading-tight">{day.title || `Day ${day.day + 1}`}</span>
                    <span className={cn("text-[9px] font-medium mt-1 truncate w-full block", isActive ? "text-neutral-300" : "text-neutral-400")}>
                      {day.focus || "Recovery"}
                    </span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setActiveDayId("analysis")}
                className={cn(
                  "flex flex-col items-start p-3 rounded-xl border text-left transition-all shrink-0 w-[110px] md:w-auto select-none",
                  activeDayId === "analysis"
                    ? "bg-black text-white border-black shadow-sm"
                    : "bg-white border-black/5 hover:bg-neutral-50 text-neutral-600"
                )}
              >
                <span className="text-[9px] font-extrabold tracking-widest uppercase mb-1">Audit</span>
                <span className="font-bold text-xs truncate w-full leading-tight flex items-center gap-1">
                  <BarChart3 className="h-3.5 w-3.5" />
                  <span>Stimulus</span>
                </span>
                <span className="text-[9px] font-medium mt-1 w-full block">Coverage</span>
              </button>
            </div>
          </div>

          {/* Active day display */}
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
                    
                    {/* Day metadata cards */}
                    <div className="p-5 border border-black/5 bg-white rounded-2xl grid gap-4 sm:grid-cols-3">
                      <div className="space-y-1 sm:col-span-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold bg-neutral-100 text-neutral-700 px-2 py-0.5 rounded-md">Day {activeDay.day + 1}</span>
                          <h3 className="font-extrabold text-sm text-neutral-900">{activeDay.title}</h3>
                        </div>
                        <p className="text-xs text-neutral-400 mt-1">Focus Area: <span className="font-semibold text-neutral-800">{activeDay.focus || "Recovery"}</span></p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block">Target Muscles</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {activeDay.targetMuscles.length ? (
                            activeDay.targetMuscles.map(m => (
                              <Badge key={m} className="bg-neutral-100 text-neutral-700 hover:bg-neutral-100 text-[9px] font-bold py-0.5 px-2">
                                {m}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-neutral-400 italic">Rest/Recovery Day</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Warm-up / Cool-down blocks */}
                    {(activeDay.warmup || activeDay.notes || activeDay.sessionGoal) && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        {activeDay.warmup && (
                          <div className="p-4 border border-black/5 bg-black/[0.01] rounded-2xl space-y-2">
                            <div className="flex items-center gap-1.5 text-neutral-700 border-b border-black/5 pb-1.5">
                              <span className="text-xs">🛠️</span>
                              <h4 className="font-extrabold text-[10px] uppercase tracking-wider">Warm-up Protocol</h4>
                            </div>
                            <ul className="space-y-1 pl-1">
                              {parseProtocolLines(activeDay.warmup).map((line, idx) => (
                                <li key={idx} className="text-xs text-neutral-600 font-medium flex items-start gap-2 leading-relaxed">
                                  <span className="text-neutral-900 mt-0.5 shrink-0">•</span>
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {activeDay.notes && (
                          <div className="p-4 border border-black/5 bg-black/[0.01] rounded-2xl space-y-2">
                            <div className="flex items-center gap-1.5 text-neutral-700 border-b border-black/5 pb-1.5">
                              <span className="text-xs">🧘</span>
                              <h4 className="font-extrabold text-[10px] uppercase tracking-wider">Cool-down stretches</h4>
                            </div>
                            <ul className="space-y-1 pl-1">
                              {parseProtocolLines(activeDay.notes).map((line, idx) => (
                                <li key={idx} className="text-xs text-neutral-600 font-medium flex items-start gap-2 leading-relaxed">
                                  <span className="text-neutral-900 mt-0.5 shrink-0">•</span>
                                  <span>{line}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Planned exercises list */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-black/5 pb-2">
                        <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Planned lift schedule</span>
                        <span className="text-xs font-bold text-neutral-500">{activeDay.items.length} lift{activeDay.items.length !== 1 && "s"} programmed</span>
                      </div>

                      {activeDay.items.length === 0 ? (
                        <div className="p-10 border border-dashed rounded-2xl text-center border-neutral-200 bg-white">
                          <Dumbbell className="h-6 w-6 text-neutral-300 mx-auto mb-2" />
                          <p className="text-xs font-bold text-neutral-500">No exercises programmed for this day.</p>
                          <Button onClick={() => setView("edit_split")} className="mt-3 bg-black text-white hover:bg-neutral-900 text-xs font-bold rounded-xl py-2 px-4">
                            Configure split items
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {visualGroups.map((group, groupIndex) => {
                            if (group.type === "superset") {
                              return (
                                <div key={group.supersetKey || groupIndex} className="bg-purple-500/5 border border-purple-500/10 p-4.5 rounded-2xl space-y-3">
                                  <div className="flex items-center justify-between border-b border-purple-500/10 pb-2">
                                    <div className="flex items-center gap-1.5">
                                      <span className="h-5 w-5 rounded-md bg-purple-505 text-white flex items-center justify-center font-bold text-[9px] tracking-tighter">S</span>
                                      <span className="font-extrabold text-[10px] text-purple-800 uppercase tracking-wider">{group.supersetKey || "Superset"}</span>
                                    </div>
                                    <span className="text-[9px] font-extrabold text-purple-500 uppercase tracking-wider">No rest between lifts</span>
                                  </div>
                                  <div className="space-y-3">
                                    {group.items.map(({ item, originalIndex }) => {
                                      const ex = data.exercises.find((e) => e.id === item.exerciseId);
                                      const tags = getItemTags(item.notes, item.exerciseId, ex?.category, data.exercises).filter(t => t.type !== "superset");
                                      return (
                                        <Card key={item.id} className="p-4 bg-white border border-black/5 shadow-none flex flex-col gap-3 rounded-xl">
                                          <div className="flex items-start justify-between gap-3">
                                            <div className="space-y-1">
                                              <h4 className="font-bold text-xs text-neutral-900 leading-tight">{ex?.name || item.exerciseId}</h4>
                                              <div className="flex flex-wrap gap-1 items-center">
                                                <Badge className="bg-neutral-100 text-neutral-600 text-[9px] border-transparent font-bold py-0 px-1.5 uppercase shrink-0">
                                                  {ex?.category}
                                                </Badge>
                                                {tags.map(t => (
                                                  <Badge key={t.label} className={cn("text-[9px] border-transparent font-bold py-0 px-1.5", t.color)}>
                                                    {t.label}
                                                  </Badge>
                                                ))}
                                              </div>
                                            </div>
                                            <div className="text-right">
                                              <p className="font-black text-xs text-black">{item.sets} × {item.reps}</p>
                                              <p className="text-[9px] font-medium text-neutral-400 mt-0.5">Rest: {item.restSeconds}s</p>
                                            </div>
                                          </div>
                                          {item.notes && (
                                            <p className="text-[10px] text-neutral-500 italic bg-black/[0.01] border-l border-black/10 pl-2 py-0.5">
                                              {item.notes.replace(/TAGS:\s*[^\n\r]+/i, "").trim()}
                                            </p>
                                          )}
                                        </Card>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            }

                            const { item } = group.items[0];
                            const ex = data.exercises.find((e) => e.id === item.exerciseId);
                            const tags = getItemTags(item.notes, item.exerciseId, ex?.category, data.exercises);
                            return (
                              <Card key={item.id} className="p-4 bg-white border border-black/5 hover:bg-neutral-50/20 shadow-none flex flex-col gap-2 rounded-2xl">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="space-y-1.5">
                                    <h4 className="font-extrabold text-sm text-neutral-900 leading-tight">{ex?.name || item.exerciseId}</h4>
                                    <div className="flex flex-wrap gap-1 items-center">
                                      <Badge className="bg-neutral-100 text-neutral-600 text-[9px] border-transparent font-bold py-0.5 px-2 uppercase shrink-0">
                                        {ex?.category}
                                      </Badge>
                                      {tags.map(t => (
                                        <Badge key={t.label} className={cn("text-[9px] border-transparent font-bold py-0.5 px-2", t.color)}>
                                          {t.label}
                                        </Badge>
                                      ))}
                                      {item.prGoal && (
                                        <Badge className="bg-indigo-105 text-indigo-700 hover:bg-indigo-100 text-[9px] font-bold py-0.5 px-2 flex gap-1 items-center">
                                          <Target className="h-3 w-3" />
                                          <span>Goal: {item.prGoal}</span>
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <p className="font-black text-sm text-black">{item.sets} × {item.reps}</p>
                                    <p className="text-[10px] font-medium text-neutral-400 mt-0.5">Rest: {item.restSeconds}s</p>
                                    {(item.targetLoad || item.targetRpe) && (
                                      <p className="text-[10px] font-bold text-neutral-500 mt-0.5 uppercase tracking-wide">
                                        {item.targetLoad} {item.targetRpe && `@ RPE ${item.targetRpe}`}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {item.notes && (
                                  <p className="text-[10px] text-neutral-500 italic bg-black/[0.01] border-l border-black/10 pl-2.5 py-0.5 mt-1 leading-relaxed">
                                    {item.notes.replace(/TAGS:\s*[^\n\r]+/i, "").trim()}
                                  </p>
                                )}
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Historical Workout sessions done for this plan */}
                    <div className="pt-6 border-t border-black/5 space-y-4">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <History className="h-4 w-4" />
                        <span className="text-[11px] font-extrabold uppercase tracking-widest">History for this split</span>
                      </div>
                      
                      {planSessionsHistory.length === 0 ? (
                        <p className="text-xs text-neutral-400 italic">No completed workout history logged for this split yet.</p>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                          {planSessionsHistory.map((s) => (
                            <Card key={s.id} className="p-4 bg-white border border-black/5 hover:bg-neutral-50/40 rounded-2xl flex flex-col justify-between shadow-none relative">
                              <div className="space-y-1.5">
                                <div className="flex justify-between items-start gap-2">
                                  <h4 className="font-extrabold text-xs text-neutral-900 truncate max-w-[80%]">{s.title}</h4>
                                  <Badge className="bg-black/5 text-black/60 text-[9px] font-bold py-0 px-1.5 rounded border-transparent shrink-0">
                                    {s.items.length} lifts
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-neutral-400 font-medium">
                                  {formatDate(s.startedAt)} • {getSessionDurationMin(s.startedAt, s.endedAt)} mins duration
                                </p>
                                {s.notes && (
                                  <p className="text-[11px] text-neutral-500 line-clamp-2 leading-relaxed italic mt-1.5">
                                    {s.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex justify-end gap-1.5 mt-3 pt-2.5 border-t border-black/5">
                                <Button
                                  variant="ghost"
                                  onClick={() => startEditCompletedSession(s)}
                                  className="h-7 rounded-lg text-[10px] px-2.5 font-bold hover:bg-neutral-105 flex items-center gap-1 text-neutral-700"
                                >
                                  <Edit2 className="h-3 w-3" />
                                  <span>Edit Log</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  onClick={() => removeSession(s.id)}
                                  className="h-7 rounded-lg text-[10px] px-2.5 font-bold hover:bg-rose-50 text-rose-500 flex items-center gap-1"
                                >
                                  <Trash2 className="h-3 w-3" />
                                  <span>Delete</span>
                                </Button>
                              </div>
                            </Card>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </div>

          {/* Sticky FAB to Start Day Workout */}
          {activeDayId !== "analysis" && activeDay && activeDay.items.length > 0 && (
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
              <Button
                onClick={startWorkoutSession}
                className="bg-black hover:bg-neutral-900 text-white rounded-full font-black text-xs tracking-wider uppercase py-5 px-6 shadow-2xl flex items-center gap-2 border-2 border-white scale-105 active:scale-95 transition"
              >
                <Play className="h-4 w-4 fill-white" />
                <span>Start {activeDay.title}</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW 3: Form Editor for Split Config                 */}
      {/* ---------------------------------------------------- */}
      {view === "edit_split" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header toolbar */}
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setView("view_split");
                setMessage("");
              }}
              className="h-9 px-3.5 border-black/10 text-neutral-600 hover:text-black font-semibold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Cancel</span>
            </Button>
            
            <div className="flex items-center gap-2">
              {isAutoSaving && (
                <Badge className="bg-emerald-500/10 border-transparent text-emerald-700 text-[10px] font-extrabold flex gap-1.5 items-center px-2 py-1">
                  <Loader2 className="h-3 w-3 animate-spin animate-pulse" />
                  <span>Saving</span>
                </Badge>
              )}
              <Button
                onClick={savePlan}
                disabled={saving}
                className="h-9 px-4.5 bg-black hover:bg-neutral-900 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 transition"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                <span>Save Split</span>
              </Button>
            </div>
          </div>

          <Card className="p-6 border border-black/5 bg-white rounded-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Configure split naming</span>
              <Button
                variant="ghost"
                onClick={() => setIsSplitNameOpen(true)}
                className="h-7 text-[10px] font-bold text-neutral-900 hover:bg-neutral-100 rounded-lg px-2 flex items-center gap-1"
              >
                <Edit2 className="h-3 w-3" />
                <span>Edit Metadata</span>
              </Button>
            </div>
            
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-neutral-900">{selectedPlan.name}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed italic">
                {selectedPlan.notes || "No split description configured. Tap Edit Metadata to update."}
              </p>
            </div>
          </Card>

          {/* Edit day tabs timeline */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Weekly splits layout</span>
              <span className="text-[9px] font-bold text-neutral-400 uppercase tracking-widest">{selectedPlan.days.length} Days Block</span>
            </div>
            
            <div className="flex gap-2.5 overflow-x-auto scrollbar-none pb-2 flex-nowrap md:grid md:grid-cols-9 md:overflow-visible md:pb-0">
              {selectedPlan.days.map((day) => {
                const isActive = day.id === activeDayId;
                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setActiveDayId(day.id)}
                    className={cn(
                      "flex flex-col items-start p-3 rounded-xl border text-left transition-all shrink-0 w-[110px] md:w-auto relative select-none",
                      isActive
                        ? "bg-white text-black border-black/[0.12] shadow-sm font-semibold"
                        : "bg-neutral-100/60 border-transparent hover:bg-neutral-200/50 text-neutral-600"
                    )}
                  >
                    <span className="text-[9px] font-extrabold tracking-widest uppercase mb-0.5 text-neutral-400">
                      Day {day.day + 1}
                    </span>
                    <span className="font-bold text-xs truncate w-full leading-tight">{day.title || `Day ${day.day + 1}`}</span>
                    <span className="text-[9px] font-medium mt-0.5 truncate w-full text-neutral-400 block">
                      {day.focus || "Recovery"}
                    </span>
                    {isActive && (
                      <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-black" />
                    )}
                  </button>
                );
              })}

              {selectedPlan.days.length < 8 && (
                <button
                  type="button"
                  onClick={addDay}
                  className="flex flex-col items-center justify-center p-3 rounded-xl border border-dashed border-black/10 bg-transparent hover:bg-neutral-50 text-neutral-500 transition shrink-0 w-[110px] md:w-auto cursor-pointer"
                >
                  <Plus className="h-4 w-4 mb-0.5" />
                  <span className="font-bold text-xs">Add Day</span>
                </button>
              )}
            </div>
          </div>

          {/* Active day configured items */}
          {activeDay && (
            <div className="space-y-6">
              
              {/* Day details toolbar */}
              <div className="p-5 border border-black/5 bg-white rounded-2xl flex flex-wrap justify-between items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold bg-neutral-100 px-2 py-0.5 rounded text-neutral-700">Day {activeDay.day + 1}</span>
                    <h3 className="font-extrabold text-sm text-neutral-900">{activeDay.title}</h3>
                  </div>
                  <p className="text-xs text-neutral-400">Focus: <span className="font-semibold text-neutral-700">{activeDay.focus || "Recovery"}</span></p>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDayOpen(true)}
                    className="h-8 rounded-xl text-xs font-bold border-black/5 hover:bg-neutral-100 flex items-center gap-1"
                  >
                    <Settings2 className="h-3.5 w-3.5" />
                    <span>Day Settings</span>
                  </Button>
                  
                  {selectedPlan.days.length > 1 && (
                    <Button
                      variant="ghost"
                      onClick={() => removeDay(activeDay.id)}
                      className="h-8 text-xs font-bold text-rose-500 hover:bg-rose-50 rounded-xl px-2.5 flex items-center gap-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Remove Day</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Programmed Lift items in compact drag/drop list */}
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Configure lift order</span>
                  <span className="text-xs font-bold text-neutral-500">{activeDay.items.length} lift{activeDay.items.length !== 1 && "s"} programmed</span>
                </div>

                {activeDay.items.length === 0 ? (
                  <div className="p-10 border border-dashed rounded-2xl text-center border-neutral-200 bg-white">
                    <ClipboardList className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                    <p className="text-xs font-bold text-neutral-500">No lifts programmed for Day {activeDay.day + 1}.</p>
                    <p className="text-[10px] text-neutral-400 mt-1 max-w-xs mx-auto text-center">Click the Add Lifts buttons below to establish your routine.</p>
                  </div>
                ) : (
                  <div className="border border-black/[0.04] bg-white rounded-2xl divide-y divide-black/[0.04] shadow-[0_4px_16px_rgba(0,0,0,0.01)] overflow-hidden">
                    {activeDay.items.map((item, idx) => {
                      const ex = data.exercises.find(e => e.id === item.exerciseId);
                      const isSuperset = (item.notes || "").toLowerCase().includes("superset");
                      return (
                        <div key={item.id} className={cn("p-4 flex items-center justify-between gap-4 bg-white hover:bg-neutral-50/20 transition", isSuperset && "bg-purple-500/[0.01]")}>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              disabled={idx === 0}
                              onClick={() => moveExercise("up", idx)}
                              className="h-7 w-7 p-0 hover:bg-neutral-105 rounded-lg text-neutral-400 disabled:opacity-30"
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              disabled={idx === activeDay.items.length - 1}
                              onClick={() => moveExercise("down", idx)}
                              className="h-7 w-7 p-0 hover:bg-neutral-105 rounded-lg text-neutral-400 disabled:opacity-30"
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="flex-1 min-w-0" onClick={() => openEditExerciseDialog(idx)}>
                            <div className="flex items-center gap-2">
                              <h4 className="font-extrabold text-sm text-neutral-900 truncate hover:text-black cursor-pointer">{ex?.name || item.exerciseId}</h4>
                              {isSuperset && (
                                <Badge className="bg-purple-105 text-purple-700 text-[8px] font-black border-transparent uppercase px-1 py-0 rounded">Superset</Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-1 font-bold">
                              {item.sets} sets × {item.reps} reps • {item.restSeconds}s rest
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              onClick={() => openEditExerciseDialog(idx)}
                              className="h-8 w-8 p-0 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg flex items-center justify-center border-none shadow-none"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              onClick={() => deleteExerciseItem(idx)}
                              className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-lg flex items-center justify-center"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Adding buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    type="button"
                    onClick={() => {
                      setSearchExerciseQuery("");
                      setIsExercisePickerOpen(true);
                    }}
                    className="border border-dashed border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 py-6 rounded-2xl font-bold text-xs shadow-none flex items-center justify-center gap-1.5 transition"
                  >
                    <PlusCircle className="h-4.5 w-4.5 text-neutral-400" />
                    <span>Add Single Exercise</span>
                  </Button>
                  <Button 
                    type="button"
                    onClick={() => {
                      if (data.exercises.length >= 2) {
                        setSupersetExercises([data.exercises[0].id, data.exercises[1].id]);
                      } else {
                        setSupersetExercises([data.exercises[0]?.id || "", data.exercises[0]?.id || ""]);
                      }
                      setSupersetModalOpen(true);
                    }}
                    className="border border-dashed border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-900 py-6 rounded-2xl font-bold text-xs shadow-none flex items-center justify-center gap-1.5 transition"
                  >
                    <PlusCircle className="h-4.5 w-4.5 text-neutral-400" />
                    <span>Create Superset</span>
                  </Button>
                </div>
              </div>
            </div>
          )}

          {message && (
            <div className="p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 text-xs font-semibold text-center flex items-center justify-center gap-2">
              <Check className="h-4 w-4" />
              <span>{message}</span>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW 4: Active Workout Session Logging view          */}
      {/* ---------------------------------------------------- */}
      {(view === "log_workout" && draftSession) && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Panel */}
          <div className="rounded-3xl bg-neutral-950 p-6 text-white space-y-4 shadow-xl border border-neutral-800 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.04),transparent_50%)]" />
            <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Session Live</span>
                </span>
                <h1 className="text-xl font-black tracking-tight">{draftSession.title}</h1>
              </div>

              {/* Timer Stopwatch */}
              <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-2xl py-2 px-3.5">
                <Clock className="h-4 w-4 text-neutral-400" />
                <span className="text-sm font-black tabular-nums tracking-tight text-neutral-200">{formattedElapsedTime}</span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-neutral-800 pt-4 relative z-10">
              <Button
                variant="ghost"
                onClick={() => {
                  if (confirm("Are you sure you want to cancel the active workout session? All logged sets will be discarded.")) {
                    setDraftSession(null);
                    setRestTimerSecondsLeft(null);
                    setView("view_split");
                  }
                }}
                className="h-8 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-905 px-3 text-xs font-semibold"
              >
                Discard Session
              </Button>
              <Button
                onClick={saveWorkoutSession}
                disabled={saving || !draftSession.items?.length}
                className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs rounded-xl h-8 px-4 border-none shadow-none flex items-center gap-1"
              >
                {saving ? <Loader2 className="h-3 w-3 animate-spin text-black" /> : <Check className="h-3 w-3 text-black" />}
                <span>Finish Session</span>
              </Button>
            </div>
          </div>

          {/* Global Qualitative Logging Panel */}
          <Card className="p-5 border border-black/5 bg-white rounded-2xl space-y-4">
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Session details</span>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Session Title</label>
                <Input
                  value={draftSession.title || ""}
                  onChange={(e) => setDraftSession(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-white border-black/5 rounded-xl text-xs font-bold"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Readiness / RPE Rating (1-10)</label>
                <Input
                  value={draftSession.effort || ""}
                  onChange={(e) => setDraftSession(prev => ({ ...prev, effort: e.target.value }))}
                  placeholder="How strong did you feel? RPE 8..."
                  className="bg-white border-black/5 rounded-xl text-xs font-bold"
                />
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Workout Notes</label>
              <Textarea
                value={draftSession.notes || ""}
                onChange={(e) => setDraftSession(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Sleep, fatigue, nutrition, overall session outcomes..."
                className="bg-white border-black/5 rounded-xl text-xs min-h-[50px] font-medium"
              />
            </div>
          </Card>

          {/* Exercises Checklist */}
          <div className="space-y-3">
            <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Exercise list</span>
            
            <div className="border border-black/[0.04] bg-white rounded-2xl divide-y divide-black/[0.04] shadow-[0_4px_16px_rgba(0,0,0,0.015)] overflow-hidden">
              {(draftSession.items || []).map((item, index) => {
                const totalSets = item.sets.length;
                const completedSets = item.sets.filter(s => (s as any).completed).length;
                const allCompleted = totalSets > 0 && completedSets === totalSets;
                
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveExerciseIndex(index);
                      setView("log_exercise");
                    }}
                    className="p-4.5 flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition group"
                  >
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-neutral-900 group-hover:text-black">{item.exerciseName}</h4>
                      <p className="text-[10px] text-neutral-400 mt-1 font-semibold uppercase tracking-wide">
                        Prescribed: {item.plannedSets} × {item.reps} • {item.restSeconds}s rest
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-neutral-700">{completedSets}/{totalSets} sets</span>
                        <span className="text-[9px] font-medium text-neutral-400">Logged</span>
                      </div>
                      
                      {allCompleted ? (
                        <div className="h-6 w-6 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 font-bold" />
                        </div>
                      ) : (
                        <div className="h-6 w-6 rounded-full border border-black/10 text-neutral-300 flex items-center justify-center" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {sessionSavingStatus && (
            <div className="p-3.5 rounded-xl border border-rose-500/15 bg-rose-50 text-rose-600 text-xs font-medium text-center">
              {sessionSavingStatus}
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* VIEW 5: Single Exercise outcome logger               */}
      {/* ---------------------------------------------------- */}
      {(view === "log_exercise" && draftSession && activeExerciseIndex !== null) && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Header Panel */}
          <div className="flex items-center justify-between border-b border-black/5 pb-3">
            <Button
              variant="ghost"
              onClick={() => {
                setView("log_workout");
                setActiveExerciseIndex(null);
              }}
              className="h-9 px-3 rounded-xl border border-black/5 bg-white text-neutral-600 hover:text-black font-semibold text-xs transition flex items-center gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Session Overview</span>
            </Button>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Log workout details</span>
            </div>
          </div>

          {/* Exercise Info Card */}
          {(() => {
            const item = draftSession.items?.[activeExerciseIndex];
            if (!item) return null;
            const ex = data.exercises.find(e => e.id === item.exerciseId);
            return (
              <Card className="p-5 border border-black/5 bg-white rounded-2xl space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">Exercise {activeExerciseIndex + 1}</span>
                    <h2 className="text-lg font-black text-neutral-900 leading-tight">{item.exerciseName}</h2>
                    <Badge className="bg-neutral-100 text-neutral-700 hover:bg-neutral-100 text-[9px] border-transparent font-bold py-0.5 px-2 uppercase shrink-0">
                      {ex?.category}
                    </Badge>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[9px] font-extrabold text-neutral-400 uppercase tracking-widest block">Prescription</span>
                    <span className="text-sm font-black text-black block mt-0.5">{item.plannedSets} × {item.reps}</span>
                    <span className="text-[10px] font-semibold text-neutral-500 block mt-0.5">{item.restSeconds}s rest</span>
                  </div>
                </div>

                {/* Target load / RPE stats */}
                <div className="grid gap-2 grid-cols-2 p-3 bg-neutral-50 rounded-xl text-xs font-semibold text-neutral-600">
                  <div>Target Load: <span className="text-neutral-900 font-extrabold">{item.targetLoad || "Moderate"}</span></div>
                  <div>Target RPE: <span className="text-neutral-900 font-extrabold">{item.targetRpe ? `RPE ${item.targetRpe}` : "N/A"}</span></div>
                </div>

                {item.notes && (
                  <p className="text-[11px] text-neutral-500 italic bg-black/[0.01] border-l border-black/10 pl-3.5 py-0.5 leading-relaxed">
                    {item.notes.replace(/TAGS:\s*[^\n\r]+/i, "").trim()}
                  </p>
                )}
              </Card>
            );
          })()}

          {/* Sets Outcome Table */}
          {(() => {
            const item = draftSession.items?.[activeExerciseIndex];
            if (!item) return null;
            return (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-black/5 pb-2">
                  <span className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest block">Log exercise sets</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addSessionSet(activeExerciseIndex)}
                    className="h-7 text-[10px] font-bold border-black/5 hover:bg-neutral-100 rounded-lg px-2.5 flex items-center gap-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Set</span>
                  </Button>
                </div>

                <div className="space-y-3">
                  {(item.sets || []).map((set, sIdx) => {
                    const isCompleted = Boolean((set as any).completed);
                    return (
                      <div key={sIdx} className={cn("p-3 rounded-2xl border flex items-center gap-3 transition", isCompleted ? "bg-emerald-500/5 border-emerald-500/20" : "bg-white border-black/5")}>
                        
                        {/* Set Number */}
                        <div className={cn("h-7 w-7 rounded-lg text-[10px] font-black shrink-0 flex items-center justify-center", isCompleted ? "bg-emerald-500 text-white" : "bg-neutral-100 text-neutral-500")}>
                          {sIdx + 1}
                        </div>

                        {/* Inputs */}
                        <div className="grid flex-1 grid-cols-2 gap-2">
                          <div className="relative flex items-center">
                            <Input
                              value={set.weight}
                              placeholder="Load"
                              disabled={isCompleted}
                              onChange={(e) => updateSessionSetInput(activeExerciseIndex, sIdx, "weight", e.target.value)}
                              className="h-10 bg-white border-black/5 focus:border-black rounded-xl text-xs font-bold text-center pl-2 pr-6 disabled:bg-neutral-50 disabled:opacity-75"
                            />
                            <span className="absolute right-2 text-[8px] font-extrabold text-neutral-400 select-none pointer-events-none">KG</span>
                          </div>
                          <div className="relative flex items-center">
                            <Input
                              value={set.reps}
                              placeholder="Reps"
                              disabled={isCompleted}
                              onChange={(e) => updateSessionSetInput(activeExerciseIndex, sIdx, "reps", e.target.value)}
                              className="h-10 bg-white border-black/5 focus:border-black rounded-xl text-xs font-bold text-center pl-2 pr-7 disabled:bg-neutral-50 disabled:opacity-75"
                            />
                            <span className="absolute right-2 text-[8px] font-extrabold text-neutral-400 select-none pointer-events-none">REPS</span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            variant="ghost"
                            onClick={() => toggleSetCompleted(activeExerciseIndex, sIdx)}
                            className={cn("h-8 w-8 p-0 rounded-xl flex items-center justify-center transition border border-transparent", isCompleted ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-neutral-55 hover:bg-neutral-100 text-neutral-400 border-black/5")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            onClick={() => removeSessionSet(activeExerciseIndex, sIdx)}
                            className="h-8 w-8 p-0 text-rose-500 hover:bg-rose-50 rounded-xl flex items-center justify-center"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* PERSISTENT FLOATING REST TIMER BANNER                */}
      {/* ---------------------------------------------------- */}
      {renderRestTimer()}

      {/* ---------------------------------------------------- */}
      {/* DIALOG: Edit Split Name / Notes                      */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isEditSplitNameOpen} onOpenChange={setIsSplitNameOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-neutral-900">Edit Split Metadata</DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">Configure weekly splits details.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Split Name</label>
              <Input
                value={selectedPlan.name}
                onChange={(e) => patchSelectedPlan((plan) => ({ ...plan, name: e.target.value }))}
                placeholder="e.g. Upper/Lower Weekly Block"
                className="bg-white border-black/5 focus:border-black rounded-xl text-xs font-semibold"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Split Description / Notes</label>
              <Textarea
                value={selectedPlan.notes}
                onChange={(e) => patchSelectedPlan((plan) => ({ ...plan, notes: e.target.value }))}
                placeholder="e.g. Focus on strength building with progressive overload"
                className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[80px]"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-black/5 mt-4">
            <Button onClick={() => setIsSplitNameOpen(false)} className="bg-black hover:bg-neutral-900 text-white rounded-xl font-bold text-xs">
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* DIALOG: Edit Day Meta Settings                       */}
      {/* ---------------------------------------------------- */}
      {activeDay && (
        <Dialog open={isEditDayOpen} onOpenChange={setIsEditDayOpen}>
          <DialogContent className="max-w-lg rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-neutral-900">Day Config Settings</DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">Customize title focus and warmup/cooldown details.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Day Title</label>
                  <Input
                    value={activeDay.title}
                    onChange={(e) => updateDay(activeDay.id, (day) => ({ ...day, title: e.target.value }))}
                    className="bg-white border-black/5 focus:border-black rounded-xl text-xs font-semibold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Focus Target Area</label>
                  <Input
                    value={activeDay.focus}
                    onChange={(e) => updateDay(activeDay.id, (day) => ({ ...day, focus: e.target.value }))}
                    className="bg-white border-black/5 focus:border-black rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Target Muscles</label>
                <div className="flex flex-wrap gap-1.5">
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
                          updateDay(activeDay.id, (day) => ({ ...day, targetMuscles: next }));
                        }}
                        className={cn(
                          "rounded-xl px-3 py-1.5 text-[10px] font-bold border transition",
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

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Warm-up Protocol</label>
                <Textarea
                  value={activeDay.warmup}
                  onChange={(e) => updateDay(activeDay.id, (day) => ({ ...day, warmup: e.target.value }))}
                  placeholder="Activation sets, rotational complexes, band protocols..."
                  className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[80px]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400">Cool-down & Stretches</label>
                <Textarea
                  value={activeDay.notes}
                  onChange={(e) => updateDay(activeDay.id, (day) => ({ ...day, notes: e.target.value }))}
                  placeholder="Stretches, release holds, decompression protocols..."
                  className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[80px]"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t border-black/5 mt-4">
              <Button onClick={() => setIsEditDayOpen(false)} className="bg-black hover:bg-neutral-900 text-white rounded-xl font-bold text-xs">
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ---------------------------------------------------- */}
      {/* DIALOG: Edit Planned Exercise details                */}
      {/* ---------------------------------------------------- */}
      {activeDay && editingExerciseIndex !== null && activeDay.items[editingExerciseIndex] && (
        <Dialog open={isEditingExerciseOpen} onOpenChange={setIsEditingExerciseOpen}>
          <DialogContent className="max-w-md rounded-2xl p-6 bg-white max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-extrabold text-neutral-900">Configure Lift Parameters</DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">Set sets, reps, rest, target loads, and coaching notes.</DialogDescription>
            </DialogHeader>
            {(() => {
              const item = activeDay.items[editingExerciseIndex];
              const customTags = getCustomTagsFromNotes(item.notes);
              
              return (
                <div className="space-y-4 py-3">
                  
                  {/* Select exercise */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Exercise</label>
                    <Combobox
                      options={exerciseOptions}
                      value={item.exerciseId}
                      onValueChange={(val) => updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, exerciseId: val }))}
                      placeholder="Select exercise..."
                    />
                  </div>

                  <div className="grid gap-3 grid-cols-3">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Sets</label>
                      <Select
                        value={String(item.sets)}
                        onValueChange={(val) => updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, sets: Number(val) }))}
                      >
                        <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-semibold py-4">
                          <SelectValue placeholder="Sets" />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                            <SelectItem key={s} value={String(s)}>
                              {s} Sets
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Reps Bracket</label>
                      <Select
                        value={item.reps}
                        onValueChange={(val) => updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, reps: val }))}
                      >
                        <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-semibold py-4">
                          <SelectValue placeholder="Reps" />
                        </SelectTrigger>
                        <SelectContent>
                          {["5", "6-8", "8-10", "8-12", "10-12", "12-15", "15", "20", "Max"].map((r) => (
                            <SelectItem key={r} value={r}>
                              {r} Reps
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Rest Seconds</label>
                      <Select
                        value={String(item.restSeconds)}
                        onValueChange={(val) => updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, restSeconds: Number(val) }))}
                      >
                        <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-semibold py-4">
                          <SelectValue placeholder="Rest" />
                        </SelectTrigger>
                        <SelectContent>
                          {[
                            { value: "30", label: "30s" },
                            { value: "45", label: "45s" },
                            { value: "60", label: "60s" },
                            { value: "90", label: "90s (1.5m)" },
                            { value: "120", label: "120s (2m)" },
                            { value: "180", label: "180s (3m)" },
                          ].map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-3 grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Target Load</label>
                      <Select
                        value={item.targetLoad}
                        onValueChange={(val) => updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, targetLoad: val }))}
                      >
                        <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-semibold py-4">
                          <SelectValue placeholder="Load" />
                        </SelectTrigger>
                        <SelectContent>
                          {["Heavy", "Moderate", "Light", "Bodyweight", "Weighted", "Low"].map((ld) => (
                            <SelectItem key={ld} value={ld}>
                              {ld}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Target RPE Intensity</label>
                      <Select
                        value={item.targetRpe}
                        onValueChange={(val) => updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, targetRpe: val }))}
                      >
                        <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-semibold py-4">
                          <SelectValue placeholder="RPE" />
                        </SelectTrigger>
                        <SelectContent>
                          {["6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10"].map((rpe) => (
                            <SelectItem key={rpe} value={rpe}>
                              RPE {rpe}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">PR Target Goal</label>
                    <Input
                      value={item.prGoal}
                      onChange={(e) => updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, prGoal: e.target.value }))}
                      placeholder="e.g. 100kg x 8 reps"
                      className="bg-white border-black/5 focus:border-black rounded-xl text-xs font-semibold"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Coaching Setup Notes</label>
                    <Textarea
                      value={(item.notes || "").replace(/TAGS:\s*[^\n\r]+/i, "").trim()}
                      onChange={(e) => {
                        const cleanNotes = e.target.value;
                        const nextNotes = setCustomTagsInNotes(cleanNotes, customTags);
                        updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, notes: nextNotes }));
                      }}
                      placeholder="Technique cues, machine setups, tempos..."
                      className="bg-white border-black/5 focus:border-black rounded-xl text-xs min-h-[60px]"
                    />
                  </div>

                  {/* Custom badges */}
                  <div className="space-y-2 border-t border-black/5 pt-3">
                    <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Custom Tags</label>
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {customTags.map((tag) => (
                        <Badge key={tag} className="bg-neutral-100 text-neutral-700 hover:bg-neutral-100 text-[9px] border-transparent font-bold py-0.5 px-2 flex items-center gap-1">
                          <span>{tag.toUpperCase()}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const next = customTags.filter(t => t.toLowerCase() !== tag.toLowerCase());
                              const nextNotes = setCustomTagsInNotes(item.notes, next);
                              updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, notes: nextNotes }));
                            }}
                            className="hover:text-rose-500 font-bold ml-1"
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                      
                      <div className="flex gap-1.5 items-center">
                        <Input
                          value={newTagInputValue}
                          onChange={(e) => setNewTagInputValue(e.target.value)}
                          placeholder="Add custom tag"
                          className="h-7 w-28 bg-white border-black/5 rounded-lg text-[9px] py-1 px-2 font-bold uppercase"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const clean = newTagInputValue.trim();
                              if (clean) {
                                const next = [...customTags, clean];
                                const nextNotes = setCustomTagsInNotes(item.notes, next);
                                updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, notes: nextNotes }));
                                setNewTagInputValue("");
                              }
                            }
                          }}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const clean = newTagInputValue.trim();
                            if (clean) {
                              const next = [...customTags, clean];
                              const nextNotes = setCustomTagsInNotes(item.notes, next);
                              updateItem(activeDay.id, editingExerciseIndex, (entry) => ({ ...entry, notes: nextNotes }));
                              setNewTagInputValue("");
                            }
                          }}
                          className="h-7 rounded-lg text-[9px] font-bold border border-black/5 bg-neutral-50 px-2"
                        >
                          Add
                        </Button>
                      </div>
                    </div>
                  </div>

                </div>
              );
            })()}
            <div className="flex justify-end gap-2 pt-4 border-t border-black/5 mt-4">
              <Button onClick={() => setIsEditingExerciseOpen(false)} className="bg-black hover:bg-neutral-900 text-white rounded-xl font-bold text-xs">
                Done
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ---------------------------------------------------- */}
      {/* DIALOG: Exercise Picker for adding lifts             */}
      {/* ---------------------------------------------------- */}
      <Dialog open={isExercisePickerOpen} onOpenChange={setIsExercisePickerOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle className="font-extrabold text-neutral-900">Add Exercise Lift</DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">Search and select an exercise from the database.</DialogDescription>
          </DialogHeader>
          
          <div className="py-2 shrink-0">
            <Input
              value={searchExerciseQuery}
              onChange={(e) => setSearchExerciseQuery(e.target.value)}
              placeholder="Search by name, category, muscle..."
              className="bg-white border-black/5 focus:border-black rounded-xl text-xs font-semibold h-10 px-4"
            />
          </div>

          <ScrollArea className="flex-1 min-h-[300px] border border-black/5 rounded-xl p-2 bg-neutral-50">
            <div className="space-y-1">
              {filteredExercisesList.length === 0 ? (
                <p className="text-xs text-neutral-400 italic text-center p-8">No matching exercises found.</p>
              ) : (
                filteredExercisesList.map((ex) => (
                  <div
                    key={ex.id}
                    onClick={() => selectAndAddExercise(ex.id)}
                    className="p-3 rounded-lg hover:bg-white hover:shadow-sm border border-transparent hover:border-black/5 transition cursor-pointer flex justify-between items-center"
                  >
                    <div>
                      <p className="font-bold text-xs text-neutral-900 leading-tight">{ex.name}</p>
                      <p className="text-[9px] text-neutral-400 mt-1 font-semibold uppercase">{ex.category} • {ex.primaryMuscles.join(", ")}</p>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ---------------------------------------------------- */}
      {/* DIALOG: Superset Creator                             */}
      {/* ---------------------------------------------------- */}
      <Dialog open={supersetModalOpen} onOpenChange={setSupersetModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-neutral-900">Create Superset Pair</DialogTitle>
            <DialogDescription className="text-xs text-neutral-400">Select two exercises to perform back-to-back with no rest.</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Exercise A (Primary)</label>
              <Select
                value={supersetExercises[0]}
                onValueChange={(val) => setSupersetExercises(prev => [val, prev[1]])}
              >
                <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-semibold py-4">
                  <SelectValue placeholder="Select exercise A" />
                </SelectTrigger>
                <SelectContent>
                  {data.exercises.map(ex => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Exercise B (Superset Outcome)</label>
              <Select
                value={supersetExercises[1]}
                onValueChange={(val) => setSupersetExercises(prev => [prev[0], val])}
              >
                <SelectTrigger className="w-full bg-white border-black/5 rounded-xl text-xs font-semibold py-4">
                  <SelectValue placeholder="Select exercise B" />
                </SelectTrigger>
                <SelectContent>
                  {data.exercises.map(ex => (
                    <SelectItem key={ex.id} value={ex.id}>{ex.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-black/5 mt-4">
            <Button
              onClick={createSuperset}
              disabled={!supersetExercises[0] || !supersetExercises[1]}
              className="bg-black hover:bg-neutral-900 text-white rounded-xl font-bold text-xs py-2.5 w-full"
            >
              Link Superset
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
