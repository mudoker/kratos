import type { BodyHighlightSlug, Exercise, WeeklyPlan } from "./types";

/**
 * Calculates weighted muscle intensities based on a weekly plan.
 * Primary muscles (first 2 slugs) get 100% weight.
 * Secondary muscles get 20% weight.
 * Thresholds are absolute: 14+ Red, 10-13 Orange, 5-9 Yellow, 1-4 Green.
 */
export function calculateMuscleIntensities(plan: WeeklyPlan, exercises: Exercise[]) {
  const frequency: Record<string, number> = {};
  
  plan.days.forEach((day) => {
    day.items.forEach((item) => {
      const exercise = exercises.find((e) => e.id === item.exerciseId);
      if (!exercise) return;
      
      exercise.bodyRegionSlugs.forEach((slug, idx) => {
        const weight = idx < 2 ? 1.0 : 0.2;
        frequency[slug] = (frequency[slug] || 0) + (item.sets * weight);
      });
    });
  });

  return Object.entries(frequency).map(([slug, weightedSets]) => {
    let intensity = 1;
    if (weightedSets >= 14) intensity = 4;
    else if (weightedSets >= 10) intensity = 3;
    else if (weightedSets >= 5) intensity = 2;
    
    return {
      slug: slug as BodyHighlightSlug,
      intensity,
      weightedSets
    };
  });
}
