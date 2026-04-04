import exerciseCatalogJson from "@/lib/exercises.json";
import type { Exercise, ExerciseCategory } from "@/lib/types";

type ExerciseSeed = Omit<Exercise, "instructions" | "defaultRestSeconds"> &
  Partial<Pick<Exercise, "instructions" | "defaultRestSeconds">>;

const defaultRestByCategory: Record<ExerciseCategory, number> = {
  Push: 90,
  Pull: 90,
  Legs: 120,
  Core: 60,
  Conditioning: 75,
  Mobility: 45,
};

const instructionsFor = (exercise: ExerciseSeed) => {
  if (exercise.instructions?.length) return exercise.instructions;

  const equipment = exercise.equipment.toLowerCase();

  if (equipment.includes("barbell")) {
    return [
      "Set your brace before each rep.",
      "Keep the bar path consistent through the working range.",
      "Finish the rep without losing position."
    ];
  }

  if (equipment.includes("dumbbell")) {
    return [
      "Set shoulders and ribs before starting the rep.",
      "Move both sides evenly through a full range.",
      "Control the lowering phase instead of dropping into it."
    ];
  }

  if (equipment.includes("cable")) {
    return [
      "Set the line of pull before the first rep.",
      "Keep tension through the full range.",
      "Pause briefly in the contracted position."
    ];
  }

  if (equipment.includes("machine")) {
    return [
      "Adjust the machine so the joint line matches the pivot.",
      "Use a controlled eccentric and smooth turnaround.",
      "Drive into the target muscles instead of the setup."
    ];
  }

  if (equipment.includes("pull-up bar") || equipment.includes("bodyweight")) {
    return [
      "Own the start position before each rep.",
      "Move through a full, controlled range.",
      "Stop the set when position breaks down."
    ];
  }

  if (
    equipment.includes("bike") ||
    equipment.includes("erg") ||
    equipment.includes("rower") ||
    equipment.includes("sled")
  ) {
    return [
      "Start each interval with a repeatable setup.",
      "Hold output instead of sprinting the opening seconds.",
      "Recover fully enough to keep the quality high."
    ];
  }

  if (
    equipment.includes("band") ||
    equipment.includes("mat") ||
    equipment.includes("wall") ||
    exercise.category === "Mobility"
  ) {
    return [
      "Move into the position gradually.",
      "Own the end range with steady breathing.",
      "Do not force range that you cannot control."
    ];
  }

  return [
    "Set your position before the first rep.",
    "Train the target muscles through a controlled range.",
    "Stop before technique quality drops off."
  ];
};

export const exerciseCatalog: Exercise[] = (exerciseCatalogJson as ExerciseSeed[]).map((exercise) => ({
  ...exercise,
  instructions: instructionsFor(exercise),
  defaultRestSeconds: exercise.defaultRestSeconds ?? defaultRestByCategory[exercise.category],
}));
