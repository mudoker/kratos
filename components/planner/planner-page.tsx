"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { 
  Plus, Trash2, Loader2, Dumbbell, Sparkles, Clock, Target, 
  CalendarDays, Play, ChevronRight, CheckCircle2, History,
  TrendingUp, Award, Calendar, AlertCircle, Info, X, Edit3, ClipboardList
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { WeeklyPlan, WeeklyPlanDay, WeeklyPlanItem, WorkoutSession, WorkoutSessionItem, WorkoutSet } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlanAnalysis } from "./plan-analysis";
import { useData } from "@/components/shared/data-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

  // States for active operations (to be fully fleshed out in subsequent commits)
  const [isEditingSplit, setIsEditingSplit] = useState(false);
  const [activeDraftPlan, setActiveDraftPlan] = useState<WeeklyPlan | null>(null);
  const [draftSession, setDraftSession] = useState<Partial<WorkoutSession> | null>(null);

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
    // Temp navigation placeholder for active session logger view
    alert("Starting Quick Workout! Logging features will be enabled in the logger commit.");
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
    // Temp navigation placeholder for active session logger view
    alert(`Starting ${plan.name} - ${day.title}! Logging features will be enabled in the logger commit.`);
  };

  if (!isClient) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

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
