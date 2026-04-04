"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WorkoutHeatmap({ sessions }: { sessions: WorkoutSession[] }) {
  const daysToShow = 140; // Approx 20 weeks
  const today = new Date();
  
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.startedAt).toISOString().split('T')[0];
      const exerciseCount = session.items.length;
      // In new format, sets are an array. In old format, result was a string.
      // We count either sets or check if result string has content.
      const resultPoints = session.items.reduce((acc, item) => {
        if (Array.isArray(item.sets)) return acc + item.sets.length;
        return acc + ((item as any).result?.trim() ? 1 : 0);
      }, 0);
      
      const score = exerciseCount + resultPoints;
      data[date] = (data[date] || 0) + score;
    });
    
    return data;
  }, [sessions]);

  const maxScore = useMemo(() => {
    const scores = Object.values(heatmapData);
    return scores.length > 0 ? Math.max(...scores) : 1;
  }, [heatmapData]);

  const { grid, monthLabels } = useMemo(() => {
    const items = [];
    const labels: { label: string; index: number }[] = [];
    let lastMonth = -1;

    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const score = heatmapData[dateStr] || 0;
      
      let level = 0;
      if (score > 0) {
        level = Math.min(Math.ceil((score / maxScore) * 4), 4);
      }
      
      const currentMonth = date.getMonth();
      if (currentMonth !== lastMonth) {
        labels.push({
          label: date.toLocaleString('default', { month: 'short' }),
          index: items.length
        });
        lastMonth = currentMonth;
      }
      
      items.push({ date: dateStr, level, score, dayOfWeek: date.getDay() });
    }
    return { grid: items, monthLabels: labels };
  }, [heatmapData, maxScore, today]);

  const getColor = (level: number) => {
    switch (level) {
      case 1: return "bg-[#82ca9d]"; 
      case 2: return "bg-[#ffd36b]"; 
      case 3: return "bg-[#ff9f0a]"; 
      case 4: return "bg-[#c81e1e]"; 
      default: return "bg-black/5";
    }
  };

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="w-full">
      <div className="flex">
        {/* Y Labels */}
        <div className="mr-2 flex flex-col justify-between py-1 text-[9px] font-bold uppercase tracking-tighter text-[color:var(--muted-foreground)] opacity-50">
          {dayNames.map((day, i) => (
            <span key={day} className={i % 2 === 0 ? "invisible" : ""}>{day}</span>
          ))}
        </div>

        <div className="flex-1">
          {/* X Labels (Months) */}
          <div className="relative mb-2 h-4 w-full">
            {monthLabels.map((m, i) => (
              <span 
                key={`${m.label}-${i}`} 
                className="absolute text-[9px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-50"
                style={{ left: `${(m.index / grid.length) * 100}%` }}
              >
                {m.label}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {grid.map((item, idx) => (
              <motion.div
                key={item.date}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: idx * 0.001 }}
                className={cn(
                  "h-3 w-3 rounded-[3px] transition-colors duration-300 sm:h-3.5 sm:w-3.5",
                  getColor(item.level)
                )}
                title={`${item.date}: ${item.score} points`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-4 text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">
        <span>Less active</span>
        <div className="flex gap-1">
          <div className="h-2.5 w-2.5 rounded-[2px] bg-black/5" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-[#82ca9d]" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-[#ffd36b]" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-[#ff9f0a]" />
          <div className="h-2.5 w-2.5 rounded-[2px] bg-[#c81e1e]" />
        </div>
        <span>High intensity</span>
      </div>
    </div>
  );
}
