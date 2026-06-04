import { pool } from "@/lib/db";
import { savePlan } from "@/lib/data";

const USER_ID = "91XW7HYzv8IqMUeZ0keKUbwT0nL1QK7T";

async function populate() {
  console.log("Locating existing plans for user...", USER_ID);
  
  // Define plan input structure with updated A/B sessions and adjustments
  const planInput = {
    id: "", // Create new plan
    name: 'Phase 1 & 2 Workspace',
    notes: 'PHASE 1: THE "A" SESSIONS (Mechanical Load Focus) & PHASE 2: THE "B" SESSIONS (Anabolic Burn & Weak-Point Architecture)',
    orderIndex: 0,
    days: [
      {
        day: 0,
        title: "Push A",
        focus: "Complete Chest Power & Arms",
        warmup: "Arm Circles & Shoulder Dislocations: 15 reps forward and backward using a resistance band or broomstick. Band Pull-Aparts: 2 sets of 20 reps. Empty Barbell / Light Dumbbell Bench Press: 2 progressive warm-up sets (e.g., 5 reps at 50% working weight, then 3 reps at 75%).",
        sessionGoal: "Maximum mechanical tension on the chest, anterior delts, and triceps.",
        targetMuscles: ["Chest", "Shoulders", "Triceps"],
        notes: "Cool-down stretch: Doorway Chest Stretch (2 sets x 30s per side), Overhead Tricep Static Stretch (2 sets x 30s per arm).",
        items: [
          {
            exerciseId: "bench-press",
            sets: 4,
            reps: "6-8",
            restSeconds: 120,
            targetLoad: "Heavy",
            targetRpe: "8-9",
            prGoal: "Flat bench press performance",
            notes: "Flat Barbell Bench Press. Rest: 120 seconds for full strength recovery."
          },
          {
            exerciseId: "incline-dumbbell-press",
            sets: 4,
            reps: "8-12",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "Incline DB progression",
            notes: "Incline Dumbbell Bench Press. Tempo: 3 seconds lowering, 1-second deep stretch, explode up. Rest: 60 seconds."
          },
          {
            exerciseId: "dumbbell-lateral-raise",
            sets: 3,
            reps: "12-15",
            restSeconds: 45,
            targetLoad: "Light",
            targetRpe: "8-9",
            prGoal: "",
            notes: "Seated Dumbbell Lateral Raises. Rest: 45 seconds. (Reduced from 4 to scale back deltoid inflation)"
          },
          {
            exerciseId: "skull-crusher",
            sets: 3,
            reps: "10-12",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "",
            notes: "Overhead Dumbbell Tricep Extensions. Rest: 60 seconds."
          }
        ]
      },
      {
        day: 1,
        title: "Pull A",
        focus: "Lat Width & Mid-Back Thickness",
        warmup: "Dead Hangs from Pull-Up Bar: 2 sets x 30 seconds to decompress the spine and activate grip. Scapular Pull-Ups: 2 sets x 10 reps to initiate lower and mid-trap recruitment. Cat-Cow Stretch: 10 slow, fluid repetitions to mobilize the thoracic spine.",
        sessionGoal: "Vertical pulling mechanics, heavy rowing, and bicep structural strength.",
        targetMuscles: ["Lats", "Rhomboids", "Biceps"],
        notes: "Cool-down stretch: Cross-Body Lat Stretch (2 sets x 30s per side), Bicep Wall Stretch (2 sets x 30s).",
        items: [
          {
            exerciseId: "pull-up",
            sets: 5,
            reps: "6-8",
            restSeconds: 90,
            targetLoad: "Bodyweight",
            targetRpe: "8",
            prGoal: "Pull-up milestones",
            notes: "Chair-Assisted Pull-Ups. Tempo: 2-second controlled descent. Rest: 90 seconds."
          },
          {
            exerciseId: "single-arm-dumbbell-row",
            sets: 4,
            reps: "8-12",
            restSeconds: 60,
            targetLoad: "Heavy",
            targetRpe: "8",
            prGoal: "Single-arm row load step",
            notes: "Single-Arm Dumbbell Row. Rest: 60 seconds."
          },
          {
            exerciseId: "rear-delt-fly",
            sets: 4,
            reps: "12-15",
            restSeconds: 45,
            targetLoad: "Light",
            targetRpe: "8-9",
            prGoal: "",
            notes: "Bench-Supported Dumbbell Reverse Flies. Rest: 45 seconds."
          },
          {
            exerciseId: "hammer-curl",
            sets: 3,
            reps: "10-12",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "",
            notes: "Dumbbell Hammer Curls. Rest: 60 seconds."
          }
        ]
      },
      {
        day: 2,
        title: "Legs A",
        focus: "Quad Dominant & Anterior Chain Core",
        warmup: "World's Greatest Stretch: 5 reps per side to open the thoracic spine, hips, and hamstrings. Bodyweight Squats: 2 sets x 15 reps. Leg Swings: 15 reps per leg forward-to-back, and 15 reps side-to-side.",
        sessionGoal: "Unilateral leg strength, quad density, and core stability.",
        targetMuscles: ["Quads", "Hamstrings", "Core"],
        notes: "Cool-down stretch: Couch Stretch (2 sets x 40s per side), Standing Calf Stretch (2 sets x 30s per side).",
        items: [
          {
            exerciseId: "bulgarian-split-squat",
            sets: 4,
            reps: "8-10",
            restSeconds: 90,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "Split squat loading check",
            notes: "Dumbbell Bulgarian Split Squats. Rest Protocol: Perform Left Leg, rest 30 seconds, perform Right Leg, then rest 90 seconds before starting the next set."
          },
          {
            exerciseId: "goblet-squat",
            sets: 4,
            reps: "12",
            restSeconds: 60,
            targetLoad: "Heavy",
            targetRpe: "8-9",
            prGoal: "Goblet progression",
            notes: "Heavy Dumbbell Goblet Squats. Tempo: 2-second strict pause at the bottom deep squat position (Forces massive quadriceps recruitment). Rest: 60 seconds."
          },
          {
            exerciseId: "romanian-deadlift",
            sets: 3,
            reps: "10-12",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "",
            notes: "Dumbbell Romanian Deadlifts (RDLs). Rest: 60 seconds."
          },
          {
            exerciseId: "standing-calf-raise",
            sets: 4,
            reps: "20",
            restSeconds: 45,
            targetLoad: "Light",
            targetRpe: "9",
            prGoal: "",
            notes: "Standing Dumbbell Calf Raises. Tempo: 2-second pause at absolute peak contraction. Rest: 45 seconds."
          },
          {
            exerciseId: "decline-sit-up",
            sets: 4,
            reps: "12-15",
            restSeconds: 45,
            targetLoad: "Weighted",
            targetRpe: "8",
            prGoal: "",
            notes: "Weighted Incline Bench Crunches. Rest: 45 seconds."
          }
        ]
      },
      {
        day: 3,
        title: "Recovery A",
        focus: "Strategic Recovery & Aerobic Flushing",
        warmup: "None",
        sessionGoal: "conversational outdoor cycling or a brisk walk.",
        targetMuscles: ["Cardio", "Active Recovery"],
        notes: "Reset training cycle tomorrow or move to Phase 2.",
        items: [
          {
            exerciseId: "bike-erg",
            sets: 1,
            reps: "35-45m",
            restSeconds: 60,
            targetLoad: "Low",
            targetRpe: "4",
            prGoal: "",
            notes: "STRETCH / FLOW: 35-45 minutes of conversational outdoor cycling or a brisk walk. Wash out metabolic waste."
          }
        ]
      },
      {
        day: 4,
        title: "Push B",
        focus: "Posterior Chain Awakening & Chest/Tricep Burnout",
        warmup: "Dumbbell Shoulder Halos: 2 sets x 10 reps clockwise and counter-clockwise. Y-T-W Exercises: 10 unweighted reps. Standard Push-Ups: 2 sets x 10 reps.",
        sessionGoal: "Replaces overhead press to build lower back, spinal erector, and trapezius structural integrity to support compound lifts.",
        targetMuscles: ["Shoulders", "Chest", "Triceps", "Lower Back"],
        notes: "Cool-down stretch: Thread-the-Needle Stretch (2 sets x 30s per side), Behind-the-Back Chest Opener (2 sets x 30s).",
        items: [
          {
            exerciseId: "conventional-deadlift",
            sets: 4,
            reps: "8",
            restSeconds: 90,
            targetLoad: "Heavy",
            targetRpe: "8",
            prGoal: "Deadlift structure target",
            notes: "Dumbbell Rack Pulls (or Heavy Suitcase Deadlifts). Replaces overhead press. Rest: 90 seconds."
          },
          {
            exerciseId: "incline-dumbbell-press",
            sets: 4,
            reps: "10-12",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "",
            notes: "SUPERSET 2A. Incline Bench Dumbbell Press. Move straight to Flat Dumbbell Flyes without stopping."
          },
          {
            exerciseId: "cable-fly",
            sets: 4,
            reps: "12",
            restSeconds: 60,
            targetLoad: "Light",
            targetRpe: "8",
            prGoal: "",
            notes: "SUPERSET 2B. Flat Dumbbell Flyes. 3-second slow descent. Rest for 60 seconds after finishing 2B."
          },
          {
            exerciseId: "dumbbell-lateral-raise",
            sets: 3,
            reps: "15",
            restSeconds: 60,
            targetLoad: "Light",
            targetRpe: "9",
            prGoal: "",
            notes: "SUPERSET 3A. Seated Dumbbell Lateral Raises (Reduced from 4 sets to 3). Move straight to Diamond Push-Ups without stopping."
          },
          {
            exerciseId: "diamond-push-up",
            sets: 4,
            reps: "Max",
            restSeconds: 60,
            targetLoad: "Bodyweight",
            targetRpe: "10",
            prGoal: "",
            notes: "SUPERSET 3B. Diamond Push-Ups with Hands on a Bench. Rest for 60 seconds after finishing 3B."
          },
          {
            exerciseId: "weighted-dip",
            sets: 3,
            reps: "12-15",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "9",
            prGoal: "",
            notes: "Bench Dips. Rest: 60 seconds."
          }
        ]
      },
      {
        day: 5,
        title: "Pull B",
        focus: "Back Width, Upper-Back Details, Biceps & Lower Abs",
        warmup: "Prone Cobra Hold: 2 sets x 30-second hold. Band Face-Pulls: 2 sets x 20 reps. Light Dumbbell Curls: 1 set x 15 reps.",
        sessionGoal: "Horizontal pulling focusing on rear delts, rhomboids, biceps, and core details.",
        targetMuscles: ["Upper Back", "Rear Delts", "Biceps", "Abs"],
        notes: "Cool-down stretch: Child's Pose (60-90 seconds), Seated Twist (2 sets x 30 seconds per side).",
        items: [
          {
            exerciseId: "chest-supported-row",
            sets: 4,
            reps: "10-12",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "",
            notes: "Incline Bench Dumbbell Rows. Rest: 60 seconds."
          },
          {
            exerciseId: "barbell-shrug",
            sets: 4,
            reps: "12",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8-9",
            prGoal: "",
            notes: "Chest-Supported Kelso Shrugs. Tempo: 1-second hard squeeze at peak contraction. Rest: 60 seconds."
          },
          {
            exerciseId: "rear-delt-fly",
            sets: 4,
            reps: "15",
            restSeconds: 45,
            targetLoad: "Light",
            targetRpe: "8",
            prGoal: "",
            notes: "Seated Dumbbell Bent-Over Reverse Flies. Rest: 45 seconds."
          },
          {
            exerciseId: "incline-dumbbell-curl",
            sets: 4,
            reps: "10-12",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "",
            notes: "Dumbbell Supinating Biceps Curls. Rest: 60 seconds."
          },
          {
            exerciseId: "hanging-leg-raise",
            sets: 4,
            reps: "10-12",
            restSeconds: 60,
            targetLoad: "Bodyweight",
            targetRpe: "8",
            prGoal: "",
            notes: "SUPERSET 5A. Hanging Knee Raises. Move straight to Floor Russian Twists without stopping."
          },
          {
            exerciseId: "russian-twist",
            sets: 4,
            reps: "20 total",
            restSeconds: 60,
            targetLoad: "Light",
            targetRpe: "8",
            prGoal: "",
            notes: "SUPERSET 5B. Floor Russian Twists. Rest for 60 seconds after finishing 5B."
          }
        ]
      },
      {
        day: 6,
        title: "Legs B",
        focus: "Posterior Chain & Conditioning Engine",
        warmup: "Bodyweight Glute Bridges: 2 sets x 15 reps. Inchworms: 5 reps. Bodyweight Alternating Reverse Lunges: 10 total reps.",
        sessionGoal: "Hamstring power, glute development, and high-intensity aerobic capacity.",
        targetMuscles: ["Hamstrings", "Glutes", "Conditioning"],
        notes: "Cool-down stretch: Seated Single-Leg Hamstring Stretch (2 sets x 40s per leg), Pigeon Stretch (2 sets x 40s per side).",
        items: [
          {
            exerciseId: "romanian-deadlift",
            sets: 5,
            reps: "8-10",
            restSeconds: 120,
            targetLoad: "Heavy",
            targetRpe: "8-9",
            prGoal: "Hamstring target peak",
            notes: "Heavy Dumbbell Romanian Deadlifts (RDLs). Rest: 120 seconds. (Increased to 5 sets to safely elevate Hamstring stimulus score)"
          },
          {
            exerciseId: "hip-thrust",
            sets: 4,
            reps: "12",
            restSeconds: 60,
            targetLoad: "Heavy",
            targetRpe: "8",
            prGoal: "",
            notes: "Dumbbell Hip Thrusts. Tempo: 2-second squeeze at the top. Rest: 60 seconds."
          },
          {
            exerciseId: "reverse-lunge",
            sets: 3,
            reps: "10/leg",
            restSeconds: 60,
            targetLoad: "Moderate",
            targetRpe: "8",
            prGoal: "",
            notes: "Dumbbell Deficit Lunges. Rest: 60 seconds."
          },
          {
            exerciseId: "jump-rope",
            sets: 6,
            reps: "6 rounds",
            restSeconds: 30,
            targetLoad: "Bodyweight",
            targetRpe: "9",
            prGoal: "Conditioning skipping pacing",
            notes: "Jump Rope Conditioning Finisher. 6 Rounds: 1 minute maximum skipping, 30 seconds rest."
          }
        ]
      },
      {
        day: 7,
        title: "Recovery B",
        focus: "Strategic Recovery & Aerobic Flushing",
        warmup: "None",
        sessionGoal: "Repeat Day 4 recovery session. Reset cycle to Day 1 tomorrow.",
        targetMuscles: ["Cardio", "Active Recovery"],
        notes: "Reset cycle to Day 1 tomorrow.",
        items: [
          {
            exerciseId: "bike-erg",
            sets: 1,
            reps: "35-45m",
            restSeconds: 60,
            targetLoad: "Low",
            targetRpe: "4",
            prGoal: "",
            notes: "STRETCH / FLOW: Repeat Day 4 recovery session. 35–45 minutes of conversational outdoor cycling or a brisk walk. Reset cycle tomorrow."
          }
        ]
      }
    ]
  };

  console.log("Saving customized Phase 1 & 2 split planner...");
  await savePlan(USER_ID, planInput);
  console.log("Populate success!");
}

populate().then(() => pool.end()).catch(console.error);
