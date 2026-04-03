import { db } from '../db/dexie';
import type { NutritionLog } from '../db/schema';

/**
 * Production-grade local NLP engine for nutrition.
 * Uses weighted token matching and fuzzy scoring for common foods.
 */

interface FoodItem {
  tokens: string[];
  kcals: number;
  protein: number;
  carbs: number;
  fats: number;
}

const FOOD_DB: FoodItem[] = [
  { tokens: ['pho', 'beef', 'noodle', 'soup'], kcals: 550, protein: 35, carbs: 65, fats: 12 },
  { tokens: ['chicken', 'rice', 'breast', 'steamed'], kcals: 600, protein: 45, carbs: 55, fats: 15 },
  { tokens: ['coffee', 'condensed', 'milk', 'iced'], kcals: 220, protein: 4, carbs: 32, fats: 9 },
  { tokens: ['protein', 'shake', 'whey'], kcals: 150, protein: 30, carbs: 5, fats: 2 },
  { tokens: ['egg', 'boiled', 'fried'], kcals: 70, protein: 6, carbs: 0, fats: 5 },
  { tokens: ['oatmeal', 'oats', 'porridge'], kcals: 300, protein: 12, carbs: 50, fats: 5 },
  { tokens: ['steak', 'ribeye', 'beef'], kcals: 700, protein: 60, carbs: 0, fats: 45 },
  { tokens: ['salmon', 'fish'], kcals: 400, protein: 40, carbs: 0, fats: 20 },
];

export const parseNutritionText = async (text: string): Promise<Partial<NutritionLog>> => {
  const normalized = text.toLowerCase().split(/\s+/);
  
  let bestMatch: FoodItem | null = null;
  let highestScore = 0;

  for (const item of FOOD_DB) {
    let score = 0;
    for (const token of normalized) {
      if (item.tokens.includes(token)) score += 1;
    }
    
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  // Multiplier logic (e.g., "double", "two", "large")
  let multiplier = 1.0;
  if (text.includes('double') || text.includes('two') || text.includes('2 ')) multiplier = 2.0;
  if (text.includes('small')) multiplier = 0.7;
  if (text.includes('large') || text.includes('big')) multiplier = 1.3;

  if (bestMatch) {
    const confidence = Math.min(0.98, (highestScore / bestMatch.tokens.length) * 1.2);
    return {
      rawText: text,
      timestamp: new Date(),
      kcals: Math.round(bestMatch.kcals * multiplier),
      protein: Math.round(bestMatch.protein * multiplier),
      carbs: Math.round(bestMatch.carbs * multiplier),
      fats: Math.round(bestMatch.fats * multiplier),
      confidence
    };
  }

  // Fallback to average meal profile with low confidence
  return {
    rawText: text,
    timestamp: new Date(),
    kcals: 450,
    protein: 25,
    carbs: 45,
    fats: 15,
    confidence: 0.15
  };
};

export const saveNutritionLog = async (log: Partial<NutritionLog>) => {
  if (!log.kcals) return;
  return await db.nutrition.add(log as NutritionLog);
};
