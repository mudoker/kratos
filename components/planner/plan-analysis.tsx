"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import type { DashboardData, WeeklyPlan, BodyHighlightSlug, ExerciseCategory } from "@/lib/types";
import { MuscleMap } from "@/components/shared/muscle-map";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

export function PlanAnalysis({ plan, data }: { plan: WeeklyPlan; data: DashboardData }) {
  const stats = useMemo(() => {
    const muscleSets: Record<string, number> = {};
    const categorySets: Record<string, number> = {};
    let totalSets = 0;

    plan.days.forEach((day) => {
      day.items.forEach((item) => {
        const exercise = data.exercises.find((e) => e.id === item.exerciseId);
        if (!exercise) return;

        totalSets += item.sets;

        // Category distribution
        categorySets[exercise.category] = (categorySets[exercise.category] || 0) + item.sets;

        // BIOLOGICAL STIMULUS WEIGHTING (Matching Dashboard logic)
        exercise.bodyRegionSlugs.forEach((slug, idx) => {
          const weight = idx < 2 ? 1.0 : 0.2;
          muscleSets[slug] = (muscleSets[slug] || 0) + (item.sets * weight);
        });
      });
    });

    // ABSOLUTE THRESHOLD INTENSITIES (Matching Dashboard logic)
    const intensities = Object.entries(muscleSets).map(([slug, weightedSets]) => {
      let intensity = 1;
      if (weightedSets >= 14) intensity = 4;
      else if (weightedSets >= 10) intensity = 3;
      else if (weightedSets >= 5) intensity = 2;
      
      return {
        slug: slug as BodyHighlightSlug,
        intensity
      };
    });

    return { muscleSets, categorySets, totalSets, intensities };
  }, [plan, data.exercises]);

  const categories: ExerciseCategory[] = ["Push", "Pull", "Legs", "Core", "Conditioning", "Mobility"];

  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(280px,360px)]">
      <div className="space-y-3">
        <Card className="rounded-xl border-border bg-card p-4 shadow-none sm:p-5">
          <CardTitle className="text-sm font-semibold text-foreground">Weekly Stimulus Distribution</CardTitle>
          <CardDescription className="mt-1 text-xs">
            Volume breakdown by movement category (total sets per week).
          </CardDescription>
          <div className="mt-5 space-y-4">
            {categories.map((cat) => {
              const count = stats.categorySets[cat] || 0;
              const percentage = stats.totalSets ? (count / stats.totalSets) * 100 : 0;
              return (
                <div key={cat} className="space-y-2">
                  <div className="flex justify-between gap-3 text-xs font-semibold">
                    <span className="text-foreground">{cat}</span>
                    <span className="text-muted-foreground">{count} sets</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full border border-border bg-background">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className="h-full bg-foreground"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="rounded-xl border-border bg-card p-4 shadow-none sm:p-5">
          <CardTitle className="text-sm font-semibold text-foreground">Biological Stimulus Score</CardTitle>
          <CardDescription className="mt-1 text-xs">
            Weighted weekly volume per muscle group. 14+ sets is considered Max Stimulus (Red).
          </CardDescription>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            {Object.entries(stats.muscleSets)
              .sort((a, b) => b[1] - a[1])
              .map(([slug, count]) => (
                <div key={slug} className="rounded-xl border border-border bg-background p-3">
                  <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    {slug.replaceAll("-", " ")}
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">{count.toFixed(1)} w-sets/wk</p>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <div className="h-fit lg:sticky lg:top-6">
        <MuscleMap
          intensities={stats.intensities}
          profile={data.profile}
          title="Stimulus Intensity Map"
        />
      </div>
    </div>
  );
}
