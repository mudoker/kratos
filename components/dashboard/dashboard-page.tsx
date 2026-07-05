"use client";

import { useMemo, useState } from "react";
import { 
  Activity, 
  BrainCircuit, 
  CalendarClock, 
  Trophy, 
  Flame
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MetricTile } from "@/components/shared/metric-tile";
import { Badge } from "@/components/ui/badge";
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
    <div className="space-y-6">
      <Card className="overflow-hidden p-5 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <PageHeader
              eyebrow="Summary"
              title={<TextGenerate text={`Welcome back, ${data.user.name.split(" ")[0]}.`} />}
              description="Track your consistency, active training splits, personal records, and telemetry."
            />
          </div>
          
          {/* Apple Segmented Control Navigation */}
          <div className="bg-neutral-100 p-0.5 rounded-xl flex w-full md:w-auto md:min-w-[280px]">
            <button
              type="button"
              onClick={() => setTab("overview")}
              className={`flex-1 rounded-[10px] py-2 text-xs font-bold transition-all ${
                tab === "overview"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setTab("analytics")}
              className={`flex-1 rounded-[10px] py-2 text-xs font-bold transition-all ${
                tab === "analytics"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              Analytics
            </button>
            <button
              type="button"
              onClick={() => setTab("history")}
              className={`flex-1 rounded-[10px] py-2 text-xs font-bold transition-all ${
                tab === "history"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              History
            </button>
          </div>
        </div>
      </Card>

      {tab === "overview" && (
        <div className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            <MetricTile
              label="Weekly target"
              value={data.profile.weeklySessions ? `${data.profile.weeklySessions} sessions` : "Not set"}
              detail={data.profile.goal ? `Goal: ${data.profile.goal}` : "Add your training goal in Settings."}
              icon={<CalendarClock className="h-5 w-5 text-neutral-800" />}
            />
            <MetricTile
              label="Saved splits"
              value={`${data.plans.length}`}
              detail={data.plans[0] ? `Latest update ${formatDate(data.plans[0].updatedAt)}` : "Create your first structure."}
              icon={<Activity className="h-5 w-5 text-neutral-800" />}
            />
            <MetricTile
              label="PR board"
              value={`${data.records.length}`}
              detail={data.records[0] ? `Latest record ${formatDate(data.records[0].achievedAt)}` : "No records logged."}
              icon={<Trophy className="h-5 w-5 text-neutral-800" />}
            />
            <MetricTile
              label="Coach memory"
              value={`${data.coachMessages.length}`}
              detail={data.coachMessages.length ? "Persisted telemetry" : "Chat to gain insights."}
              icon={<BrainCircuit className="h-5 w-5 text-neutral-800" />}
            />
          </div>

          <Card className="p-4 md:p-6">
            <div className="flex items-center gap-2 text-neutral-900">
              <Flame className="h-4 w-4 text-black" />
              <CardTitle className="text-base font-semibold">Workout Consistency</CardTitle>
            </div>
            <CardDescription className="mt-1">
              Tracking set volume and logged training logs over the past 365 days.
            </CardDescription>
            <div className="mt-6">
              <WorkoutHeatmap sessions={data.sessions} />
            </div>
          </Card>
        </div>
      )}

      {tab === "analytics" && (
        <div className="animate-in fade-in duration-300">
          <DashboardCharts data={data} />
        </div>
      )}

      {tab === "history" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-4 md:p-6">
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                Recent sessions
              </p>
              <div className="mt-4 space-y-3">
                {data.sessions.length ? (
                  data.sessions.slice(0, 5).map((session) => (
                    <div key={session.id} className="rounded-xl border border-black/[0.04] bg-neutral-50 p-4 transition hover:bg-neutral-100/50">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-neutral-900 truncate">{session.title}</p>
                          <p className="mt-1 text-xs text-neutral-500 font-medium">
                            {formatDate(session.startedAt)} • Day {session.day + 1}
                          </p>
                        </div>
                        <Badge className="shrink-0 text-[10px] bg-neutral-200/50 text-neutral-700 font-bold border-transparent">{session.items.length} Lifts</Badge>
                      </div>
                      {session.effort || session.notes ? (
                        <p className="mt-2 text-xs leading-normal text-neutral-600 line-clamp-2">
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
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                Personal Records (PRs)
              </p>
              <div className="mt-4 space-y-3">
                {data.records.length ? (
                  data.records.slice(0, 5).map((record) => {
                    const exercise = data.exercises.find((item) => item.id === record.exerciseId);
                    return (
                      <div key={record.id} className="rounded-xl border border-black/[0.04] bg-neutral-50 p-4 transition hover:bg-neutral-100/50">
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-neutral-900 truncate">{exercise?.name || record.exerciseId}</p>
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
              <p className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                Latest Execution Telemetry
              </p>
              <div className="mt-4 rounded-xl border border-black/[0.04] bg-neutral-50 p-4">
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
