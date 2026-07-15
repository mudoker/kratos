"use client";

import { useEffect, useMemo, useState } from "react";
import { 
  Plus, Trash2, Loader2, Dumbbell, Sparkles, Clock, Target, 
  CalendarDays, Play, ChevronRight, CheckCircle2, History,
  Award, Calendar, AlertCircle, Info, X, Edit3, ClipboardList,
  Save, ArrowLeft, RotateCcw, Volume2, VolumeX, Timer, Check, Minus, PlusCircle,
  Pause, Search, Copy
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { WeeklyPlan, WeeklyPlanDay, WeeklyPlanItem, WorkoutSession, WorkoutSessionItem, WorkoutSet } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PlanAnalysis } from "./plan-analysis";
import { useData } from "@/components/shared/data-provider";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const randomId = () => Math.random().toString(36).substring(2, 15);
const createDraftId = () => `draft_${randomId()}`;
const isPersistedId = (id: string) => Boolean(id) && !id.startsWith("draft_");

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

export function PlannerPage() {
  const data = useData();
  const router = useRouter();

  // Navigation tab: "plans" (Manage templates), "session" (Resume/Start workout), "history" (Past logs)
  const [activeTab, setActiveTab] = useState<"plans" | "session" | "history">("session");
  const [plans, setPlans] = useState<WeeklyPlan[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  
  // Search and Sort states for Plans
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"alphabetical" | "edited" | "exercises">("edited");

  // Viewing details modal
  const [viewingPlan, setViewingPlan] = useState<WeeklyPlan | null>(null);
  const [viewingSession, setViewingSession] = useState<WorkoutSession | null>(null);
  const [deletingPlanId, setDeletingPlanId] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);

  // States for active operations (to be fleshed out in subsequent commits)
  const [isEditingSplit, setIsEditingSplit] = useState(false);
  const [activeDraftPlan, setActiveDraftPlan] = useState<WeeklyPlan | null>(null);
  const [draftSession, setDraftSession] = useState<Partial<WorkoutSession> | null>(null);

  const [saving, setSaving] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setPlans(data.plans || []);
    setSessions(data.sessions || []);
    
    // Check if active session exists in localStorage (autosave restore)
    const saved = localStorage.getItem("kratos_active_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setDraftSession(parsed);
      } catch (e) {
        console.warn("Could not restore active session", e);
      }
    }
  }, [data.plans, data.sessions]);

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

  // Filtered and Sorted Plans List
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
    // Recently edited (default)
    return [...list].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [plans, searchQuery, sortBy]);

  if (!isClient) {
    return (
      <div className="flex h-[50vh] items-center justify-center bg-[#0D0D0D]">
        <Loader2 className="h-8 w-8 animate-spin text-[#4F8CFF]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] text-white -mx-3 -mb-24 p-4 lg:-mx-4 lg:-mb-8 space-y-6">
      
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
                  const totalExercises = plan.days.reduce((acc, d) => acc + d.items.length, 0);
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
            {/* Quick start new empty session */}
            <Card 
              onClick={() => alert("Quick start empty session details will be built in active session logs.")}
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

            {/* Start Session from template selection */}
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
                          onClick={() => alert(`Starting ${plan.name} • ${day.title}`)}
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
