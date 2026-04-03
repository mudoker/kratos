import type { NutritionLog, SleepLog } from '../db/schema';

/**
 * 1. Holistic Readiness Score (HRS)
 * Weighted algorithm: Sleep (40%), Nutrition (30%), Training Fatigue (30%)
 */
export const calculateHRS = (
  sleep: SleepLog,
  nutrition: NutritionLog,
  userWeight: number,
  targetKcals: number,
  acwr: number
): number => {
  // Sleep Component (Sc, 40%)
  let sc = Math.min(100, (sleep.duration / 8) * 100);
  if (sleep.quality <= 3) sc -= 15; // Penalty for Poor quality
  sc = Math.max(0, sc);

  // Nutrition Component (Nc, 30%)
  const kcalDev = Math.abs(nutrition.kcals - targetKcals);
  let nc = 100;
  if (kcalDev > 150) {
    nc -= (Math.floor((kcalDev - 150) / 50) + 1) * 2;
  }
  
  // Protein Adherence (< 1.6g/kg)
  const proteinPerKg = nutrition.protein / userWeight;
  if (proteinPerKg < 1.6) {
    nc *= 0.5;
  }
  nc = Math.max(0, nc);

  // Fatigue Component (Fc, 30%)
  let fc = 50; // Neutral default
  if (acwr >= 0.8 && acwr <= 1.3) fc = 100; // Sweet spot
  else if (acwr > 1.5) fc = 30; // Danger zone
  else if (acwr < 0.8) fc = 70; // Under-training

  const hrs = (sc * 0.40) + (nc * 0.30) + (fc * 0.30);
  return Math.round(hrs);
};

/**
 * 2. Acute:Chronic Workload Ratio (ACWR)
 * Aw: 7-day rolling tonnage avg, Cw: 28-day rolling tonnage avg
 */
export const calculateACWR = (acuteTonnage: number[], chronicTonnage: number[]): number => {
  if (chronicTonnage.length === 0) return 1.0;
  const aw = acuteTonnage.reduce((a, b) => a + b, 0) / Math.max(acuteTonnage.length, 1);
  const cw = chronicTonnage.reduce((a, b) => a + b, 0) / Math.max(chronicTonnage.length, 1);
  return cw === 0 ? 1.0 : aw / cw;
};

export const getACWRStatus = (acwr: number) => {
  if (acwr < 0.8) return { label: 'Under-training', color: 'text-blue-400', alert: false };
  if (acwr <= 1.3) return { label: 'Sweet Spot', color: 'text-green-400', alert: false };
  if (acwr <= 1.5) return { label: 'Caution', color: 'text-amber-400', alert: false };
  return { label: 'Danger Zone', color: 'text-red-500', alert: true };
};

/**
 * 3. Dynamic TDEE & Metabolic Adaptation (Katch-McArdle)
 * BMR = 370 + (21.6 * LBM)
 */
export const calculateBMR = (weight: number, bodyFat: number): number => {
  const lbm = weight * (1 - bodyFat / 100);
  return 370 + (21.6 * lbm);
};

export const detectMetabolicAdaptation = (
  weightTrend: number[], // 14-day rolling weight
  isDeficitGoal: boolean
): number => {
  if (weightTrend.length < 14) return 0;
  const weightChange = Math.abs(weightTrend[0] - weightTrend[weightTrend.length - 1]);
  
  if (isDeficitGoal && weightChange < 0.1) {
    return -150; // Metabolic adaptation adjustment
  }
  return 0;
};

/**
 * 4. Volume Landmarks
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
 * 5. Rest Timer Auto-Regulation Matrix
 */
export const getRecommendedRest = (exerciseName: string, rpe: number): number => {
  const isCompound = /squat|deadlift|press|row/i.test(exerciseName);
  if (isCompound && rpe >= 8) return 300; // 5 mins
  if (isCompound) return 180; // 3 mins
  if (rpe >= 8) return 90; // 1.5 mins
  return 60; // 1 min
};
