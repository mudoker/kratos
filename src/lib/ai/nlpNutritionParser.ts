import { db } from '../db/dexie';
import type { NutritionLog } from '../db/schema';

// Mock NLP parsing of nutritional text
// In a production app, this would call a local or remote LLM
export const parseNutritionText = async (text: string): Promise<Partial<NutritionLog>> => {
  const normalized = text.toLowerCase();
  
  // Basic heuristic-based parsing for simulation
  let kcals = 0;
  let protein = 0;
  let carbs = 0;
  let fats = 0;
  let confidence = 0.7;

  if (normalized.includes('pho')) {
    kcals = 550; protein = 35; carbs = 65; fats = 12; confidence = 0.85;
  } else if (normalized.includes('coffee') && normalized.includes('condensed')) {
    kcals = 220; protein = 4; carbs = 32; fats = 9; confidence = 0.92;
  } else if (normalized.includes('chicken') && normalized.includes('rice')) {
    kcals = 600; protein = 45; carbs = 50; fats = 15; confidence = 0.88;
  } else if (normalized.includes('protein shake')) {
    kcals = 150; protein = 30; carbs = 5; fats = 2; confidence = 0.95;
  } else {
    // Randomish fallback for unknown items
    kcals = 400; protein = 20; carbs = 40; fats = 15; confidence = 0.4;
  }

  return {
    rawText: text,
    timestamp: new Date(),
    kcals,
    protein,
    carbs,
    fats,
    confidence
  };
};

export const saveNutritionLog = async (log: Partial<NutritionLog>) => {
  if (!log.kcals) return;
  return await db.nutrition.add(log as NutritionLog);
};
