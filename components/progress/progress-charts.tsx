"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import type { DashboardData, PersonalRecord } from "@/lib/types";
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

  useEffect(() => {
    if (exerciseOptions.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(exerciseOptions[0].id);
    }
  }, [exerciseOptions, selectedExerciseId]);

  const chartData = useMemo(() => {
    if (!selectedExerciseId) return [];
    return data.records
      .filter((r) => r.exerciseId === selectedExerciseId)
      .sort((a, b) => new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime())
      .map(r => ({
        date: new Date(r.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        value: r.value,
        reps: r.reps,
        unit: r.unit
      }))
      .slice(-12);
  }, [data.records, selectedExerciseId]);

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle>Progression Analytics</CardTitle>
          <CardDescription className="mt-1">
            Tracking strength trajectory using Recharts visualisations.
          </CardDescription>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedExerciseId} onValueChange={setSelectedExerciseId}>
            <SelectTrigger className="rounded-2xl border-[color:var(--border)] bg-white/50">
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
        <Card className="p-6">
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    borderRadius: '16px', 
                    border: '1px solid var(--border)', 
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                    fontSize: '12px',
                    fontWeight: 'bold'
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

          <div className="mt-8 grid grid-cols-2 gap-6 border-t border-[color:var(--border)] pt-8 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">Peak Perform</p>
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">Data Points</p>
              <p className="font-[family:var(--font-display)] text-2xl font-bold text-[color:var(--foreground)]">{stats?.points} pts</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex h-64 flex-col items-center justify-center border-dashed p-6 text-center text-[color:var(--muted-foreground)]">
          <p className="text-sm font-medium">Select an exercise with logged PRs to view progression.</p>
        </Card>
      )}
    </div>
  );
}
