"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { 
  Activity, 
  BrainCircuit, 
  CalendarClock, 
  Trophy, 
  Flame, 
  ChevronDown, 
  ChevronRight, 
  LayoutList, 
  GripVertical, 
  FileDown,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import type { BodyHighlightSlug, WeeklyPlan } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { MetricTile } from "@/components/shared/metric-tile";
import { MuscleMap } from "@/components/shared/muscle-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { GlowCard } from "@/components/ui/glow-card";
import { TextGenerate } from "@/components/ui/text-generate";
import { WorkoutHeatmap } from "./workout-heatmap";
import { DashboardCharts } from "./dashboard-charts";
import { useData } from "@/components/shared/data-provider";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function DashboardPage() {
  const data = useData();
  const router = useRouter();
  
  const [plans, setPlans] = useState<WeeklyPlan[]>(data.plans);
  const [selectedPlanId, setSelectedPlanId] = useState(data.plans[0]?.id || "");
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Record<string, boolean>>({
    [data.plans[0]?.id || ""]: true
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  useEffect(() => {
    setPlans(data.plans);
  }, [data.plans]);

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const initialOrderIds = data.plans.map(p => p.id).join(",");
    const currentOrderIds = plans.map(p => p.id).join(",");
    
    if (initialOrderIds === currentOrderIds) return;

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(async () => {
      setIsAutoSaving(true);
      try {
        const updates = plans.map((p, idx) => ({
          ...p,
          orderIndex: idx
        }));
        
        for (const p of updates) {
          await fetch("/api/plans", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          });
        }
        router.refresh();
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setIsAutoSaving(false);
      }
    }, 800);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [plans, data.plans, router]);

  const togglePlan = (id: string) => {
    setExpandedPlans(prev => ({ ...prev, [id]: !prev[id] }));
    setSelectedPlanId(id);
  };

  const activePlan = useMemo(() => 
    plans.find(p => p.id === selectedPlanId) || plans[0], 
  [plans, selectedPlanId]);

  const recentSession = data.sessions[0];

  const muscleIntensities = useMemo(() => {
    const frequency: Record<string, number> = {};
    if (!activePlan) return [];

    activePlan.days.forEach((day) => {
      day.items.forEach((item) => {
        const exercise = data.exercises.find((e) => e.id === item.exerciseId);
        if (!exercise) return;
        
        exercise.bodyRegionSlugs.forEach((slug, idx) => {
          // BIOLOGICAL STIMULUS WEIGHTING:
          // Primary movers (first 2 slugs) get 100% credit.
          // Secondary movers get 20% credit (correcting the "ghost volume" trap).
          const weight = idx < 2 ? 1.0 : 0.2;
          frequency[slug] = (frequency[slug] || 0) + (item.sets * weight);
        });
      });
    });

    return Object.entries(frequency).map(([slug, weightedSets]) => {
      // ABSOLUTE THRESHOLD SCALING (Abandoning the "Relative Peak" fallacy):
      // 4/4 (Red): 14+ weighted sets (Max Stimulus)
      // 3/4 (Orange): 10-13 weighted sets (High Stimulus)
      // 2/4 (Yellow): 5-9 weighted sets (Moderate Stimulus)
      // 1/4 (Green): 1-4 weighted sets (Maintenance)
      let intensity = 1;
      if (weightedSets >= 14) intensity = 4;
      else if (weightedSets >= 10) intensity = 3;
      else if (weightedSets >= 5) intensity = 2;
      
      return {
        slug: slug as BodyHighlightSlug,
        intensity
      };
    });
  }, [activePlan, data.exercises]);

  const exportPlanToMarkdown = (plan: WeeklyPlan) => {
    let md = `# ${plan.name}\n\n`;
    md += `**Notes:** ${plan.notes || "None"}\n\n`;
    md += `**Last Updated:** ${formatDate(plan.updatedAt)}\n\n---\n\n`;

    plan.days.forEach(day => {
      md += `## ${day.title}\n`;
      md += `**Focus:** ${day.focus || "Recovery"}\n`;
      if (day.warmup) md += `**Warm-up:** ${day.warmup}\n`;
      if (day.sessionGoal) md += `**Session Goal:** ${day.sessionGoal}\n`;
      md += `\n| Exercise | Sets | Reps | Rest | Load/RPE | Notes |\n`;
      md += `| :--- | :---: | :---: | :---: | :---: | :--- |\n`;
      
      day.items.forEach(item => {
        const exercise = data.exercises.find(e => e.id === item.exerciseId);
        const name = exercise?.name || item.exerciseId;
        md += `| ${name} | ${item.sets} | ${item.reps} | ${item.restSeconds}s | ${item.targetLoad || "-"}/${item.targetRpe || "-"} | ${item.notes || "-"} |\n`;
      });
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${plan.name.replace(/\s+/g, "_")}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-transparent bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(230,230,230,0.9))] p-7 md:p-10">
        <PageHeader
          eyebrow="Command Deck"
          title={<TextGenerate text={`Welcome back, ${data.user.name.split(" ")[0]}.`} />}
          description="Track the current week across plans, PRs, completed sessions, and your real coach conversation history."
        />
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricTile
          label="Weekly target"
          value={data.profile.weeklySessions ? `${data.profile.weeklySessions} sessions` : "Not set"}
          detail={data.profile.goal ? `Goal: ${data.profile.goal}` : "Add your training goal in Settings."}
          icon={<CalendarClock className="h-5 w-5 text-[color:var(--brand)]" />}
        />
        <MetricTile
          label="Saved plans"
          value={`${data.plans.length}`}
          detail={activePlan ? `Latest update ${formatDate(activePlan.updatedAt)}` : "Create your first structured split."}
          icon={<Activity className="h-5 w-5 text-[color:var(--support)]" />}
        />
        <MetricTile
          label="PR board"
          value={`${data.records.length}`}
          detail={data.records[0] ? `Latest record ${formatDate(data.records[0].achievedAt)}` : "No personal records logged yet."}
          icon={<Trophy className="h-5 w-5 text-[color:var(--brand)]" />}
        />
        <MetricTile
          label="Coach memory"
          value={`${data.coachMessages.length}`}
          detail={data.coachMessages.length ? "Conversation history is persisted per account." : "Start a chat when you want feedback."}
          icon={<BrainCircuit className="h-5 w-5 text-[color:var(--support)]" />}
        />
      </div>

      <BentoGrid className="xl:grid-cols-[1.25fr_0.85fr]">
        <BentoGridItem className="p-0">
          <GlowCard className="h-full">
            <Card className="border-transparent bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(234,234,234,0.88))] p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <LayoutList className="h-4 w-4 text-[color:var(--brand)]" />
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    Split Library
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {isAutoSaving && (
                    <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-[color:var(--brand)] animate-pulse">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Auto-Saving
                    </div>
                  )}
                  <Badge className="bg-black/5 border-none text-[10px]">{data.plans.length} plans</Badge>
                </div>
              </div>

              <ScrollArea className="flex-1 -mx-2 px-2">
                <Reorder.Group 
                  axis="y" 
                  values={plans} 
                  onReorder={setPlans} 
                  className="space-y-3 pb-4"
                >
                  {plans.map((p) => {
                    const isExpanded = expandedPlans[p.id];
                    const isActive = p.id === selectedPlanId;
                    
                    return (
                      <Reorder.Item 
                        key={p.id} 
                        value={p}
                        initial={false}
                        layout
                        whileDrag={{ 
                          scale: 1.02, 
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 700, 
                          damping: 40, 
                          mass: 0.8 
                        }}
                        className={cn(
                          "rounded-[28px] border border-[color:var(--border)] transition-opacity duration-200 overflow-hidden",
                          isActive ? "bg-white/80 shadow-sm" : "bg-white/30 opacity-60 grayscale-[40%]"
                        )}
                      >
                        <div className="flex items-center">
                          <div className="pl-4 cursor-grab active:cursor-grabbing opacity-20 hover:opacity-50 h-full py-6 flex items-center">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <button
                            onClick={() => togglePlan(p.id)}
                            className="flex-1 flex items-center justify-between p-4 pl-2 text-left"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-[color:var(--foreground)] truncate">{p.name}</p>
                                  {isActive && <Badge className="h-4 px-1.5 text-[8px] bg-[color:var(--brand)] text-white! border-none font-black">ACTIVE</Badge>}
                                </div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted-foreground)] opacity-60">
                                  {p.days.reduce((acc, d) => acc + d.items.length, 0)} Lifts • {formatDate(p.updatedAt)}
                                </p>
                              </div>
                            </div>
                          </button>
                          <div className="pr-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 rounded-full text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                              onClick={(e) => {
                                e.stopPropagation();
                                exportPlanToMarkdown(p);
                              }}
                              title="Export to Markdown"
                            >
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </div>
                          <div className="pr-4">
                            {isExpanded ? <ChevronDown className="h-4 w-4 opacity-40" /> : <ChevronRight className="h-4 w-4 opacity-40" />}
                          </div>
                        </div>

                        <AnimatePresence initial={false}>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: "easeInOut" }}
                            >
                              <div className="border-t border-[color:var(--border)] bg-black/[0.02] p-4 pt-2">
                                <p className="text-[11px] leading-5 text-[color:var(--muted-foreground)] italic mb-4">
                                  {p.notes || "No additional notes for this split phase."}
                                </p>
                                <div className="grid gap-2 sm:grid-cols-2">
                                  {p.days.map(day => (
                                    <div key={day.id} className="rounded-2xl border border-[color:var(--border)] bg-white/60 p-3">
                                      <div className="flex justify-between items-start gap-2">
                                        <p className="text-[11px] font-bold text-[color:var(--foreground)] truncate">{day.title}</p>
                                        <Badge className="h-4 px-1.5 text-[8px] shrink-0 border-none">{day.items.length}</Badge>
                                      </div>
                                      <p className="mt-1 text-[9px] font-medium text-[color:var(--muted-foreground)] truncate">
                                        {day.focus || "Recovery / Misc"}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>
              </ScrollArea>
            </Card>
          </GlowCard>
        </BentoGridItem>

        <BentoGridItem className="p-0">
          <MuscleMap intensities={muscleIntensities} profile={data.profile} title={`${activePlan?.name || 'Active'} Split Target`} />
        </BentoGridItem>
      </BentoGrid>

      <Card className="p-6">
        <div className="flex items-center gap-2 text-[color:var(--foreground)]">
          <Flame className="h-4 w-4 text-[color:var(--brand)]" />
          <CardTitle className="text-lg">Workout Activity</CardTitle>
        </div>
        <CardDescription className="mt-2">
          Tracking consistency and relative intensity based on volume and logged results.
        </CardDescription>
        <div className="mt-6">
          <WorkoutHeatmap sessions={data.sessions} />
        </div>
      </Card>

      <DashboardCharts data={data} />

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            Recent sessions
          </p>
          <div className="mt-4 space-y-3">
            {data.sessions.length ? (
              data.sessions.slice(0, 5).map((session) => (
                <div key={session.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/55 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[color:var(--foreground)] truncate">{session.title}</p>
                      <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                        {formatDate(session.startedAt)} • Day {session.day + 1}
                      </p>
                    </div>
                    <Badge className="shrink-0">{session.items.length} exercises</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)] line-clamp-2">
                    {session.effort || session.notes || "No execution notes yet."}
                  </p>
                </div>
              ))
            ) : (
              <p className="rounded-[24px] border border-dashed border-[color:var(--border-strong)] p-5 text-sm text-[color:var(--muted-foreground)]">
                Logged sessions will appear here as soon as you save them from Workout Studio.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            PR board
          </p>
          <div className="mt-4 space-y-3">
            {data.records.length ? (
              data.records.slice(0, 6).map((record) => {
                const exercise = data.exercises.find((item) => item.id === record.exerciseId);
                return (
                  <div key={record.id} className="rounded-[24px] border border-[color:var(--border)] bg-white/55 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[color:var(--foreground)] truncate">{exercise?.name || record.exerciseId}</p>
                        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{formatDate(record.achievedAt)}</p>
                      </div>
                      <Badge className="shrink-0">
                        {record.value} {record.unit} x {record.reps}
                      </Badge>
                    </div>
                    {record.notes ? (
                      <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)] line-clamp-2">{record.notes}</p>
                    ) : null}
                  </div>
                );
              })
            ) : (
              <p className="rounded-[24px] border border-dashed border-[color:var(--border-strong)] p-5 text-sm text-[color:var(--muted-foreground)]">
                Log a PR from the planner to keep a structured performance history.
              </p>
            )}
          </div>
          {recentSession ? (
            <div className="mt-6 rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(135deg,rgba(16,16,16,0.03),rgba(16,16,16,0.08))] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                Latest execution note
              </p>
              <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)] truncate">{recentSession.title}</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted-foreground)] line-clamp-3">
                {recentSession.notes || recentSession.effort || "Capture how the day moved, what felt strong, and what needs adjusting."}
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
