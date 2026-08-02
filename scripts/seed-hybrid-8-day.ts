import { pool } from "@/lib/db";
import { savePlan } from "@/lib/data";

const USER_ID = "dfd9e5f3-5b64-49e9-967e-282e154df3df";

type ExerciseSupportRow = {
  id: string;
  name: string;
  category: "Push" | "Pull" | "Legs" | "Core";
  equipment: string;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  bodyRegionSlugs: string[];
  restSeconds?: number;
};

const supportRows: ExerciseSupportRow[] = [
  { id: "smith-machine-incline-press", name: "Smith Machine Incline Press", category: "Push", equipment: "Smith Machine", primaryMuscles: ["Upper Chest"], secondaryMuscles: ["Anterior Delts", "Triceps"], bodyRegionSlugs: ["chest", "front-delts", "triceps"], restSeconds: 150 },
  { id: "barbell-floor-press", name: "Barbell Floor Press", category: "Push", equipment: "Barbell", primaryMuscles: ["Chest"], secondaryMuscles: ["Triceps", "Anterior Delts"], bodyRegionSlugs: ["chest", "triceps", "front-delts"], restSeconds: 120 },
  { id: "seated-db-shoulder-press", name: "Seated DB Shoulder Press", category: "Push", equipment: "Dumbbells", primaryMuscles: ["Shoulders"], secondaryMuscles: ["Triceps", "Upper Chest"], bodyRegionSlugs: ["front-delts", "side-delts", "triceps"], restSeconds: 120 },
  { id: "overhead-db-triceps-extension", name: "Overhead DB Triceps Extension", category: "Push", equipment: "Dumbbell", primaryMuscles: ["Triceps"], secondaryMuscles: ["Shoulders"], bodyRegionSlugs: ["triceps"], restSeconds: 75 },
  { id: "overhead-cable-triceps-extension", name: "Overhead Cable Triceps Extension", category: "Push", equipment: "Cable", primaryMuscles: ["Triceps"], secondaryMuscles: ["Shoulders"], bodyRegionSlugs: ["triceps"], restSeconds: 75 },
  { id: "weighted-negative-pull-up", name: "Weighted / Negative Pull-Up", category: "Pull", equipment: "Pull-up Bar", primaryMuscles: ["Lats"], secondaryMuscles: ["Biceps", "Upper Back"], bodyRegionSlugs: ["lats", "biceps", "upper-back"], restSeconds: 150 },
  { id: "weighted-pull-up", name: "Weighted Pull-Up", category: "Pull", equipment: "Pull-up Bar", primaryMuscles: ["Lats"], secondaryMuscles: ["Biceps", "Upper Back"], bodyRegionSlugs: ["lats", "biceps", "upper-back"], restSeconds: 150 },
  { id: "chest-supported-t-bar-row", name: "Chest-Supported T-Bar Row", category: "Pull", equipment: "Machine", primaryMuscles: ["Mid Back"], secondaryMuscles: ["Lats", "Rear Delts", "Biceps"], bodyRegionSlugs: ["upper-back", "lats", "rear-delts"], restSeconds: 120 },
  { id: "db-pullover", name: "DB Pullover", category: "Pull", equipment: "Dumbbell", primaryMuscles: ["Lats"], secondaryMuscles: ["Chest", "Serratus"], bodyRegionSlugs: ["lats", "chest"], restSeconds: 90 },
  { id: "neutral-grip-lat-pulldown", name: "Neutral-Grip Lat Pulldown", category: "Pull", equipment: "Cable", primaryMuscles: ["Lats"], secondaryMuscles: ["Biceps", "Upper Back"], bodyRegionSlugs: ["lats", "biceps"], restSeconds: 90 },
  { id: "reverse-pec-deck", name: "Reverse Pec Deck", category: "Pull", equipment: "Machine", primaryMuscles: ["Rear Delts"], secondaryMuscles: ["Traps", "Rhomboids"], bodyRegionSlugs: ["rear-delts", "upper-back"], restSeconds: 60 },
  { id: "ez-bar-curl", name: "EZ-Bar Curl", category: "Pull", equipment: "EZ Bar", primaryMuscles: ["Biceps"], secondaryMuscles: ["Forearms"], bodyRegionSlugs: ["biceps", "forearms"], restSeconds: 60 },
  { id: "trx-fallout", name: "TRX Fallout", category: "Core", equipment: "TRX", primaryMuscles: ["Abs"], secondaryMuscles: ["Lats", "Shoulders"], bodyRegionSlugs: ["abs", "lats", "front-delts"], restSeconds: 60 },
  { id: "smith-machine-bulgarian-split-squat", name: "Smith Machine Bulgarian Split Squat", category: "Legs", equipment: "Smith Machine", primaryMuscles: ["Quads", "Glutes"], secondaryMuscles: ["Hamstrings"], bodyRegionSlugs: ["quads", "glutes", "hamstrings"], restSeconds: 120 },
  { id: "sliding-floor-hamstring-curl", name: "Sliding Floor Hamstring Curl", category: "Legs", equipment: "Bodyweight", primaryMuscles: ["Hamstrings"], secondaryMuscles: ["Glutes", "Calves"], bodyRegionSlugs: ["hamstrings", "glutes", "calves"], restSeconds: 75 },
  { id: "heel-elevated-db-cyclist-squat", name: "Heel-Elevated DB Cyclist Squat", category: "Legs", equipment: "Dumbbell", primaryMuscles: ["Quads"], secondaryMuscles: ["Glutes", "Calves"], bodyRegionSlugs: ["quads", "glutes", "calves"], restSeconds: 75 },
  { id: "standing-calf-raise", name: "Standing Calf Raise", category: "Legs", equipment: "Machine / Dumbbell", primaryMuscles: ["Calves"], secondaryMuscles: ["Ankles", "Feet"], bodyRegionSlugs: ["calves"], restSeconds: 60 },
  { id: "single-leg-db-calf-raise", name: "Single-Leg DB Calf Raise", category: "Legs", equipment: "Dumbbell", primaryMuscles: ["Calves"], secondaryMuscles: ["Ankles", "Feet"], bodyRegionSlugs: ["calves"], restSeconds: 60 },
  { id: "converging-chest-press-machine", name: "Converging Chest Press Machine", category: "Push", equipment: "Machine", primaryMuscles: ["Chest"], secondaryMuscles: ["Triceps", "Anterior Delts"], bodyRegionSlugs: ["chest", "triceps", "front-delts"], restSeconds: 120 },
  { id: "db-fly", name: "DB Fly", category: "Push", equipment: "Dumbbells", primaryMuscles: ["Chest"], secondaryMuscles: ["Anterior Delts"], bodyRegionSlugs: ["chest", "front-delts"], restSeconds: 75 },
  { id: "cable-crossover-mid-low", name: "Cable Crossover (Mid-to-Low)", category: "Push", equipment: "Cable", primaryMuscles: ["Chest"], secondaryMuscles: ["Anterior Delts"], bodyRegionSlugs: ["chest", "front-delts"], restSeconds: 75 },
  { id: "incline-machine-press", name: "Incline Machine Press", category: "Push", equipment: "Machine", primaryMuscles: ["Upper Chest"], secondaryMuscles: ["Triceps", "Anterior Delts"], bodyRegionSlugs: ["chest", "front-delts", "triceps"], restSeconds: 90 },
  { id: "pec-deck-to-failure", name: "Pec Deck to Failure", category: "Push", equipment: "Machine", primaryMuscles: ["Chest"], secondaryMuscles: ["Anterior Delts"], bodyRegionSlugs: ["chest", "front-delts"], restSeconds: 90 },
  { id: "lying-db-skullcrusher", name: "Lying DB Extension (Skullcrusher)", category: "Push", equipment: "Dumbbells", primaryMuscles: ["Triceps"], secondaryMuscles: ["Shoulders"], bodyRegionSlugs: ["triceps"], restSeconds: 75 },
  { id: "cable-vbar-triceps-pushdown", name: "Cable Triceps Pushdown (V-Bar)", category: "Push", equipment: "Cable", primaryMuscles: ["Triceps"], secondaryMuscles: ["Shoulders"], bodyRegionSlugs: ["triceps"], restSeconds: 75 },
  { id: "weighted-crunch", name: "Weighted Crunch", category: "Core", equipment: "Plate / Dumbbell", primaryMuscles: ["Abs"], secondaryMuscles: ["Hip Flexors"], bodyRegionSlugs: ["abs"], restSeconds: 60 },
  { id: "heavy-cable-crunch", name: "Heavy Cable Crunch", category: "Core", equipment: "Cable", primaryMuscles: ["Abs"], secondaryMuscles: ["Hip Flexors"], bodyRegionSlugs: ["abs"], restSeconds: 60 },
  { id: "chest-supported-db-row", name: "Chest-Supported DB Row", category: "Pull", equipment: "Dumbbells", primaryMuscles: ["Mid Back"], secondaryMuscles: ["Lats", "Rear Delts", "Biceps"], bodyRegionSlugs: ["upper-back", "lats", "rear-delts"], restSeconds: 90 },
  { id: "inverted-row", name: "Inverted Row", category: "Pull", equipment: "Bodyweight", primaryMuscles: ["Upper Back"], secondaryMuscles: ["Lats", "Biceps"], bodyRegionSlugs: ["upper-back", "lats", "biceps"], restSeconds: 90 },
  { id: "wide-grip-seated-cable-row", name: "Wide-Grip Seated Cable Row", category: "Pull", equipment: "Cable", primaryMuscles: ["Upper Back"], secondaryMuscles: ["Rear Delts", "Lats"], bodyRegionSlugs: ["upper-back", "rear-delts", "lats"], restSeconds: 90 },
  { id: "straight-arm-db-pullover", name: "Straight-Arm DB Pullover", category: "Pull", equipment: "Dumbbell", primaryMuscles: ["Lats"], secondaryMuscles: ["Chest", "Serratus"], bodyRegionSlugs: ["lats", "chest"], restSeconds: 75 },
  { id: "band-pull-apart", name: "Band Pull-Apart", category: "Pull", equipment: "Band", primaryMuscles: ["Rear Delts"], secondaryMuscles: ["Traps", "Rhomboids"], bodyRegionSlugs: ["rear-delts", "upper-back"], restSeconds: 60 },
  { id: "cable-rope-hammer-curl", name: "Cable Rope Hammer Curl", category: "Pull", equipment: "Cable", primaryMuscles: ["Brachialis", "Biceps"], secondaryMuscles: ["Forearms"], bodyRegionSlugs: ["biceps", "forearms"], restSeconds: 60 },
  { id: "machine-lateral-raise", name: "Machine Lateral Raise", category: "Push", equipment: "Machine", primaryMuscles: ["Side Delts"], secondaryMuscles: ["Upper Traps"], bodyRegionSlugs: ["side-delts"], restSeconds: 60 },
  { id: "weighted-russian-twist", name: "Weighted Russian Twist", category: "Core", equipment: "Plate / Dumbbell", primaryMuscles: ["Obliques"], secondaryMuscles: ["Abs"], bodyRegionSlugs: ["obliques", "abs"], restSeconds: 60 },
  { id: "cable-woodchopper", name: "Cable Woodchopper", category: "Core", equipment: "Cable", primaryMuscles: ["Obliques"], secondaryMuscles: ["Abs", "Shoulders"], bodyRegionSlugs: ["obliques", "abs"], restSeconds: 60 },
];

const upsertMissingExerciseRows = async () => {
  for (const exercise of supportRows) {
    await pool.query(
      `INSERT INTO exercises (
      id,
      name,
      category,
      primary_muscles,
      secondary_muscles,
      body_region_slugs,
      equipment,
      instructions,
      default_rest_seconds
    )
      VALUES ($1, $2, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8::jsonb, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        category = EXCLUDED.category,
        primary_muscles = EXCLUDED.primary_muscles,
        secondary_muscles = EXCLUDED.secondary_muscles,
        body_region_slugs = EXCLUDED.body_region_slugs,
        equipment = EXCLUDED.equipment,
        instructions = EXCLUDED.instructions,
        default_rest_seconds = EXCLUDED.default_rest_seconds`,
      [
        exercise.id,
        exercise.name,
        exercise.category,
        JSON.stringify(exercise.primaryMuscles),
        JSON.stringify(exercise.secondaryMuscles ?? []),
        JSON.stringify(exercise.bodyRegionSlugs),
        exercise.equipment,
        JSON.stringify([
          "Set your position before the first working rep.",
          "Train the target muscles through a controlled full range.",
          "Use the prescribed double-progression rules before adding load.",
        ]),
        exercise.restSeconds ?? 90,
      ]
    );
  }
};

const operatingRules = [
  "Warm-up protocol for first heavy compound only: empty bar/very light DBs x10, 50% working weight x5, 70% working weight x3, then working sets.",
  "Double progression: hit the top of the rep range on every set with the same load, then increase load next exposure and restart at the bottom of the range.",
  "Reset clause: if no rep/load progress for three consecutive exposures, drop working weight by 10% and rebuild.",
  "Deload every 6-8 completed 8-day cycles: same exercises and heavy weights, half volume, stop every set with 3-4 RIR.",
];

type Movement = {
  pattern: string;
  sets: number;
  reps: string;
  home: { exerciseId: string; name: string };
  gym: { exerciseId: string; name: string };
  restSeconds?: number;
  targetLoad?: string;
  targetRpe?: string;
};

const makeItem = (movement: Movement, track: "home" | "gym", dayIndex: number, order: number) => {
  const option = movement[track];
  return {
    id: `item_${track}_${dayIndex}_${order}`,
    exerciseId: option.exerciseId,
    sets: movement.sets,
    reps: movement.reps,
    restSeconds: movement.restSeconds ?? (movement.sets >= 4 ? 90 : 75),
    targetLoad: movement.targetLoad ?? (movement.reps.includes("4") || movement.reps.includes("6") ? "Heavy" : "Moderate"),
    targetRpe: movement.targetRpe ?? "8-9",
    prGoal: movement.reps === "AMRAP" ? "Beat prior max-rep burnout set" : `Progress ${option.name}`,
    notes: `${movement.pattern}: ${option.name}. Use strict double progression. ${movement.pattern.toLowerCase().includes("compound") ? operatingRules[0] : ""}`.trim(),
    order,
  };
};

const trainingDays = [
  {
    title: "Push A",
    focus: "Heavy Anterior",
    sessionGoal:
      "Raw mechanical tension. At home, use a strict 3-second negative if 20kg dumbbells are too easy for presses.",
    targetMuscles: ["Chest", "Shoulders", "Triceps"],
    movements: [
      {
        pattern: "Heavy Incline Press",
        sets: 4,
        reps: "4-6",
        home: { exerciseId: "incline-dumbbell-press", name: "Incline DB Press (3-sec negative)" },
        gym: { exerciseId: "smith-machine-incline-press", name: "Smith Machine Incline Press" },
        restSeconds: 150,
        targetLoad: "Heavy",
      },
      {
        pattern: "Heavy Flat Press",
        sets: 3,
        reps: "6-8",
        home: { exerciseId: "barbell-floor-press", name: "Barbell Floor Press (or DB)" },
        gym: { exerciseId: "barbell-bench-press", name: "Flat Barbell Bench Press" },
        restSeconds: 120,
        targetLoad: "Heavy",
      },
      {
        pattern: "Vertical Press",
        sets: 3,
        reps: "6-8",
        home: { exerciseId: "seated-db-shoulder-press", name: "Seated DB Shoulder Press" },
        gym: { exerciseId: "machine-shoulder-press", name: "Machine Shoulder Press" },
        restSeconds: 120,
      },
      {
        pattern: "Side Delt Isolation",
        sets: 5,
        reps: "10-12",
        home: { exerciseId: "dumbbell-lateral-raise", name: "DB Lateral Raise" },
        gym: { exerciseId: "cable-lateral-raise", name: "Cable Lateral Raise (wrist height)" },
        restSeconds: 60,
      },
      {
        pattern: "Triceps Stretch",
        sets: 4,
        reps: "10-12",
        home: { exerciseId: "overhead-db-triceps-extension", name: "Overhead DB Triceps Extension" },
        gym: { exerciseId: "overhead-cable-triceps-extension", name: "Overhead Cable Triceps Extension" },
        restSeconds: 75,
      },
    ],
  },
  {
    title: "Pull A",
    focus: "Width & Heavy Posterior",
    sessionGoal: "Alternate vertical and horizontal pulls to drive lat volume safely.",
    targetMuscles: ["Back", "Rear Delts", "Biceps", "Core"],
    movements: [
      {
        pattern: "Heavy Vertical Pull",
        sets: 3,
        reps: "4-6",
        home: { exerciseId: "weighted-negative-pull-up", name: "Weighted/Negative Pull-ups" },
        gym: { exerciseId: "weighted-pull-up", name: "Weighted Pull-ups" },
        restSeconds: 150,
        targetLoad: "Heavy",
      },
      {
        pattern: "Heavy Horizontal Pull",
        sets: 4,
        reps: "6-8",
        home: { exerciseId: "barbell-row", name: "Barbell Row / Heavy DB Row" },
        gym: { exerciseId: "chest-supported-t-bar-row", name: "Chest-Supported T-Bar Row" },
        restSeconds: 120,
        targetLoad: "Heavy",
      },
      {
        pattern: "Neutral Vertical Pull",
        sets: 3,
        reps: "8-10",
        home: { exerciseId: "db-pullover", name: "DB Pullovers (lat stretch)" },
        gym: { exerciseId: "neutral-grip-lat-pulldown", name: "Neutral-Grip Lat Pulldown" },
        restSeconds: 90,
      },
      {
        pattern: "Rear Delt Isolation",
        sets: 4,
        reps: "12-15",
        home: { exerciseId: "rear-delt-fly", name: "DB Rear Delt Flys" },
        gym: { exerciseId: "reverse-pec-deck", name: "Reverse Pec Deck Machine" },
        restSeconds: 60,
      },
      {
        pattern: "Biceps Isolation",
        sets: 5,
        reps: "8-10",
        home: { exerciseId: "hammer-curl", name: "DB Bicep Curl" },
        gym: { exerciseId: "ez-bar-curl", name: "EZ-Bar or Cable Curl" },
        restSeconds: 60,
      },
      {
        pattern: "Core (Anti-Extension)",
        sets: 3,
        reps: "8-12",
        home: { exerciseId: "ab-wheel-rollout", name: "Ab Wheel / Plank Walkouts" },
        gym: { exerciseId: "trx-fallout", name: "Ab Wheel (or TRX Fallouts)" },
        restSeconds: 60,
      },
    ],
  },
  {
    title: "Legs",
    focus: "The Simplified Engine",
    sessionGoal: "Brutal efficiency. Maximum quad stimulus without systemic failure.",
    targetMuscles: ["Quads", "Glutes", "Hamstrings", "Calves"],
    movements: [
      {
        pattern: "Bilateral Quad/Glute",
        sets: 4,
        reps: "8-10",
        home: { exerciseId: "goblet-squat", name: "DB Goblet Squat" },
        gym: { exerciseId: "hack-squat", name: "Hack Squat or Leg Press" },
        restSeconds: 120,
      },
      {
        pattern: "Unilateral Quad Bias",
        sets: 3,
        reps: "8-10/leg",
        home: { exerciseId: "bulgarian-split-squat", name: "DB Bulgarian Split Squat" },
        gym: { exerciseId: "smith-machine-bulgarian-split-squat", name: "Smith Machine Bulgarian Split Squat" },
        restSeconds: 120,
      },
      {
        pattern: "Heavy Hinge",
        sets: 4,
        reps: "8-10",
        home: { exerciseId: "romanian-deadlift", name: "Dumbbell RDL" },
        gym: { exerciseId: "romanian-deadlift", name: "Barbell RDL" },
        restSeconds: 120,
      },
      {
        pattern: "Hamstring Isolation",
        sets: 4,
        reps: "10-12",
        home: { exerciseId: "sliding-floor-hamstring-curl", name: "Sliding Floor Hamstring Curls" },
        gym: { exerciseId: "seated-leg-curl", name: "Seated Leg Curl Machine" },
        restSeconds: 75,
      },
      {
        pattern: "Quad Isolation",
        sets: 3,
        reps: "10-12",
        home: { exerciseId: "heel-elevated-db-cyclist-squat", name: "Heel-Elevated DB Cyclist Squat" },
        gym: { exerciseId: "leg-extension", name: "Leg Extension Machine" },
        restSeconds: 75,
      },
      {
        pattern: "Calf Isolation",
        sets: 5,
        reps: "12-15",
        home: { exerciseId: "single-leg-db-calf-raise", name: "Single-Leg Calf Raise (DB)" },
        gym: { exerciseId: "standing-calf-raise", name: "Standing Calf Raise Machine" },
        restSeconds: 60,
      },
    ],
  },
  {
    title: "Push B",
    focus: "Chest Hypertrophy Sequence",
    sessionGoal:
      "Heavy -> Stretch -> Metabolic sequence. At home, DB fly pre-exhausts the chest so 20kg dumbbells stay productive.",
    targetMuscles: ["Chest", "Side Delts", "Triceps", "Core"],
    movements: [
      {
        pattern: "Moderate Flat Press",
        sets: 4,
        reps: "8-10",
        home: { exerciseId: "dumbbell-bench-press", name: "DB Bench Press" },
        gym: { exerciseId: "converging-chest-press-machine", name: "Converging Chest Press Machine" },
        restSeconds: 120,
      },
      {
        pattern: "Maximum Stretch",
        sets: 3,
        reps: "10-12",
        home: { exerciseId: "db-fly", name: "DB Flys (deep stretch)" },
        gym: { exerciseId: "cable-crossover-mid-low", name: "Cable Crossovers (mid-to-low)" },
        restSeconds: 75,
      },
      {
        pattern: "Secondary Press",
        sets: 3,
        reps: "8-10",
        home: { exerciseId: "incline-dumbbell-press", name: "Slight Incline DB Press" },
        gym: { exerciseId: "incline-machine-press", name: "Incline Machine Press" },
        restSeconds: 90,
      },
      {
        pattern: "Metabolic Burnout",
        sets: 1,
        reps: "AMRAP",
        home: { exerciseId: "push-up", name: "Push-ups to failure" },
        gym: { exerciseId: "pec-deck-to-failure", name: "Pec Deck to failure" },
        restSeconds: 90,
        targetRpe: "9-10",
      },
      {
        pattern: "Side Delt Isolation",
        sets: 4,
        reps: "12-15",
        home: { exerciseId: "dumbbell-lateral-raise", name: "DB Lateral Raise" },
        gym: { exerciseId: "cable-lateral-raise", name: "Cable Lateral Raise" },
        restSeconds: 60,
      },
      {
        pattern: "Triceps Isolation",
        sets: 4,
        reps: "10-12",
        home: { exerciseId: "lying-db-skullcrusher", name: "Lying DB Extension (Skullcrushers)" },
        gym: { exerciseId: "cable-vbar-triceps-pushdown", name: "Cable Triceps Pushdown (V-Bar)" },
        restSeconds: 75,
      },
      {
        pattern: "Core (Flexion)",
        sets: 3,
        reps: "10-12",
        home: { exerciseId: "weighted-crunch", name: "Weighted Crunches" },
        gym: { exerciseId: "heavy-cable-crunch", name: "Heavy Cable Crunches" },
        restSeconds: 60,
      },
    ],
  },
  {
    title: "Pull B",
    focus: "Scapular Density",
    sessionGoal: "Push back volume past chest volume to build a stronger V-taper and posture base.",
    targetMuscles: ["Back", "Rear Delts", "Traps", "Biceps", "Side Delts", "Core"],
    movements: [
      {
        pattern: "Stable Horizontal Pull",
        sets: 4,
        reps: "10-12",
        home: { exerciseId: "chest-supported-db-row", name: "Chest-Supported DB Row" },
        gym: { exerciseId: "chest-supported-row", name: "Chest-Supported Row Machine" },
        restSeconds: 90,
      },
      {
        pattern: "Scapular Retraction",
        sets: 3,
        reps: "8-10",
        home: { exerciseId: "inverted-row", name: "Inverted Rows (Bodyweight)" },
        gym: { exerciseId: "wide-grip-seated-cable-row", name: "Wide-Grip Seated Cable Row" },
        restSeconds: 90,
      },
      {
        pattern: "Lat Isolation",
        sets: 3,
        reps: "12-15",
        home: { exerciseId: "straight-arm-db-pullover", name: "Straight-Arm DB Pullovers" },
        gym: { exerciseId: "straight-arm-pulldown", name: "Straight-Arm Cable Pulldown" },
        restSeconds: 75,
      },
      {
        pattern: "Rear Delt/Trap Base",
        sets: 4,
        reps: "12-15",
        home: { exerciseId: "rear-delt-fly", name: "DB Rear Delt Flys" },
        gym: { exerciseId: "face-pull", name: "Cable Face Pulls" },
        restSeconds: 60,
      },
      {
        pattern: "Rear Delt Burnout",
        sets: 3,
        reps: "12-15",
        home: { exerciseId: "band-pull-apart", name: "Band Pull-aparts (or light DBs)" },
        gym: { exerciseId: "reverse-pec-deck", name: "Reverse Pec Deck" },
        restSeconds: 60,
      },
      {
        pattern: "Brachialis (Width)",
        sets: 5,
        reps: "10-12",
        home: { exerciseId: "hammer-curl", name: "DB Hammer Curls" },
        gym: { exerciseId: "cable-rope-hammer-curl", name: "Cable Rope Hammer Curls" },
        restSeconds: 60,
      },
      {
        pattern: "Side Delt Volume",
        sets: 4,
        reps: "15+",
        home: { exerciseId: "dumbbell-lateral-raise", name: "DB Lateral Raise" },
        gym: { exerciseId: "machine-lateral-raise", name: "Machine Lateral Raise" },
        restSeconds: 60,
      },
      {
        pattern: "Core (Rotation)",
        sets: 3,
        reps: "10-12/side",
        home: { exerciseId: "weighted-russian-twist", name: "Russian Twists (weighted)" },
        gym: { exerciseId: "cable-woodchopper", name: "Cable Woodchoppers" },
        restSeconds: 60,
      },
    ],
  },
];

const recoveryDay = (track: "home" | "gym", day: number, title: string, goal: string) => ({
  id: `day_${track}_recovery_${day}`,
  day,
  title,
  focus: "System Recovery",
  warmup: "Optional mobility only. Keep intensity intentionally low.",
  sessionGoal: goal,
  targetMuscles: ["Recovery"],
  notes: "Eat at maintenance, keep NEAT easy, clear central fatigue, and prepare for the next training day.",
  items: [],
});

const makePlan = (track: "home" | "gym", orderIndex: number) => ({
  id: `plan_hybrid_8_day_${track}`,
  name: track === "gym" ? "8-Day Hybrid Architecture - Gym" : "8-Day Hybrid Architecture - Home",
  notes: [
    track === "gym"
      ? "Gym track using machine, cable, barbell, and weighted bodyweight options."
      : "Home track using dumbbells, barbell/floor press options, bodyweight, and low-equipment substitutes.",
    ...operatingRules,
    "Final volume tally per 8-day cycle: Back 20, Chest 18, Lateral Delts 13, Rear Delts 11, Quads 10, Biceps 10, Hamstrings 8, Triceps 8, Core 9, Calves 5 working sets.",
  ].join("\n\n"),
  orderIndex,
  days: [
    ...trainingDays.slice(0, 3).map((day, index) => ({
      id: `day_${track}_${index}`,
      day: index,
      title: `Day ${index + 1}: ${day.title}`,
      focus: day.focus,
      warmup: operatingRules[0],
      sessionGoal: day.sessionGoal,
      targetMuscles: day.targetMuscles,
      notes: operatingRules.slice(1).join(" "),
      items: day.movements.map((movement, movementIndex) => makeItem(movement, track, index, movementIndex)),
    })),
    recoveryDay(track, 3, "Day 4: Recovery", "Mobility, light walking, NEAT targets, and complete CNS rest."),
    ...trainingDays.slice(3).map((day, offset) => {
      const dayIndex = offset + 4;
      return {
        id: `day_${track}_${dayIndex}`,
        day: dayIndex,
        title: `Day ${dayIndex + 1}: ${day.title}`,
        focus: day.focus,
        warmup: operatingRules[0],
        sessionGoal: day.sessionGoal,
        targetMuscles: day.targetMuscles,
        notes: operatingRules.slice(1).join(" "),
        items: day.movements.map((movement, movementIndex) => makeItem(movement, track, dayIndex, movementIndex)),
      };
    }),
    recoveryDay(track, 6, "Day 7: System Recovery", "Eat at maintenance, clear central fatigue, and prep the next cycle."),
    recoveryDay(track, 7, "Day 8: System Recovery", "Eat at maintenance, clear central fatigue, and prep the next cycle."),
  ],
});

async function run() {
  await upsertMissingExerciseRows();

  const gym = await savePlan(USER_ID, makePlan("gym", 0));
  const home = await savePlan(USER_ID, makePlan("home", 1));

  console.log(`Seeded ${gym?.name}: ${gym?.days.length} days`);
  console.log(`Seeded ${home?.name}: ${home?.days.length} days`);

  await pool.end();
}

run().catch(async (error) => {
  console.error(error);
  await pool.end();
  process.exit(1);
});
