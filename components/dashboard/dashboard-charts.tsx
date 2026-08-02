"use client";

import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import type { DashboardData } from "@/lib/types";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartTooltip } from "@/components/shared/chart-tooltip";

export function DashboardCharts({ data }: { data: DashboardData }) {
  const weeklyVolume = useMemo(() => {
    const last4Weeks: Record<string, number> = {};
    const now = new Date();
    
    for (let i = 0; i < 4; i++) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekNum = getWeekNumber(d);
      last4Weeks[weekNum] = 0;
    }

    data.sessions.forEach(session => {
      const sessionDate = new Date(session.startedAt);
      const weekNum = getWeekNumber(sessionDate);
      if (last4Weeks[weekNum] !== undefined) {
        const setsInSession = session.items.reduce((acc, item) => acc + (item.sets?.length || 0), 0);
        last4Weeks[weekNum] += setsInSession;
      }
    });

    return Object.entries(last4Weeks)
      .map(([, volume], idx) => ({ name: `Week ${4-idx}`, volume }))
      .reverse();
  }, [data.sessions]);

  const muscleDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    const lookback = 30;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lookback);

    data.sessions
      .filter(s => new Date(s.startedAt) >= cutoff)
      .forEach(session => {
        session.items.forEach(item => {
          const exercise = data.exercises.find(e => e.id === item.exerciseId);
          if (!exercise) return;
          exercise.primaryMuscles.forEach(m => {
            dist[m] = (dist[m] || 0) + (item.sets?.length || 0);
          });
        });
      });

    return Object.entries(dist)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
  }, [data.sessions, data.exercises]);

  const hasWeeklyVolume = weeklyVolume.some((week) => week.volume > 0);
  return (
    <div className="grid gap-4 md:grid-cols-2 md:gap-6">
      <Card className="p-3.5 sm:p-6">
        <CardTitle className="text-base">Weekly Volume</CardTitle>
        <CardDescription className="mt-1 hidden sm:block">Total sets performed per week.</CardDescription>
        <div className="h-[220px] w-full mt-4 sm:h-[280px] sm:mt-6">
          {hasWeeklyVolume ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyVolume} margin={{ top: 10, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 600, fill: "var(--muted-foreground)" }}
                />
                <Tooltip
                  cursor={{ fill: "var(--foreground)", opacity: 0.04 }}
                  content={<ChartTooltip valueLabel="sets" />}
                />
                <Bar
                  dataKey="volume"
                  fill="var(--brand)"
                  radius={[6, 6, 0, 0]}
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background p-6 text-center">
              <p className="text-sm font-semibold text-foreground">No weekly volume yet.</p>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                Finish a workout to populate this chart.
              </p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-3.5 sm:p-6">
        <CardTitle className="text-base">Muscle Stimulus</CardTitle>
        <CardDescription className="mt-1">Primary muscle focus (Last 30 days).</CardDescription>
        <div className="h-[220px] w-full mt-4 sm:h-[280px] sm:mt-6 relative">
          {muscleDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={muscleDistribution} 
                layout="vertical" 
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: "var(--foreground)" }}
                  width={80}
                />
                <Tooltip
                  cursor={{ fill: "var(--foreground)", opacity: 0.04 }}
                  content={<ChartTooltip valueLabel="sets" />}
                />
                <Bar 
                  dataKey="value" 
                  radius={[0, 6, 6, 0]} 
                  barSize={20}
                  animationDuration={1500}
                >
                  {muscleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "var(--brand)" : "var(--support)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-background p-6 text-center">
              <p className="text-sm font-semibold text-foreground">
                No session data for the last 30 days.
              </p>
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">
                Log a workout to see your stimulus breakdown.
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function getWeekNumber(d: Date) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${date.getUTCFullYear()}-${weekNo}`;
}
