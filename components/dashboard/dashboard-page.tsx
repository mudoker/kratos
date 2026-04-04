"use client";

import { useMemo } from "react";
import { Activity, BrainCircuit, CalendarClock, Trophy, Flame } from "lucide-react";
import type { BodyHighlightSlug } from "@/lib/types";
import { PageHeader } from "@/components/shared/page-header";
import { MetricTile } from "@/components/shared/metric-tile";
import { MuscleMap } from "@/components/shared/muscle-map";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { GlowCard } from "@/components/ui/glow-card";
import { TextGenerate } from "@/components/ui/text-generate";
import { WorkoutHeatmap } from "./workout-heatmap";
import { useData } from "@/components/shared/data-provider";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function DashboardPage() {
  const data = useData();
  const plan = data.plans[0];
  const recentSession = data.sessions[0];

  const muscleIntensities = useMemo(() => {
    const frequency: Record<string, number> = {};
    const lookbackDays = 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lookbackDays);

    data.sessions
      .filter((s) => new Date(s.startedAt) >= cutoff)
      .forEach((session) => {
        session.items.forEach((item) => {
          const exercise = data.exercises.find((e) => e.id === item.exerciseId);
          if (!exercise) return;
          exercise.bodyRegionSlugs.forEach((slug) => {
            frequency[slug] = (frequency[slug] || 0) + 1;
          });
        });
      });

    const maxFreq = Math.max(...Object.values(frequency), 1);
    return Object.entries(frequency).map(([slug, count]) => ({
      slug: slug as BodyHighlightSlug,
      intensity: Math.min(Math.round((count / maxFreq) * 4), 4) || 1,
    }));
  }, [data.sessions, data.exercises]);

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
          detail={plan ? `Latest update ${formatDate(plan.updatedAt)}` : "Create your first structured split."}
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

      <BentoGrid className="xl:grid-cols-[1.2fr_1.2fr_0.9fr]">
        <BentoGridItem span="wide">
          <GlowCard>
            <Card className="border-transparent bg-[linear-gradient(145deg,rgba(255,255,255,0.92),rgba(234,234,234,0.88))] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                    Current split
                  </p>
                  <CardTitle className="mt-2">{plan?.name || "No weekly plan yet"}</CardTitle>
                  <CardDescription className="mt-2 max-w-2xl leading-6">
                    {plan?.notes || "Use the planner to map each training day, target load, RPE, and PR intent."}
                  </CardDescription>
                </div>
                {plan ? <Badge>Updated {formatDate(plan.updatedAt)}</Badge> : null}
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                {(plan?.days ?? []).map((day) => (
                  <div key={day.id} className="rounded-[26px] border border-[color:var(--border)] bg-white/60 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[color:var(--foreground)]">{day.title}</p>
                        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{day.focus || "Unassigned focus"}</p>
                      </div>
                      <Badge>{day.items.length} lifts</Badge>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                      {day.sessionGoal || day.notes || "Add warm-up, intent, and execution notes in the planner."}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </GlowCard>
        </BentoGridItem>

        <BentoGridItem className="p-0">
          <MuscleMap intensities={muscleIntensities} profile={data.profile} title="Recent Stimulus Focus" />
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
                    <div>
                      <p className="font-semibold text-[color:var(--foreground)]">{session.title}</p>
                      <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">
                        {formatDate(session.startedAt)} • Day {session.day + 1}
                      </p>
                    </div>
                    <Badge>{session.items.length} exercises</Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
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
                      <div>
                        <p className="font-semibold text-[color:var(--foreground)]">{exercise?.name || record.exerciseId}</p>
                        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">{formatDate(record.achievedAt)}</p>
                      </div>
                      <Badge>
                        {record.value} {record.unit} x {record.reps}
                      </Badge>
                    </div>
                    {record.notes ? (
                      <p className="mt-3 text-sm leading-6 text-[color:var(--muted-foreground)]">{record.notes}</p>
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
              <p className="mt-2 text-lg font-semibold text-[color:var(--foreground)]">{recentSession.title}</p>
              <p className="mt-2 text-sm leading-7 text-[color:var(--muted-foreground)]">
                {recentSession.notes || recentSession.effort || "Capture how the day moved, what felt strong, and what needs adjusting."}
              </p>
            </div>
          ) : null}
        </Card>
      </div>
    </div>
  );
}
