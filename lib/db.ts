import { randomUUID } from "node:crypto";
import { Kysely, PostgresDialect } from "kysely";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { exerciseCatalog } from "@/lib/exercises";
import type {
  CoachMessage,
  Exercise,
  PersonalRecord,
  UserProfile,
  WeeklyPlan,
  WeeklyPlanDay,
  WeeklyPlanItem,
  WorkoutSession,
  WorkoutSessionItem,
} from "@/lib/types";

const connectionString =
  process.env.DATABASE_URL || "postgresql://kratos:kratos@127.0.0.1:5435/kratos";

export const pool = new Pool({
  connectionString,
  allowExitOnIdle: true,
});

export const kysely = new Kysely<never>({
  dialect: new PostgresDialect({ pool }),
});

const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

let appTablesReady = false;

const parseJson = <T>(value: unknown, fallback: T): T => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T;
    } catch {
      return fallback;
    }
  }

  return value as T;
};

const toIso = (value: string | null | undefined) => value ?? new Date().toISOString();

export const createId = (prefix: string) => `${prefix}_${randomUUID().replaceAll("-", "").slice(0, 18)}`;

export const defaultPlanDays = (): WeeklyPlanDay[] =>
  dayNames.map((title, index) => ({
    id: createId("day"),
    day: index,
    title,
    focus: "",
    warmup: "",
    sessionGoal: "",
    targetMuscles: [],
    notes: "",
    items: [],
  }));

export const defaultProfile = (userId: string): UserProfile => ({
  userId,
  goal: "",
  experienceLevel: "",
  weeklySessions: 0,
  injuries: "",
  notes: "",
  bodyGender: "male",
});

type DbExecutor = Pool | PoolClient;

export const queryRows = async <T extends QueryResultRow = QueryResultRow>(
  db: DbExecutor,
  text: string,
  params: unknown[] = []
) => {
  const result = await db.query(text, params);
  return result.rows as T[];
};

export const queryRow = async <T extends QueryResultRow = QueryResultRow>(
  db: DbExecutor,
  text: string,
  params: unknown[] = []
) => {
  const rows = await queryRows<T>(db, text, params);
  return rows[0] ?? null;
};

const seedExerciseCatalog = async (db: DbExecutor) => {
  for (const exercise of exerciseCatalog) {
    await db.query(
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
        JSON.stringify(exercise.secondaryMuscles),
        JSON.stringify(exercise.bodyRegionSlugs),
        exercise.equipment,
        JSON.stringify(exercise.instructions),
        exercise.defaultRestSeconds,
      ]
    );
  }
};

export const ensureAppTables = async () => {
  if (appTablesReady) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      primary_muscles JSONB NOT NULL DEFAULT '[]'::jsonb,
      secondary_muscles JSONB NOT NULL DEFAULT '[]'::jsonb,
      body_region_slugs JSONB NOT NULL DEFAULT '[]'::jsonb,
      equipment TEXT NOT NULL,
      instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
      default_rest_seconds INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      goal TEXT NOT NULL DEFAULT '',
      experience_level TEXT NOT NULL DEFAULT '',
      weekly_sessions INTEGER NOT NULL DEFAULT 0,
      injuries TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      body_gender TEXT NOT NULL DEFAULT 'male'
    );

    CREATE TABLE IF NOT EXISTS weekly_plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS weekly_plan_days (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
      day_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      focus TEXT NOT NULL DEFAULT '',
      warmup TEXT NOT NULL DEFAULT '',
      session_goal TEXT NOT NULL DEFAULT '',
      target_muscles JSONB NOT NULL DEFAULT '[]'::jsonb,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS weekly_plan_items (
      id TEXT PRIMARY KEY,
      day_id TEXT NOT NULL REFERENCES weekly_plan_days(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
      sets INTEGER NOT NULL,
      reps TEXT NOT NULL,
      rest_seconds INTEGER NOT NULL,
      target_load TEXT NOT NULL DEFAULT '',
      target_rpe TEXT NOT NULL DEFAULT '',
      pr_goal TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      plan_id TEXT REFERENCES weekly_plans(id) ON DELETE SET NULL,
      plan_day_id TEXT REFERENCES weekly_plan_days(id) ON DELETE SET NULL,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      day_index INTEGER NOT NULL,
      title TEXT NOT NULL,
      effort TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS workout_session_items (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES workout_sessions(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
      exercise_name TEXT NOT NULL,
      planned_sets INTEGER NOT NULL,
      reps TEXT NOT NULL,
      rest_seconds INTEGER NOT NULL,
      target_load TEXT NOT NULL DEFAULT '',
      target_rpe TEXT NOT NULL DEFAULT '',
      result TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      order_index INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS personal_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
      value DOUBLE PRECISION NOT NULL,
      unit TEXT NOT NULL,
      reps INTEGER NOT NULL DEFAULT 1,
      achieved_at TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS coach_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  await seedExerciseCatalog(pool);
  appTablesReady = true;
};

export const transaction = async <T>(callback: (client: PoolClient) => Promise<T>): Promise<T> => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const result = await callback(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const mapExerciseRow = (row: Record<string, unknown>): Exercise => ({
  id: String(row.id),
  name: String(row.name),
  category: row.category as Exercise["category"],
  primaryMuscles: parseJson(row.primary_muscles, []),
  secondaryMuscles: parseJson(row.secondary_muscles, []),
  bodyRegionSlugs: parseJson(row.body_region_slugs, []),
  equipment: String(row.equipment),
  instructions: parseJson(row.instructions, []),
  defaultRestSeconds: Number(row.default_rest_seconds),
});

export const mapProfileRow = (
  userId: string,
  row?: Record<string, unknown> | null
): UserProfile =>
  row
    ? {
        userId,
        goal: String(row.goal ?? ""),
        experienceLevel: String(row.experience_level ?? ""),
        weeklySessions: Number(row.weekly_sessions ?? 0),
        injuries: String(row.injuries ?? ""),
        notes: String(row.notes ?? ""),
        bodyGender: (row.body_gender === "female" ? "female" : "male") as UserProfile["bodyGender"],
      }
    : defaultProfile(userId);

export const mapRecordRow = (row: Record<string, unknown>): PersonalRecord => ({
  id: String(row.id),
  userId: String(row.user_id),
  exerciseId: String(row.exercise_id),
  value: Number(row.value),
  unit: row.unit as PersonalRecord["unit"],
  reps: Number(row.reps),
  achievedAt: toIso(row.achieved_at as string | null | undefined),
  notes: String(row.notes ?? ""),
});

export const mapCoachRow = (row: Record<string, unknown>): CoachMessage => ({
  id: String(row.id),
  userId: String(row.user_id),
  role: row.role as CoachMessage["role"],
  content: String(row.content),
  createdAt: toIso(row.created_at as string | null | undefined),
});

export const hydratePlans = (
  planRows: Array<Record<string, unknown>>,
  dayRows: Array<Record<string, unknown>>,
  itemRows: Array<Record<string, unknown>>
): WeeklyPlan[] =>
  planRows.map((planRow) => ({
    id: String(planRow.id),
    userId: String(planRow.user_id),
    name: String(planRow.name),
    notes: String(planRow.notes ?? ""),
    createdAt: toIso(planRow.created_at as string | null | undefined),
    updatedAt: toIso(planRow.updated_at as string | null | undefined),
    days: dayRows
      .filter((day) => String(day.plan_id) === String(planRow.id))
      .sort((a, b) => Number(a.day_index) - Number(b.day_index))
      .map((day) => ({
        id: String(day.id),
        day: Number(day.day_index),
        title: String(day.title),
        focus: String(day.focus ?? ""),
        warmup: String(day.warmup ?? ""),
        sessionGoal: String(day.session_goal ?? ""),
        targetMuscles: parseJson(day.target_muscles, []),
        notes: String(day.notes ?? ""),
        items: itemRows
          .filter((item) => String(item.day_id) === String(day.id))
          .sort((a, b) => Number(a.order_index) - Number(b.order_index))
          .map(
            (item): WeeklyPlanItem => ({
              id: String(item.id),
              exerciseId: String(item.exercise_id),
              sets: Number(item.sets),
              reps: String(item.reps),
              restSeconds: Number(item.rest_seconds),
              targetLoad: String(item.target_load ?? ""),
              targetRpe: String(item.target_rpe ?? ""),
              prGoal: String(item.pr_goal ?? ""),
              notes: String(item.notes ?? ""),
              order: Number(item.order_index),
            })
          ),
      })),
  }));

export const hydrateSessions = (
  sessionRows: Array<Record<string, unknown>>,
  itemRows: Array<Record<string, unknown>>
): WorkoutSession[] =>
  sessionRows.map((sessionRow) => ({
    id: String(sessionRow.id),
    userId: String(sessionRow.user_id),
    planId: (sessionRow.plan_id as string | null | undefined) ?? null,
    planDayId: (sessionRow.plan_day_id as string | null | undefined) ?? null,
    startedAt: toIso(sessionRow.started_at as string | null | undefined),
    endedAt: (sessionRow.ended_at as string | null | undefined) ?? null,
    day: Number(sessionRow.day_index),
    title: String(sessionRow.title),
    effort: String(sessionRow.effort ?? ""),
    notes: String(sessionRow.notes ?? ""),
    items: itemRows
      .filter((item) => String(item.session_id) === String(sessionRow.id))
      .sort((a, b) => Number(a.order_index) - Number(b.order_index))
      .map(
        (item): WorkoutSessionItem => ({
          id: String(item.id),
          exerciseId: String(item.exercise_id),
          exerciseName: String(item.exercise_name),
          plannedSets: Number(item.planned_sets),
          reps: String(item.reps),
          restSeconds: Number(item.rest_seconds),
          targetLoad: String(item.target_load ?? ""),
          targetRpe: String(item.target_rpe ?? ""),
          sets: parseJson(item.result, []),
          notes: String(item.notes ?? ""),
          order: Number(item.order_index),
        })
      ),
  }));
