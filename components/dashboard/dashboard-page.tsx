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
        <div className="space-y-3">
          <div className="grid gap-3 grid-cols-2">
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

          {/* Expanded Overview Extras Grid */}
          <div className="grid gap-3.5 md:grid-cols-2 lg:gap-6 mt-3.5">
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
                  <Button className="w-full h-9 bg-brand hover:bg-brand-deep text-white font-bold text-xs rounded-xl shadow-sm border-none flex items-center justify-center gap-2 cursor-pointer transition">
                    <Dumbbell className="h-3.5 w-3.5" />
                    <span>Go to Training</span>
                  </Button>
                </Link>
              </div>
            </Card>

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
                          <Badge className="bg-brand text-white font-extrabold text-[9px] py-0.5 border-none shrink-0">
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
          </div>
        </div>
      )}

      {tab === "analytics" && (
        <div className="animate-in fade-in duration-300">
          <DashboardCharts data={data} />
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-4 animate-in fade-in duration-300 md:space-y-6">
          <div className="grid gap-4 md:grid-cols-2 md:gap-6">
            <Card className="p-4 md:p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 sm:tracking-widest">
                Recent sessions
              </p>
              <div className="mt-4 space-y-3">
                {data.sessions.length ? (
                  data.sessions.slice(0, 5).map((session) => (
                      <div key={session.id} className="rounded-xl border border-black/[0.04] bg-card/65 p-3.5 transition hover:bg-card/85/50 sm:p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-foreground truncate">{session.title}</p>
                          <p className="mt-1 text-xs text-neutral-500 font-medium">
                            {formatDate(session.startedAt)} • Day {session.day + 1}
                          </p>
                        </div>
                        <Badge className="shrink-0 text-[10px] bg-neutral-200/50 text-neutral-700 font-bold border-transparent">{session.items.length} Lifts</Badge>
                      </div>
                      {session.effort || session.notes ? (
                          <p className="mt-2 hidden text-xs leading-normal text-neutral-600 line-clamp-2 sm:block">
                          {session.effort || session.notes}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="rounded-xl border border-dashed border-neutral-200 p-5 text-xs text-neutral-500 text-center">
                    Completed logs will appear here.
                  </p>
                )}
              </div>
            </Card>

            <Card className="p-4 md:p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 sm:tracking-widest">
                Personal Records (PRs)
              </p>
              <div className="mt-4 space-y-3">
                {data.records.length ? (
                  data.records.slice(0, 5).map((record) => {
                    const exercise = data.exercises.find((item) => item.id === record.exerciseId);
                    return (
                      <div key={record.id} className="rounded-xl border border-black/[0.04] bg-card/65 p-3.5 transition hover:bg-card/85/50 sm:p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{exercise?.name || record.exerciseId}</p>
                            <p className="mt-1 text-xs text-neutral-500 font-medium">{formatDate(record.achievedAt)}</p>
                          </div>
                          <Badge className="shrink-0 text-[10px] bg-black text-white font-extrabold border-transparent">
                            {record.value} {record.unit} × {record.reps}
                          </Badge>
                        </div>
                        {record.notes ? (
                          <p className="mt-2 text-xs leading-normal text-neutral-600 line-clamp-2">{record.notes}</p>
                        ) : null}
                      </div>
                    );
                  })
                ) : (
                  <p className="rounded-xl border border-dashed border-neutral-200 p-5 text-xs text-neutral-500 text-center">
                    Log breakthroughs in the Planner to track records.
                  </p>
                )}
              </div>
            </Card>
          </div>

          {recentSession && (
            <Card className="p-4 md:p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 sm:tracking-widest">
                Latest workout
              </p>
              <div className="mt-4 rounded-xl border border-black/[0.04] bg-card/65 p-4">
                <p className="font-bold text-sm text-neutral-950 truncate">{recentSession.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-neutral-600">
                  {recentSession.notes || recentSession.effort || "No setup notes added to this session."}
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
