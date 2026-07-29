"use client";

import { useMemo, useState } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
} from "recharts";
import type { DashboardData } from "@/lib/types";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProgressCharts({ data }: { data: DashboardData }) {
  const exerciseOptions = useMemo(() => {
    const seen = new Set<string>();
    return data.records
      .map((r) => {
        const exercise = data.exercises.find((e) => e.id === r.exerciseId);
        return { id: r.exerciseId, name: exercise?.name || r.exerciseId };
      })
      .filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
  }, [data.records, data.exercises]);

  const [selectedExerciseId, setSelectedExerciseId] = useState("");

  const activeExerciseId = selectedExerciseId || exerciseOptions[0]?.id || "";

  const chartData = useMemo(() => {
    if (!activeExerciseId) return [];
    return data.records
      .filter((r) => r.exerciseId === activeExerciseId)
      .sort((a, b) => new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime())
      .map(r => ({
        date: new Date(r.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: r.value,
        reps: r.reps,
        unit: r.unit
      }))
      .slice(-12);
  }, [data.records, activeExerciseId]);

  const stats = useMemo(() => {
    if (chartData.length === 0) return null;
    const current = chartData[chartData.length - 1];
    const starting = chartData[0];
    return {
      current: `${current.value}${current.unit}`,
      starting: `${starting.value}${starting.unit}`,
      growth: `+${Math.max(0, current.value - starting.value)}${current.unit}`,
      points: chartData.length
    };
  }, [chartData]);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div>
          <CardTitle className="text-base sm:text-xl">Strength Trend</CardTitle>
          <CardDescription className="mt-1 hidden sm:block">
            Track your selected lift over time.
          </CardDescription>
        </div>
        <div className="w-full sm:w-64">
          <Select value={activeExerciseId} onValueChange={setSelectedExerciseId}>
            <SelectTrigger>
              <SelectValue placeholder="Select exercise" />
            </SelectTrigger>
            <SelectContent>
              {exerciseOptions.map((opt) => (
                <SelectItem key={opt.id} value={opt.id}>
                  {opt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {chartData.length > 0 ? (
        <Card className="p-3.5 sm:p-6">
          <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-3 sm:hidden">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--muted-foreground)]">Current</p>
              <p className="font-[family:var(--font-display)] text-lg font-bold text-[color:var(--foreground)]">{stats?.current}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold uppercase tracking-wider text-[color:var(--muted-foreground)]">Growth</p>
              <p className="font-[family:var(--font-display)] text-lg font-bold text-[color:var(--support)]">{stats?.growth}</p>
            </div>
          </div>
          <div className="h-[220px] w-full mt-3 sm:h-[300px] sm:mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 6, left: -28, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--brand)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="var(--brand)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: "var(--muted-foreground)" }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 600, fill: "var(--muted-foreground)" }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '8px', 
                    border: '1px solid rgba(0,0,0,0.06)', 
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    fontSize: '11px',
                    fontWeight: '600'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="var(--brand)" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 hidden grid-cols-2 gap-6 border-t border-[color:var(--border)] pt-8 sm:grid sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">Peak</p>
              <p className="font-[family:var(--font-display)] text-2xl font-bold text-[color:var(--foreground)]">{stats?.current}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">Baseline</p>
              <p className="font-[family:var(--font-display)] text-2xl font-bold text-[color:var(--foreground)]">{stats?.starting}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">Growth</p>
              <p className="font-[family:var(--font-display)] text-2xl font-bold text-[color:var(--support)]">{stats?.growth}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">Points</p>
              <p className="font-[family:var(--font-display)] text-2xl font-bold text-[color:var(--foreground)]">{stats?.points} pts</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex h-48 flex-col items-center justify-center border-dashed p-5 text-center text-[color:var(--muted-foreground)] sm:h-64 sm:p-6">
          <p className="text-xs font-medium sm:text-sm">Select an exercise with PRs.</p>
        </Card>
      )}
    </div>
  );
}
