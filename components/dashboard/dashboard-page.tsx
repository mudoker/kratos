"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Activity, 
  CalendarClock, 
  Flame,
  Award,
  Trophy,
  Dumbbell
} from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { MetricTile } from "@/components/shared/metric-tile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { TextGenerate } from "@/components/ui/text-generate";
import { WorkoutHeatmap } from "./workout-heatmap";
import { DashboardCharts } from "./dashboard-charts";
import { useData } from "@/components/shared/data-provider";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function DashboardPage() {
  const data = useData();
  const [tab, setTab] = useState<"overview" | "analytics" | "history">("overview");
  const recentSession = data.sessions[0];

  return (
    <div className="space-y-3 pb-12 lg:space-y-6 lg:pb-0">
      <Card className="overflow-hidden rounded-xl p-3 md:rounded-2xl md:p-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <PageHeader
              eyebrow="Summary"
              title={<TextGenerate text={`Welcome back, ${data.user.name.split(" ")[0]}.`} />}
              description="Your training snapshot for today."
            />
          </div>
          
          {/* Apple Segmented Control Navigation */}
          <div className="flex w-full rounded-lg bg-card/85 p-0.5 md:w-auto md:min-w-[280px]">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={`flex-1 rounded-md py-1.5 text-[10px] font-semibold tracking-tight transition-all sm:rounded-[10px] sm:py-2 sm:text-[11px] ${
                tab === "overview"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab("analytics")}
              className={`flex-1 rounded-md py-1.5 text-[10px] font-semibold tracking-tight transition-all sm:rounded-[10px] sm:py-2 sm:text-[11px] ${
                tab === "analytics"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              Charts
            </button>
            <button
              type="button"
              onClick={() => setTab("history")}
              className={`flex-1 rounded-md py-1.5 text-[10px] font-semibold tracking-tight transition-all sm:rounded-[10px] sm:py-2 sm:text-[11px] ${
                tab === "history"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </Card>

      {tab === "overview" && (
        <div className="animate-in fade-in duration-300">
          <div className="grid gap-4 lg:grid-cols-12 lg:gap-6">
            {/* Column 1: Metrics & Latest Workout (lg:col-span-3) */}
            <div className="lg:col-span-3 space-y-4">
              <div className="grid gap-3 grid-cols-2 lg:grid-cols-1">
                <MetricTile
                  label="Weekly target"
                  value={data.profile.weeklySessions ? `${data.profile.weeklySessions} sessions` : "Not set"}
                  detail={data.profile.goal ? `Goal: ${data.profile.goal}` : "Set in Settings"}
                  icon={<CalendarClock className="h-5 w-5 text-foreground" />}
                />
                <MetricTile
                  label="Saved splits"
                  value={`${data.plans.length}`}
                  detail={data.plans[0] ? `Updated ${formatDate(data.plans[0].updatedAt)}` : "No splits yet"}
                  icon={<Activity className="h-5 w-5 text-foreground" />}
                />
              </div>

              {recentSession && (
                <Card className="rounded-xl p-4 md:p-6">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-border">
                    <CalendarClock className="h-4 w-4 text-brand" />
                    <CardTitle className="text-xs font-bold uppercase tracking-wider">Latest Workout</CardTitle>
                  </div>
                  <div className="mt-3 bg-card border border-border rounded-xl p-3">
                    <p className="font-bold text-xs text-foreground truncate">{recentSession.title}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {formatDate(recentSession.startedAt)}
                    </p>
                    <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground line-clamp-2">
                      {recentSession.notes || recentSession.effort || "No setup notes added."}
                    </p>
                  </div>
                </Card>
              )}
            </div>

            {/* Column 2: Consistency & Active Split (lg:col-span-5) */}
            <div className="lg:col-span-5 space-y-4">
              <Card className="rounded-xl p-3 md:rounded-2xl md:p-6">
                <div className="flex items-center gap-2 text-foreground">
                  <Flame className="h-3.5 w-3.5 text-foreground" />
                  <CardTitle className="text-xs font-semibold sm:text-sm">Consistency</CardTitle>
                </div>
                <CardDescription className="mt-1 hidden text-xs sm:block">
                  Logged training sessions over the past 365 days.
                </CardDescription>
                <div className="mt-3">
                  <WorkoutHeatmap sessions={data.sessions} />
                </div>
              </Card>

              {/* Active Training Split Card */}
              <Card className="rounded-xl p-4 md:rounded-2xl md:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-foreground">
                      <Dumbbell className="h-4 w-4 text-brand" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider">Active Split Plan</CardTitle>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground">Setup</span>
                  </div>

                  {data.plans.length > 0 ? (
                    <div className="mt-4 space-y-4">
                      <div>
                        <h4 className="text-xs font-bold text-foreground">{data.plans[0].name}</h4>
                        <p className="text-[10px] text-muted-foreground leading-normal mt-1">{data.plans[0].notes || "No split description added."}</p>
                      </div>

                      <div className="space-y-1.5 max-h-[144px] overflow-y-auto pr-1">
                        {data.plans[0].days.map((day) => (
                          <div key={day.id} className="flex justify-between items-center text-xs py-1.5 border-b border-border/40 last:border-b-0">
                            <span className="font-semibold text-foreground/80">{day.title || `Day ${day.day + 1}`}</span>
                            <Badge className="bg-brand/10 text-brand text-[8px] font-bold border-none">
                              {day.focus || "Lifts"}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-6 py-6 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-4">
                      <Dumbbell className="h-6 w-6 text-muted-foreground/30 mb-2" />
                      <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                        No split templates found. Create a split template in the Train section to plan your week.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <Link href="/train" className="block w-full">
                    <Button className="w-full h-9 bg-brand hover:bg-brand-deep text-background font-bold text-xs rounded-xl shadow-sm border-none flex items-center justify-center gap-2 cursor-pointer transition">
                      <Dumbbell className="h-3.5 w-3.5" />
                      <span>Go to Training</span>
                    </Button>
                  </Link>
                </div>
              </Card>
            </div>

            {/* Column 3: Personal Records & Coach Insights (lg:col-span-4) */}
            <div className="lg:col-span-4 space-y-4">
              {/* Personal Records Card */}
              <Card className="rounded-xl p-4 md:rounded-2xl md:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2 text-foreground">
                      <Trophy className="h-4 w-4 text-brand" />
                      <CardTitle className="text-xs font-bold uppercase tracking-wider">Personal Records (PRs)</CardTitle>
                    </div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded bg-foreground/5 text-muted-foreground">Highlights</span>
                  </div>

                  {data.records.length > 0 ? (
                    <div className="mt-4 space-y-2">
                      {data.records.slice(0, 3).map((record) => {
                        const exercise = data.exercises.find((item) => item.id === record.exerciseId);
                        return (
                          <div key={record.id} className="flex items-center justify-between p-2.5 bg-card border border-border rounded-xl transition hover:border-brand/20">
                            <div className="flex items-center gap-2.5">
                              <span className="p-1.5 bg-brand/10 text-brand rounded-lg shrink-0">
                                <Trophy className="h-3.5 w-3.5" />
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-foreground truncate">{exercise?.name || record.exerciseId}</p>
                                <p className="text-[9px] text-muted-foreground font-medium mt-0.5">{formatDate(record.achievedAt)}</p>
                              </div>
                            </div>
                            <Badge className="bg-brand text-background font-extrabold text-[9px] py-0.5 border-none shrink-0">
                              {record.value} {record.unit} × {record.reps}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="mt-6 py-6 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-4">
                      <Trophy className="h-6 w-6 text-muted-foreground/30 mb-2" />
                      <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                        No PRs recorded yet. Log your lifts in a training session to register personal records.
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-5">
                  <Link href="/progress" className="block w-full">
                    <Button variant="outline" className="w-full h-9 border-border bg-card hover:bg-foreground/5 text-foreground font-bold text-xs rounded-xl shadow-none flex items-center justify-center gap-2 cursor-pointer transition">
                      <Award className="h-3.5 w-3.5" />
                      <span>View Progress Lab</span>
                    </Button>
                  </Link>
                </div>
              </Card>

              {/* Coach Insights Card */}
              <Card className="rounded-xl p-4 md:rounded-2xl md:p-6 bg-brand/5 border border-brand/15">
                <div className="flex items-center gap-2 pb-2.5 border-b border-brand/10">
                  <Award className="h-4 w-4 text-brand" />
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-brand">Coach Insights</CardTitle>
                </div>
                <div className="mt-3.5 space-y-2.5">
                  <p className="text-[11px] leading-relaxed text-foreground font-medium">
                    "Consistent recovery window detected. Ensure you schedule your next training day focusing on progressive overload target weights."
                  </p>
                  <p className="text-[9px] text-brand/80 font-bold uppercase tracking-widest mt-1">
                    Powered by Gemini Node
                  </p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="animate-in fade-in duration-300">
          <DashboardCharts data={data} />
        </div>
      )}

      {tab === "history" && (
        <div className="animate-in fade-in duration-300">
          <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
            {/* Column 1: Recent Sessions */}
            <Card className="p-4 md:p-6 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground sm:tracking-widest pb-3 border-b border-border">
                  Recent sessions
                </p>
                <div className="mt-4 space-y-3">
                  {data.sessions.length ? (
                    data.sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="rounded-xl border border-border bg-card/65 p-3.5 transition hover:border-brand/20 sm:p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-foreground truncate">{session.title}</p>
                            <p className="mt-1 text-[10px] text-muted-foreground font-medium">
                              {formatDate(session.startedAt)} • Day {session.day + 1}
                            </p>
                          </div>
                          <Badge className="shrink-0 text-[9px] bg-foreground/5 text-foreground/75 font-bold border-border-strong">{session.items.length} Lifts</Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="rounded-xl border border-dashed border-border p-5 text-xs text-muted-foreground text-center">
                      Completed logs will appear here.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Column 2: Personal Records */}
            <Card className="p-4 md:p-6 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground sm:tracking-widest pb-3 border-b border-border">
                  Personal Records (PRs)
                </p>
                <div className="mt-4 space-y-3">
                  {data.records.length ? (
                    data.records.slice(0, 5).map((record) => {
                      const exercise = data.exercises.find((item) => item.id === record.exerciseId);
                      return (
                        <div key={record.id} className="rounded-xl border border-border bg-card/65 p-3.5 transition hover:border-brand/20 sm:p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-foreground truncate">{exercise?.name || record.exerciseId}</p>
                              <p className="mt-1 text-[10px] text-muted-foreground font-medium">{formatDate(record.achievedAt)}</p>
                            </div>
                            <Badge className="shrink-0 text-[9px] bg-brand text-background font-extrabold border-none">
                              {record.value} {record.unit} × {record.reps}
                            </Badge>
                          </div>
                          {record.notes ? (
                            <p className="mt-2 text-[10px] leading-normal text-muted-foreground line-clamp-2">{record.notes}</p>
                          ) : null}
                        </div>
                      );
                    })
                  ) : (
                    <p className="rounded-xl border border-dashed border-border p-5 text-xs text-muted-foreground text-center">
                      Log breakthroughs in the Planner to track records.
                    </p>
                  )}
                </div>
              </div>
            </Card>

            {/* Column 3: Latest Workout Session details */}
            <Card className="p-4 md:p-6 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground sm:tracking-widest pb-3 border-b border-border">
                  Latest workout
                </p>
                {recentSession ? (
                  <div className="mt-4 space-y-3.5">
                    <div className="rounded-xl border border-border bg-card/65 p-4">
                      <p className="font-bold text-xs text-foreground truncate">{recentSession.title}</p>
                      <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">
                        {recentSession.notes || recentSession.effort || "No setup notes added to this session."}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">Lifts Logged</p>
                      <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
                        {recentSession.items.slice(0, 4).map((item, idx) => {
                          const exercise = data.exercises.find((e) => e.id === item.exerciseId);
                          return (
                            <div key={idx} className="flex justify-between items-center text-xs py-1.5 border-b border-border/40 last:border-b-0">
                              <span className="font-semibold text-foreground/80 truncate max-w-[150px]">{exercise?.name || item.exerciseId}</span>
                              <Badge className="bg-brand/10 text-brand text-[8px] font-bold border-none">
                                {item.sets?.length || 0} sets
                              </Badge>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 py-6 border border-dashed border-border rounded-xl flex flex-col items-center justify-center text-center px-4">
                    <Dumbbell className="h-6 w-6 text-muted-foreground/30 mb-2" />
                    <p className="text-[10px] font-bold text-muted-foreground leading-relaxed">
                      No logged workout sessions found. Finish a workout template to view details here.
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
