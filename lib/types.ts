export type ExerciseCategory =
  | "Push"
  | "Pull"
  | "Legs"
  | "Core"
  | "Conditioning"
  | "Mobility";

export type BodyHighlightSlug =
  | "trapezius"
  | "triceps"
  | "forearm"
  | "adductors"
  | "calves"
  | "neck"
  | "deltoids"
  | "hands"
  | "feet"
  | "head"
  | "ankles"
  | "tibialis"
  | "obliques"
  | "chest"
  | "biceps"
  | "abs"
  | "quadriceps"
  | "knees"
  | "upper-back"
  | "lower-back"
  | "hamstring"
  | "gluteal";

export type AppUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
};

export type Exercise = {
  id: string;
  name: string;
  category: ExerciseCategory;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  bodyRegionSlugs: BodyHighlightSlug[];
  equipment: string;
  instructions: string[];
  defaultRestSeconds: number;
  videoUrl?: string;
  imageUrl?: string;
};

export type WeeklyPlanItem = {
  id: string;
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  targetLoad: string;
  targetRpe: string;
  prGoal: string;
  notes: string;
  order: number;
};

export type WeeklyPlanDay = {
  id: string;
  day: number;
  title: string;
  focus: string;
  warmup: string;
  sessionGoal: string;
  targetMuscles: string[];
  notes: string;
  items: WeeklyPlanItem[];
};

export type WeeklyPlan = {
  id: string;
  userId: string;
  name: string;
  notes: string;
  orderIndex: number;
  days: WeeklyPlanDay[];
  createdAt: string;
  updatedAt: string;
};

export type PersonalRecord = {
  id: string;
  userId: string;
  exerciseId: string;
  value: number;
  unit: "kg" | "lb" | "reps" | "seconds";
  reps: number;
  achievedAt: string;
  notes: string;
};

export type WorkoutSet = {
  weight: string;
  reps: string;
};

export type WorkoutSessionItem = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  plannedSets: number;
  reps: string;
  restSeconds: number;
  targetLoad: string;
  targetRpe: string;
  sets: WorkoutSet[];
  notes: string;
  order: number;
};

export type WorkoutSession = {
  id: string;
  userId: string;
  planId?: string | null;
  planDayId?: string | null;
  startedAt: string;
  endedAt?: string | null;
  day: number;
  title: string;
  effort: string;
  notes: string;
  items: WorkoutSessionItem[];
};

export type CoachMessage = {
  id: string;
  userId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
};

export type UserProfile = {
  userId: string;
  goal: string;
  experienceLevel: string;
  weeklySessions: number;
  height?: number;
  weight?: number;
  age?: number;
  nickname?: string;
  pronouns?: string;
  activityLevel?: string;
  sleepHours?: number;
  medicalConditions?: string;
  injuries: string;
  notes: string;
  bodyGender: "male" | "female";
};

export type DashboardData = {
  user: AppUser;
  profile: UserProfile;
  exercises: Exercise[];
  plans: WeeklyPlan[];
  records: PersonalRecord[];
  sessions: WorkoutSession[];
  coachMessages: CoachMessage[];
};
