"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import type { DashboardData, PersonalRecord } from "@/lib/types";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ProgressCharts({ data }: { data: DashboardData }) {
  const [selectedExerciseId, setSelectedPlanId] = useState(data.records[0]?.exerciseId || "");

  const chartData = useMemo(() => {
    if (!selectedExerciseId) return [];
    return data.records
      .filter((r) => r.exerciseId === selectedExerciseId)
      .sort((a, b) => new Date(a.achievedAt).getTime() - new Date(b.achievedAt).getTime())
      .slice(-10); // Last 10 records
  }, [data.records, selectedExerciseId]);

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

  const maxValue = Math.max(...chartData.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <CardTitle>Progression Analytics</CardTitle>
          <CardDescription className="mt-1">
            Visualizing performance trends across your tracked lifts.
          </CardDescription>
        </div>
        <div className="w-full sm:w-64">
          <Select value={selectedExerciseId} onValueChange={setSelectedPlanId}>
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
        <Card className="p-8">
          <div className="relative flex h-64 items-end gap-2 sm:gap-4">
            {chartData.map((record, index) => {
              const height = (record.value / maxValue) * 100;
              return (
                <div key={record.id} className="group relative flex flex-1 flex-col items-center">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.6, delay: index * 0.05, ease: "easeOut" }}
                    className="w-full rounded-t-lg bg-[color:var(--brand)] opacity-80 transition group-hover:opacity-100"
                  />
                  <div className="absolute -top-8 hidden text-xs font-bold text-[color:var(--foreground)] group-hover:block">
                    {record.value}{record.unit}
                  </div>
                  <div className="mt-3 overflow-hidden text-center text-[10px] font-medium text-[color:var(--muted-foreground)] opacity-60">
                    {new Date(record.achievedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 border-t border-[color:var(--border)] pt-6 sm:grid-cols-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted-foreground)]">Current Max</p>
              <p className="mt-1 text-xl font-bold text-[color:var(--foreground)]">{chartData[chartData.length - 1].value}{chartData[chartData.length - 1].unit}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted-foreground)]">Starting point</p>
              <p className="mt-1 text-xl font-bold text-[color:var(--foreground)]">{chartData[0].value}{chartData[0].unit}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted-foreground)]">Total Gains</p>
              <p className="mt-1 text-xl font-bold text-[color:var(--support)]">
                +{chartData[chartData.length - 1].value - chartData[0].value}{chartData[0].unit}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[color:var(--muted-foreground)]">Data Points</p>
              <p className="mt-1 text-xl font-bold text-[color:var(--foreground)]">{chartData.length}</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="flex h-64 items-center justify-center border-dashed p-6 text-center">
          <p className="text-sm text-[color:var(--muted-foreground)]">
            No record data available for this exercise yet. <br /> Log more breakthroughs to unlock analytics.
          </p>
        </Card>
      )}
    </div>
  );
}
