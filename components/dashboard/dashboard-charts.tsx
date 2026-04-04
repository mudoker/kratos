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
      .map(([week, volume], idx) => ({ name: `Week ${4-idx}`, volume }))
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card className="p-6">
        <CardTitle className="text-base">Weekly Volume</CardTitle>
        <CardDescription className="mt-1">Total sets performed per week.</CardDescription>
        <div className="h-[240px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyVolume} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
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
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
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
        </div>
      </Card>

      <Card className="p-6">
        <CardTitle className="text-base">Muscle Stimulus</CardTitle>
        <CardDescription className="mt-1">Primary muscle focus (Last 30 days).</CardDescription>
        <div className="h-[240px] w-full mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={muscleDistribution} 
              layout="vertical" 
              margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(0,0,0,0.05)" />
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
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)' }}
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
