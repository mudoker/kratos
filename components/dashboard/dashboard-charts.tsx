"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DashboardData, WorkoutSession } from "@/lib/types";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export function DashboardCharts({ data }: { data: DashboardData }) {
  const weeklyVolume = useMemo(() => {
    const last4Weeks: Record<string, number> = {};
    const now = new Date();
    
    // Initialize last 4 weeks
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
        // Simple volume metric: total sets in the week
        const setsInSession = session.items.reduce((acc, item) => acc + (item.sets?.length || 0), 0);
        last4Weeks[weekNum] += setsInSession;
      }
    });

    return Object.entries(last4Weeks)
      .map(([week, volume]) => ({ week, volume }))
      .reverse();
  }, [data.sessions]);

  const muscleDistribution = useMemo(() => {
    const dist: Record<string, number> = {};
    const lookback = 30; // last 30 days
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [data.sessions, data.exercises]);

  const maxVolume = Math.max(...weeklyVolume.map(v => v.volume), 1);
  const maxMuscleSets = Math.max(...muscleDistribution.map(m => m[1]), 1);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <CardTitle className="text-base">Weekly Volume (Total Sets)</CardTitle>
        <CardDescription className="mt-1">Last 4 weeks of training density.</CardDescription>
        <div className="mt-8 flex h-40 items-end gap-4 px-2">
          {weeklyVolume.map((v, i) => (
            <div key={v.week} className="group relative flex flex-1 flex-col items-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${(v.volume / maxVolume) * 100}%` }}
                className="w-full rounded-t-lg bg-[color:var(--brand)] opacity-80 transition group-hover:opacity-100"
              />
              <span className="mt-2 text-[10px] font-bold text-[color:var(--muted-foreground)]">W{i+1}</span>
              <div className="absolute -top-6 hidden text-[10px] font-bold text-[color:var(--foreground)] group-hover:block">
                {v.volume} sets
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <CardTitle className="text-base">Muscle Priority</CardTitle>
        <CardDescription className="mt-1">Top 5 primary drivers (Last 30 days).</CardDescription>
        <div className="mt-6 space-y-4">
          {muscleDistribution.map(([muscle, sets]) => (
            <div key={muscle} className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-[color:var(--foreground)]">{muscle}</span>
                <span className="text-[color:var(--muted-foreground)]">{sets} sets</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/5">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(sets / maxMuscleSets) * 100}%` }}
                  className="h-full bg-[color:var(--support)]"
                />
              </div>
            </div>
          ))}
          {muscleDistribution.length === 0 && (
            <p className="py-10 text-center text-sm text-[color:var(--muted-foreground)]">No data yet.</p>
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
