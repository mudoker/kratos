"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { WorkoutSession } from "@/lib/types";
import { cn } from "@/lib/utils";

export function WorkoutHeatmap({ sessions }: { sessions: WorkoutSession[] }) {
  const days = 140; // Approx 20 weeks
  const today = new Date();
  
  const heatmapData = useMemo(() => {
    const data: Record<string, number> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.startedAt).toISOString().split('T')[0];
      // Intensity score: number of exercises + (total "results" logged as a proxy for effort)
      const exerciseCount = session.items.length;
      const resultsCount = session.items.filter(item => item.result.trim()).length;
      const score = exerciseCount + resultsCount;
      
      data[date] = (data[date] || 0) + score;
    });
    
    return data;
  }, [sessions]);

  const maxScore = useMemo(() => {
    const scores = Object.values(heatmapData);
    return scores.length > 0 ? Math.max(...scores) : 1;
  }, [heatmapData]);

  const grid = useMemo(() => {
    const items = [];
    for (let i = days; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const score = heatmapData[dateStr] || 0;
      
      // Map score to 0-4 intensity level
      let level = 0;
      if (score > 0) {
        level = Math.min(Math.ceil((score / maxScore) * 4), 4);
      }
      
      items.push({ date: dateStr, level, score });
    }
    return items;
  }, [heatmapData, maxScore, today]);

  const getColor = (level: number) => {
    switch (level) {
      case 1: return "bg-[#82ca9d]"; // Soft green
      case 2: return "bg-[#ffd36b]"; // Yellow
      case 3: return "bg-[#ff9f0a]"; // Orange
      case 4: return "bg-[#c81e1e]"; // Deep red
      default: return "bg-black/5";
    }
  };

  return (
    <div className="w-full overflow-hidden">
      <div className="flex flex-wrap gap-1.5">
        {grid.map((item, idx) => (
          <motion.div
            key={item.date}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: idx * 0.002 }}
            className={cn(
              "h-3 w-3 rounded-[3px] transition-colors duration-300 sm:h-3.5 sm:w-3.5",
              getColor(item.level)
            )}
            title={`${item.date}: ${item.score} intensity score`}
          />
        ))}
      </div>
      <div className="mt-4 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[color:var(--muted-foreground)] opacity-60">
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
