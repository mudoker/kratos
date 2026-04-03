import type { NutritionLog, SleepLog, Workout } from '../db/schema';

/**
 * 1. Holistic Readiness Score (HRS)
 */
export const calculateHRS = (
  sleep: SleepLog,
  nutrition: NutritionLog,
  userWeight: number,
  targetKcals: number,
  acwr: number
): number => {
  let sc = Math.min(100, (sleep.duration / 8) * 100);
  if (sleep.quality <= 3) sc -= 15;
  sc = Math.max(0, sc);

  const kcalDev = Math.abs(nutrition.kcals - targetKcals);
  let nc = 100;
  if (kcalDev > 150) {
    nc -= (Math.floor((kcalDev - 150) / 50) + 1) * 2;
  }
  
  const proteinPerKg = nutrition.protein / userWeight;
  if (proteinPerKg < 1.6) nc *= 0.5;
  nc = Math.max(0, nc);

  let fc = 50;
  if (acwr >= 0.8 && acwr <= 1.3) fc = 100;
  else if (acwr > 1.5) fc = 30;
  else if (acwr < 0.8) fc = 70;

  return Math.round((sc * 0.40) + (nc * 0.30) + (fc * 0.30));
};

/**
 * 2. Tonnage & ACWR
 */
export const calculateDailyTonnage = (workout: Workout): number => {
  return workout.exercises.reduce((total, ex) => {
    return total + ex.sets.reduce((exTotal, set) => exTotal + (set.weight * set.reps), 0);
  }, 0);
};

export const calculateACWR = (acuteTonnages: number[], chronicTonnages: number[]): number => {
  const aw = acuteTonnages.length ? acuteTonnages.reduce((a, b) => a + b, 0) / acuteTonnages.length : 0;
  const cw = chronicTonnages.length ? chronicTonnages.reduce((a, b) => a + b, 0) / chronicTonnages.length : 1;
  return aw / (cw || 1);
};

export const getACWRStatus = (acwr: number) => {
  if (acwr < 0.8) return { label: 'Under-training', color: 'text-blue-400', alert: false };
  if (acwr <= 1.3) return { label: 'Sweet Spot', color: 'text-green-400', alert: false };
  if (acwr <= 1.5) return { label: 'Caution', color: 'text-amber-400', alert: false };
  return { label: 'Danger Zone', color: 'text-red-500', alert: true };
};

/**
 * 3. Metabolic Adaptation Detection
 */
export const detectMetabolicAdaptation = (
  weightTrend: number[],
  isDeficitGoal: boolean
): number => {
  if (weightTrend.length < 14) return 0;
  const weightChange = Math.abs(weightTrend[0] - weightTrend[weightTrend.length - 1]);
  if (isDeficitGoal && weightChange < 0.1) return -150;
  return 0;
};

/**
 * 4. Muscle SFR (Stimulus-to-Fatigue Ratio)
 */
export const calculateMuscleSFR = (
  weeklySets: number,
  landmarks: MuscleGroupLandmarks,
  avgSleep: number,
  isCaloricDeficit: boolean
): number => {
  const stimulus = weeklySets / landmarks.MAV[1];
  let recoveryFactor = avgSleep / 8;
  if (isCaloricDeficit) recoveryFactor *= 0.85;
  return stimulus / (recoveryFactor || 1);
};

/**
 * 5. Volume Landmarks
 */
export interface MuscleGroupLandmarks {
  MEV: number;
  MAV: [number, number];
  MRV: number;
}

export const VOLUME_LANDMARKS: Record<string, MuscleGroupLandmarks> = {
  chest: { MEV: 6, MAV: [10, 16], MRV: 20 },
  quads: { MEV: 8, MAV: [12, 18], MRV: 22 },
  back: { MEV: 8, MAV: [12, 20], MRV: 25 },
  shoulders: { MEV: 6, MAV: [8, 14], MRV: 18 },
  arms: { MEV: 4, MAV: [8, 12], MRV: 16 },
};

export const getMuscleStatus = (weeklySets: number, landmarks: MuscleGroupLandmarks) => {
  if (weeklySets > landmarks.MRV) return 'OVERREACHING';
  if (weeklySets >= landmarks.MAV[0]) return 'OPTIMAL';
  return 'UNDER_STIMULATED';
};

/**
 * 6. Rest Matrix
 */
export const getRecommendedRest = (exerciseName: string, rpe: number): number => {
  const isCompound = /squat|deadlift|press|row|bench|clean/i.test(exerciseName);
  if (isCompound && rpe >= 9) return 300;
  if (isCompound && rpe >= 7) return 180;
  if (rpe >= 9) return 90;
  return 60;
};
