export interface Workout {
  id?: number;
  date: Date;
  muscleGroups: string[];
  exercises: ExerciseSession[];
  readinessScore: number;
  notes?: string;
}

export interface ExerciseSession {
  exerciseId: string;
  name: string;
  sets: WorkoutSet[];
}

export interface WorkoutSet {
  weight: number;
  reps: number;
  rir: number; // Reps In Reserve
  rpe?: number; // Rate of Perceived Exertion
}

export interface NutritionLog {
  id?: number;
  timestamp: Date;
  rawText: string;
  kcals: number;
  protein: number;
  carbs: number;
  fats: number;
  confidence: number;
}

export interface SleepLog {
  id?: number;
  date: string; // YYYY-MM-DD
  duration: number; // hours
  quality: number; // 1-10
  deepSleep?: number;
  remSleep?: number;
}

export interface Biometrics {
  id?: number;
  date: Date;
  weight: number;
  bodyFat?: number;
  sfr?: Record<string, number>; // Stimulus-to-Fatigue Ratio per muscle group
}
