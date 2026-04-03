import { db } from '../db/dexie';
import type { NutritionLog } from '../db/schema';

/**
 * Production-grade local NLP engine with External API Fallback.
 * Integrates Open Food Facts for real-time product lookups.
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
];

export const parseNutritionText = async (text: string): Promise<Partial<NutritionLog>> => {
  const normalized = text.toLowerCase();
  
  // 1. Try External Product Lookup (Open Food Facts)
  if (text.length > 3) {
    try {
      const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(text)}&search_simple=1&action=process&json=1&page_size=1`);
      const data = await response.json();
      
      if (data.products && data.products.length > 0) {
        const product = data.products[0];
        const nutrients = product.nutriments;
        
        if (nutrients['energy-kcal_100g']) {
          return {
            rawText: text,
            timestamp: new Date(),
            kcals: Math.round(nutrients['energy-kcal_100g'] * 2.5), // Estimating 250g serving
            protein: Math.round(nutrients['proteins_100g'] * 2.5 || 0),
            carbs: Math.round(nutrients['carbohydrates_100g'] * 2.5 || 0),
            fats: Math.round(nutrients['fat_100g'] * 2.5 || 0),
            confidence: 0.95
          };
        }
      }
    } catch (err) {
      console.warn("External API fetch failed, falling back to local NLP", err);
    }
  }

  // 2. Fallback to Local NLP Engine
  const tokens = normalized.split(/\s+/);
  let bestMatch: FoodItem | null = null;
  let highestScore = 0;

  for (const item of FOOD_DB) {
    let score = 0;
    for (const token of tokens) {
      if (item.tokens.includes(token)) score += 1;
    }
    if (score > highestScore) {
      highestScore = score;
      bestMatch = item;
    }
  }

  let multiplier = 1.0;
  if (text.includes('double') || text.includes('two')) multiplier = 2.0;

  if (bestMatch && highestScore > 0) {
    return {
      rawText: text,
      timestamp: new Date(),
      kcals: Math.round(bestMatch.kcals * multiplier),
      protein: Math.round(bestMatch.protein * multiplier),
      carbs: Math.round(bestMatch.carbs * multiplier),
      fats: Math.round(bestMatch.fats * multiplier),
      confidence: 0.7
    };
  }

  return {
    rawText: text,
    timestamp: new Date(),
    kcals: 400,
    protein: 20,
    carbs: 40,
    fats: 15,
    confidence: 0.1
  };
};

export const saveNutritionLog = async (log: Partial<NutritionLog>) => {
  if (!log.kcals) return;
  return await db.nutrition.add(log as NutritionLog);
};
