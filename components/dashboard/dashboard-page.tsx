"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Activity,
  Award,
  BarChart3,
  CalendarClock,
  Dumbbell,
  Flame,
  History,
  Trophy,
} from "lucide-react";

import { MetricTile } from "@/components/shared/metric-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { WorkoutHeatmap } from "./workout-heatmap";
import { DashboardCharts } from "./dashboard-charts";
import { useData } from "@/components/shared/data-provider";
import { cn } from "@/lib/utils";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function DashboardPage() {
  const data = useData();
  const [tab, setTab] = useState<"overview" | "analytics" | "history">("overview");
  const recentSession = data.sessions[0];
  const activePlan = data.plans[0];
  const firstName = data.user.name.split(" ")[0] || "there";

  const metrics = [
    {
      label: "Weekly target",
      value: data.profile.weeklySessions ? `${data.profile.weeklySessions} sessions` : "Not set",
      detail: data.profile.goal || "Set your goal in Settings",
      icon: <CalendarClock className="h-4.5 w-4.5 text-foreground" />,
    },
    {
      label: "Saved splits",
      value: `${data.plans.length}`,
      detail: activePlan ? `Latest: ${activePlan.name}` : "No plans yet",
      icon: <Activity className="h-4.5 w-4.5 text-foreground" />,
    },
    {
      label: "Workouts",
      value: `${data.sessions.length}`,
      detail: recentSession ? `Last ${formatDate(recentSession.startedAt)}` : "No logs yet",
      icon: <History className="h-4.5 w-4.5 text-foreground" />,
    },
    {
      label: "Records",
      value: `${data.records.length}`,
      detail: data.records[0] ? "Recent PR logged" : "No PRs yet",
      icon: <Trophy className="h-4.5 w-4.5 text-foreground" />,
    },
  ];

  return (
    <div className="space-y-3 pb-2 lg:space-y-5 lg:pb-0">
      <Card className="rounded-xl p-3 sm:rounded-2xl sm:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Dashboard</p>
            <h1 className="mt-1 truncate text-lg font-semibold tracking-tight text-foreground sm:text-2xl">
              Welcome back, {firstName}.
            </h1>
            <p className="mt-1 hidden text-xs text-muted-foreground sm:block">
              A quiet summary of your plans, logged sessions, and progress.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-[color:var(--background)] p-1 md:w-[300px]">
            {([
              { id: "overview", label: "Overview", icon: Activity },
              { id: "analytics", label: "Charts", icon: BarChart3 },
              { id: "history", label: "History", icon: History },
            ] as const).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <Button
                  key={item.id}
                  type="button"
                  variant="ghost"
                  onClick={() => setTab(item.id)}
                  className={cn(
                    "h-8 rounded-md px-2 text-[10px] font-semibold hover:bg-card hover:text-foreground",
                    active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {tab === "overview" && (
        <div className="space-y-3 animate-in fade-in duration-300 lg:space-y-5">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricTile key={metric.label} {...metric} />
            ))}
          </div>

          <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)] lg:gap-5">
            <Card className="rounded-xl p-3 sm:rounded-2xl sm:p-5">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-foreground" />
                    <CardTitle className="text-xs font-semibold sm:text-sm">Training Plan</CardTitle>
                  </div>
                  <CardDescription className="mt-1 hidden text-xs sm:block">
                    Keep the next workout one tap away.
                  </CardDescription>
                </div>
                <Button
                  asChild
                  size="sm"
                  className="training-plan-open-button h-8 rounded-lg px-3 text-[10px]"
                >
                  <Link href="/train">Open</Link>
                </Button>
              </div>

              {activePlan ? (
                <div className="mt-3 space-y-3">
                  <div className="rounded-xl border border-border bg-foreground/[0.025] p-3">
                    <p className="truncate text-sm font-semibold text-foreground">{activePlan.name}</p>
                    <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                      {activePlan.notes || "No plan notes added."}
                    </p>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {activePlan.days.slice(0, 4).map((day) => (
                      <div key={day.id} className="min-w-0 rounded-xl border border-border bg-card p-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {day.title || `Day ${day.day + 1}`}
                          </p>
                          <Badge className="shrink-0 border-none bg-foreground/5 px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground">
                            {day.items.length} lifts
                          </Badge>
                        </div>
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">{day.focus || "Routine"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-3 rounded-xl border border-dashed border-border p-6 text-center">
                  <Dumbbell className="mx-auto h-6 w-6 text-muted-foreground/50" />
                  <p className="mt-2 text-xs font-semibold text-foreground">No split templates yet</p>
                  <p className="mt-1 text-[10px] text-muted-foreground">Create a plan in Train to start clean logging.</p>
                </div>
              )}
            </Card>

            <Card className="hidden rounded-xl p-3 sm:block sm:rounded-2xl sm:p-5">
              <div className="flex h-full items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Latest workout</p>
                  <p className="mt-1 truncate text-xs font-semibold text-foreground">
                    {recentSession ? recentSession.title : "No session logged"}
                  </p>
                  <p className="mt-1 text-[10px] text-muted-foreground">
                    {recentSession ? formatDate(recentSession.startedAt) : "Finish a workout to populate stats."}
                  </p>
                </div>
                <Badge className="border-none bg-foreground/5 px-2 py-1 text-[9px] font-bold text-muted-foreground">
                  {recentSession ? `${recentSession.items.length} lifts` : "Idle"}
                </Badge>
              </div>
            </Card>

            <Card className="rounded-xl p-3 sm:rounded-2xl sm:p-5 lg:col-span-2">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Flame className="h-4 w-4 text-foreground" />
                <CardTitle className="text-xs font-semibold sm:text-sm">Consistency</CardTitle>
              </div>
              <div className="mt-3">
                <WorkoutHeatmap sessions={data.sessions} />
              </div>
            </Card>
          </div>

          <div className="hidden gap-5 lg:grid lg:grid-cols-2">
            <Card className="rounded-2xl p-5">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <History className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">Recent Sessions</CardTitle>
              </div>
              <div className="mt-3 grid gap-2">
                {data.sessions.length ? (
                  data.sessions.slice(0, 4).map((session) => (
                    <div key={session.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-foreground/[0.02] p-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{session.title}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(session.startedAt)}</p>
                      </div>
                      <Badge className="shrink-0 border-none px-2 py-1 text-[9px]">{session.items.length} lifts</Badge>
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                    Completed logs will appear here.
                  </p>
                )}
              </div>
            </Card>

            <Card className="rounded-2xl p-5">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Award className="h-4 w-4 text-foreground" />
                <CardTitle className="text-sm font-semibold">Personal Records</CardTitle>
              </div>
              <div className="mt-3 grid gap-2">
                {data.records.length ? (
                  data.records.slice(0, 4).map((record) => {
                    const exercise = data.exercises.find((item) => item.id === record.exerciseId);
                    return (
                      <div key={record.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-foreground/[0.02] p-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">{exercise?.name || record.exerciseId}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(record.achievedAt)}</p>
                        </div>
                        <Badge className="shrink-0 border-none bg-brand px-2 py-1 text-[9px] text-background">
                          {record.value} {record.unit} x {record.reps}
                        </Badge>
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                    Log breakthroughs in Train to track records.
                  </p>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="animate-in fade-in duration-300">
          <DashboardCharts data={data} />
        </div>
      )}

      {tab === "history" && (
        <div className="grid gap-3 animate-in fade-in duration-300 lg:grid-cols-2 lg:gap-5">
          <Card className="rounded-xl p-3 sm:rounded-2xl sm:p-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <History className="h-4 w-4 text-foreground" />
              <CardTitle className="text-xs font-semibold sm:text-sm">Recent Sessions</CardTitle>
            </div>
            <div className="mt-3 space-y-2">
              {data.sessions.length ? (
                data.sessions.slice(0, 6).map((session) => (
                  <div key={session.id} className="rounded-xl border border-border bg-card p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-foreground">{session.title}</p>
                        <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(session.startedAt)}</p>
                      </div>
                      <Badge className="shrink-0 border-none bg-foreground/5 text-[9px] font-bold text-muted-foreground">
                        {session.items.length} lifts
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  Completed logs will appear here.
                </p>
              )}
            </div>
          </Card>

          <Card className="rounded-xl p-3 sm:rounded-2xl sm:p-5">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Award className="h-4 w-4 text-foreground" />
              <CardTitle className="text-xs font-semibold sm:text-sm">Personal Records</CardTitle>
            </div>
            <div className="mt-3 space-y-2">
              {data.records.length ? (
                data.records.slice(0, 6).map((record) => {
                  const exercise = data.exercises.find((item) => item.id === record.exerciseId);
                  return (
                    <div key={record.id} className="rounded-xl border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-xs font-semibold text-foreground">{exercise?.name || record.exerciseId}</p>
                          <p className="mt-1 text-[10px] text-muted-foreground">{formatDate(record.achievedAt)}</p>
                        </div>
                        <Badge className="shrink-0 border-none bg-brand text-[9px] font-bold text-background">
                          {record.value} {record.unit} x {record.reps}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="rounded-xl border border-dashed border-border p-5 text-center text-xs text-muted-foreground">
                  Log breakthroughs in Train to track records.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
