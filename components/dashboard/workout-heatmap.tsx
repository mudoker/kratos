"use client";

import { useMemo, useState, useEffect, useRef, cloneElement } from "react";
import { ActivityCalendar, ThemeInput } from "react-activity-calendar";
import type { WorkoutSession } from "@/lib/types";
import { AnimatePresence, motion } from "framer-motion";

export function WorkoutHeatmap({ sessions }: { sessions: WorkoutSession[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [hovered, setHovered] = useState<{ date: string; count: number; x: number; y: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const heatmapData = useMemo(() => {
    const daysToShow = 365; // A full year
    const data: Record<string, number> = {};
    
    sessions.forEach(session => {
      const date = new Date(session.startedAt).toISOString().split('T')[0];
      const exerciseCount = session.items.length;
      const resultPoints = session.items.reduce((acc, item) => {
        if (Array.isArray(item.sets)) return acc + item.sets.length;
        return acc + ((item as any).result?.trim() ? 1 : 0);
      }, 0);
      
      const score = exerciseCount + resultPoints;
      data[date] = (data[date] || 0) + score;
    });

    const maxScore = Object.values(data).length > 0 
      ? Math.max(...Object.values(data)) 
      : 1;

    const today = new Date();
    const calendarData = [];

    // Make sure we generate exactly the last 365 days continuously
    for (let i = daysToShow; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const score = data[dateStr] || 0;
      
      let level = 0;
      if (score > 0) {
        level = Math.min(Math.ceil((score / maxScore) * 4), 4);
      }
      
      calendarData.push({
        date: dateStr,
        count: score,
        level: level as 0 | 1 | 2 | 3 | 4
      });
    }

    return calendarData;
  }, [sessions]);

  const explicitTheme: ThemeInput = {
    light: ['#0000000D', '#82ca9d', '#ffd36b', '#ff9f0a', '#c81e1e'], // bg-black/5 for level 0
    dark: ['#ffffff0D', '#82ca9d', '#ffd36b', '#ff9f0a', '#c81e1e'], // bg-white/5 for level 0
  };

  // 53 weeks * (blockSize + blockMargin) - blockMargin = totalWidth
  // blockSize + blockMargin = (totalWidth + blockMargin) / 53
  // Let blockMargin be roughly 20% of blockSize, or a fixed value like 4.
  // We also have to account for labels or right/left padding if any.
  // The library uses 53 weeks. Let's assume a margin of 4.
  const blockMargin = 4;
  const weeks = 53;
  // Account for the month labels and legend if they take up space? The library doesn't strictly increase width for month labels (they hover over).
  // Calculate dynamic block size. Default to 12 if containerWidth is 0.
  const calculatedBlockSize = containerWidth > 0 
    ? Math.max(Math.floor((containerWidth - (weeks - 1) * blockMargin) / weeks), 2)
    : 12;

  return (
    <div className="relative w-full overflow-hidden pb-4" ref={containerRef}>
      {containerWidth > 0 && (
        <ActivityCalendar
          data={heatmapData}
          theme={explicitTheme}
          colorScheme="light"
          blockSize={calculatedBlockSize}
          blockMargin={blockMargin}
          blockRadius={2}
          fontSize={10}
          labels={{
            legend: {
              less: 'Less',
              more: 'More',
            },
            totalCount: '{{count}} exercises/sets in {{year}}',
          }}
          renderBlock={(block, activity) => {
            return cloneElement(block, {
              onMouseEnter: (e: any) => {
                if (!containerRef.current) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const containerRect = containerRef.current.getBoundingClientRect();
                setHovered({
                  date: activity.date,
                  count: activity.count,
                  x: rect.left - containerRect.left + rect.width / 2,
                  y: rect.top - containerRect.top,
                });
              },
              onMouseLeave: () => {
                setHovered(null);
              },
            });
          }}
        />
      )}
      
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="pointer-events-none absolute z-50 flex -translate-x-1/2 -translate-y-full flex-col gap-1 rounded-xl border border-[color:var(--border)] bg-[linear-gradient(180deg,#1a1a1a,#242424)] px-3 py-2 text-white shadow-[0_12px_30px_rgba(0,0,0,0.15)] backdrop-blur-xl"
            style={{
              left: hovered.x,
              top: hovered.y - 8,
            }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/60">
              {new Date(hovered.date).toLocaleDateString(undefined, { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
            <p className="font-[family:var(--font-display)] text-base font-semibold leading-none">
              {hovered.count === 0 ? "Rest Day" : `${hovered.count} ${hovered.count === 1 ? 'exercise/set' : 'exercises/sets'}`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
