import {
  createId,
  defaultPlanDays,
  defaultProfile,
  ensureAppTables,
  hydratePlans,
  hydrateSessions,
  mapCoachRow,
  mapExerciseRow,
  mapProfileRow,
  mapRecordRow,
  pool,
  queryRow,
  queryRows,
  transaction,
} from "@/lib/db";
import type { PoolClient } from "pg";
import type {
  CoachMessage,
  Exercise,
  PersonalRecord,
  UserProfile,
  WeeklyPlan,
  WorkoutSession,
} from "@/lib/types";

type UpsertPlanInput = Pick<WeeklyPlan, "id" | "name" | "notes" | "days" | "orderIndex">;
type UpsertSessionInput = Omit<WorkoutSession, "id" | "userId" | "startedAt"> & {
  id?: string;
  startedAt?: string;
};
type UpsertRecordInput = Omit<PersonalRecord, "id" | "userId"> & { id?: string };
type InsertRow = Record<string, unknown>;
type RecordCandidate = Pick<PersonalRecord, "exerciseId" | "value" | "reps">;

const bulkInsert = async (
  client: Pick<PoolClient, "query">,
  table: string,
  columns: string[],
  rows: InsertRow[]
) => {
  if (rows.length === 0) return;
  const placeholders: string[] = [];
  const flatValues: unknown[] = [];
  let index = 1;
  for (const row of rows) {
    const rowPlaceholders: string[] = [];
    for (const col of columns) {
      rowPlaceholders.push(`$${index++}`);
      flatValues.push(row[col]);
    }
    placeholders.push(`(${rowPlaceholders.join(", ")})`);
  }
  const query = `INSERT INTO ${table} (${columns.map((column) => `"${column}"`).join(", ")}) VALUES ${placeholders.join(", ")}`;
  await client.query(query, flatValues);
};

let dataReady: Promise<void> | null = null;

export const ensureDataReady = async () => {
  if (!dataReady) {
    dataReady = (async () => {
      await ensureAppTables();
    })();
  }

  try {
    await dataReady;
  } catch (error) {
    dataReady = null;
    throw error;
  }
};

export const getExercises = async (): Promise<Exercise[]> => {
  await ensureDataReady();
  const rows = await queryRows(pool, "SELECT * FROM exercises ORDER BY category, name");
  return rows.map(mapExerciseRow);
};

export const getProfile = async (userId: string): Promise<UserProfile> => {
  await ensureDataReady();
  const row = await queryRow(pool, "SELECT * FROM profiles WHERE user_id = $1", [userId]);

  if (!row) {
    const profile = defaultProfile(userId);
    await pool.query(
      `INSERT INTO profiles
        (user_id, goal, experience_level, weekly_sessions, injuries, notes, body_gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (user_id) DO NOTHING`,
      [
        profile.userId,
        profile.goal,
        profile.experienceLevel,
        profile.weeklySessions,
        profile.injuries,
        profile.notes,
        profile.bodyGender,
      ]
    );
    return profile;
  }

  return mapProfileRow(userId, row);
};

export const saveProfile = async (userId: string, profile: Omit<UserProfile, "userId">) => {
  await ensureDataReady();
  await pool.query(
    `INSERT INTO profiles (
       user_id, goal, experience_level, weekly_sessions, injuries, notes, body_gender,
       age, height, weight, nickname, pronouns, activity_level, sleep_hours, medical_conditions
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     ON CONFLICT (user_id) DO UPDATE SET
       goal = EXCLUDED.goal,
       experience_level = EXCLUDED.experience_level,
       weekly_sessions = EXCLUDED.weekly_sessions,
       injuries = EXCLUDED.injuries,
       notes = EXCLUDED.notes,
       body_gender = EXCLUDED.body_gender,
       age = EXCLUDED.age,
       height = EXCLUDED.height,
       weight = EXCLUDED.weight,
       nickname = EXCLUDED.nickname,
       pronouns = EXCLUDED.pronouns,
       activity_level = EXCLUDED.activity_level,
       sleep_hours = EXCLUDED.sleep_hours,
       medical_conditions = EXCLUDED.medical_conditions`,
    [
      userId,
      profile.goal,
      profile.experienceLevel,
      profile.weeklySessions,
      profile.injuries,
      profile.notes,
      profile.bodyGender,
      profile.age,
      profile.height,
      profile.weight,
      profile.nickname,
      profile.pronouns,
      profile.activityLevel,
      profile.sleepHours,
      profile.medicalConditions,
    ]
  );

  return getProfile(userId);
};

export const getPlans = async (userId: string): Promise<WeeklyPlan[]> => {
  await ensureDataReady();
  const planRows = await queryRows(
    pool,
    "SELECT * FROM weekly_plans WHERE user_id = $1 ORDER BY order_index ASC, updated_at DESC",
    [userId]
  );
  if (!planRows.length) return [];

  const planIds = planRows.map((row) => String(row.id));
  const dayRows = await queryRows(
    pool,
    `SELECT * FROM weekly_plan_days
     WHERE plan_id = ANY($1::text[])
     ORDER BY day_index ASC`,
    [planIds]
  );

  const dayIds = dayRows.map((row) => String(row.id));
  const itemRows = dayIds.length
    ? await queryRows(
        pool,
        `SELECT * FROM weekly_plan_items
         WHERE day_id = ANY($1::text[])
         ORDER BY order_index ASC`,
        [dayIds]
      )
    : [];

  return hydratePlans(planRows, dayRows, itemRows);
};

export const savePlan = async (userId: string, planInput: UpsertPlanInput) => {
  await ensureDataReady();
  const now = new Date().toISOString();
  const planId = planInput.id || createId("plan");
  const days = (planInput.days?.length ? planInput.days : defaultPlanDays()).map((day, dayIndex) => ({
    ...day,
    id: day.id || createId("day"),
    day: day.day ?? dayIndex,
    items: day.items.map((item, itemIndex) => ({
      ...item,
      id: item.id || createId("plan_item"),
      order: item.order ?? itemIndex,
    })),
  }));

  await transaction(async (client) => {
    if (planInput.id) {
      const existing = await client.query("SELECT user_id FROM weekly_plans WHERE id = $1", [planId]);
      if (existing.rowCount && existing.rows[0].user_id !== userId) {
        throw new Error("Unauthorized: You do not own this plan.");
      }
    }

    await client.query(
      `INSERT INTO weekly_plans (id, user_id, name, notes, order_index, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         notes = EXCLUDED.notes,
         order_index = EXCLUDED.order_index,
         updated_at = EXCLUDED.updated_at`,
      [planId, userId, planInput.name.trim(), planInput.notes.trim(), planInput.orderIndex ?? 0, now, now]
    );

    await client.query("DELETE FROM weekly_plan_days WHERE plan_id = $1", [planId]);

    const dayRows = days.map((day) => ({
      id: day.id,
      plan_id: planId,
      day_index: day.day,
      title: day.title.trim(),
      focus: day.focus.trim(),
      warmup: day.warmup.trim(),
      session_goal: day.sessionGoal.trim(),
      target_muscles: JSON.stringify(day.targetMuscles),
      notes: day.notes.trim(),
    }));

    const itemRows = days.flatMap((day) =>
      day.items.map((item) => ({
        id: item.id,
        day_id: day.id,
        exercise_id: item.exerciseId,
        sets: item.sets,
        reps: item.reps.trim(),
        rest_seconds: item.restSeconds,
        target_load: item.targetLoad.trim(),
        target_rpe: item.targetRpe.trim(),
        pr_goal: item.prGoal.trim(),
        notes: item.notes.trim(),
        order_index: item.order,
      }))
    );

    if (dayRows.length) {
      await bulkInsert(
        client,
        "weekly_plan_days",
        ["id", "plan_id", "day_index", "title", "focus", "warmup", "session_goal", "target_muscles", "notes"],
        dayRows
      );
    }

    if (itemRows.length) {
      await bulkInsert(
        client,
        "weekly_plan_items",
        ["id", "day_id", "exercise_id", "sets", "reps", "rest_seconds", "target_load", "target_rpe", "pr_goal", "notes", "order_index"],
        itemRows
      );
    }
  });

  const planRows = await queryRows(pool, "SELECT * FROM weekly_plans WHERE id = $1", [planId]);
  if (!planRows.length) return null;
  const dayRows = await queryRows(
    pool,
    "SELECT * FROM weekly_plan_days WHERE plan_id = $1 ORDER BY day_index ASC",
    [planId]
  );
  const dayIds = dayRows.map((row) => String(row.id));
  const itemRows = dayIds.length
    ? await queryRows(
        pool,
        "SELECT * FROM weekly_plan_items WHERE day_id = ANY($1::text[]) ORDER BY order_index ASC",
        [dayIds]
      )
    : [];
  return hydratePlans(planRows, dayRows, itemRows)[0] ?? null;
};

export const deletePlan = async (userId: string, planId: string) => {
  await ensureDataReady();
  await pool.query("DELETE FROM weekly_plans WHERE id = $1 AND user_id = $2", [planId, userId]);
};

export const deleteRecord = async (userId: string, recordId: string) => {
  await ensureDataReady();
  await pool.query("DELETE FROM personal_records WHERE id = $1 AND user_id = $2", [recordId, userId]);
};

export const deleteSession = async (userId: string, sessionId: string) => {
  await ensureDataReady();
  await pool.query("DELETE FROM workout_sessions WHERE id = $1 AND user_id = $2", [sessionId, userId]);
};

export const getRecords = async (userId: string): Promise<PersonalRecord[]> => {
  await ensureDataReady();
  const rows = await queryRows(
    pool,
    "SELECT * FROM personal_records WHERE user_id = $1 ORDER BY achieved_at DESC, value DESC",
    [userId]
  );
  return rows.map(mapRecordRow);
};

export const saveRecord = async (userId: string, record: UpsertRecordInput) => {
  await ensureDataReady();
  const id = record.id || createId("pr");

  if (record.id) {
    const existing = await pool.query("SELECT user_id FROM personal_records WHERE id = $1", [id]);
    if (existing.rowCount && existing.rows[0].user_id !== userId) {
      throw new Error("Unauthorized: You do not own this record.");
    }
  }

  await pool.query(
    `INSERT INTO personal_records (id, user_id, exercise_id, value, unit, reps, achieved_at, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO UPDATE SET
       exercise_id = EXCLUDED.exercise_id,
       value = EXCLUDED.value,
       unit = EXCLUDED.unit,
       reps = EXCLUDED.reps,
       achieved_at = EXCLUDED.achieved_at,
       notes = EXCLUDED.notes`,
    [id, userId, record.exerciseId, record.value, record.unit, record.reps, record.achievedAt, record.notes]
  );

  const rows = await queryRows(pool, "SELECT * FROM personal_records WHERE id = $1", [id]);
  return rows[0] ? mapRecordRow(rows[0]) : null;
};

export const getSessions = async (userId: string): Promise<WorkoutSession[]> => {
  await ensureDataReady();
  const sessionRows = await queryRows(
    pool,
    "SELECT * FROM workout_sessions WHERE user_id = $1 ORDER BY started_at DESC",
    [userId]
  );
  if (!sessionRows.length) return [];

  const sessionIds = sessionRows.map((row) => String(row.id));
  const itemRows = await queryRows(
    pool,
    `SELECT * FROM workout_session_items
     WHERE session_id = ANY($1::text[])
     ORDER BY order_index ASC`,
    [sessionIds]
  );

  return hydrateSessions(sessionRows, itemRows);
};

export const saveSession = async (userId: string, sessionInput: UpsertSessionInput) => {
  await ensureDataReady();
  const id = sessionInput.id || createId("session");
  const startedAt = sessionInput.startedAt || new Date().toISOString();

  await transaction(async (client) => {
    if (sessionInput.id) {
      const existing = await client.query("SELECT user_id FROM workout_sessions WHERE id = $1", [id]);
      if (existing.rowCount && existing.rows[0].user_id !== userId) {
        throw new Error("Unauthorized: You do not own this session.");
      }
    }

    await client.query(
      `INSERT INTO workout_sessions
        (id, user_id, plan_id, plan_day_id, started_at, ended_at, day_index, title, effort, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         plan_id = EXCLUDED.plan_id,
         plan_day_id = EXCLUDED.plan_day_id,
         ended_at = EXCLUDED.ended_at,
         day_index = EXCLUDED.day_index,
         title = EXCLUDED.title,
         effort = EXCLUDED.effort,
         notes = EXCLUDED.notes`,
      [
        id,
        userId,
        sessionInput.planId ?? null,
        sessionInput.planDayId ?? null,
        startedAt,
        sessionInput.endedAt ?? null,
        sessionInput.day,
        sessionInput.title.trim(),
        sessionInput.effort.trim(),
        sessionInput.notes.trim(),
      ]
    );

    await client.query("DELETE FROM workout_session_items WHERE session_id = $1", [id]);

    const prRows: InsertRow[] = [];
    const existingRecords = await getRecords(userId);

    for (const item of sessionInput.items) {
      if (item.sets && item.sets.length > 0) {
        for (const set of item.sets) {
          const weightNum = parseFloat(set.weight);
          const repsNum = parseInt(set.reps);
          
          if (!isNaN(weightNum) && !isNaN(repsNum) && weightNum > 0 && repsNum > 0) {
            const currentBest = [...existingRecords, ...prRows.map((pr): RecordCandidate => ({
              exerciseId: String(pr.exercise_id),
              value: Number(pr.value),
              reps: Number(pr.reps),
            }))]
              .filter(r => r.exerciseId === item.exerciseId)
              .sort((a, b) => b.value - a.value || b.reps - a.reps)[0];

            if (!currentBest || weightNum > currentBest.value || (weightNum === currentBest.value && repsNum > currentBest.reps)) {
              prRows.push({
                id: createId("pr"),
                user_id: userId,
                exercise_id: item.exerciseId,
                value: weightNum,
                unit: "kg",
                reps: repsNum,
                achieved_at: startedAt,
                notes: `Auto-logged from session: ${sessionInput.title}`,
              });
            }
          }
        }
      }
    }

    if (prRows.length) {
      await bulkInsert(
        client,
        "personal_records",
        ["id", "user_id", "exercise_id", "value", "unit", "reps", "achieved_at", "notes"],
        prRows
      );
    }

    const itemRows = sessionInput.items.map((item, order) => ({
      id: item.id || createId("session_item"),
      session_id: id,
      exercise_id: item.exerciseId,
      exercise_name: item.exerciseName,
      planned_sets: item.plannedSets,
      reps: item.reps.trim(),
      rest_seconds: item.restSeconds,
      target_load: item.targetLoad.trim(),
      target_rpe: item.targetRpe.trim(),
      result: JSON.stringify(item.sets || []),
      notes: item.notes.trim(),
      order_index: order,
    }));

    if (itemRows.length) {
      await bulkInsert(
        client,
        "workout_session_items",
        ["id", "session_id", "exercise_id", "exercise_name", "planned_sets", "reps", "rest_seconds", "target_load", "target_rpe", "result", "notes", "order_index"],
        itemRows
      );
    }
  });

  const sessionRows = await queryRows(pool, "SELECT * FROM workout_sessions WHERE id = $1", [id]);
  if (!sessionRows.length) return null;
  const itemRows = await queryRows(
    pool,
    "SELECT * FROM workout_session_items WHERE session_id = $1 ORDER BY order_index ASC",
    [id]
  );
  return hydrateSessions(sessionRows, itemRows)[0] ?? null;
};

export const getCoachMessages = async (userId: string): Promise<CoachMessage[]> => {
  await ensureDataReady();
  const rows = await queryRows(
    pool,
    "SELECT * FROM coach_messages WHERE user_id = $1 ORDER BY created_at ASC",
    [userId]
  );
  return rows.map(mapCoachRow);
};

export const appendCoachExchange = async (
  userId: string,
  entries: Array<Pick<CoachMessage, "role" | "content">>
) => {
  await ensureDataReady();
  const createdAt = new Date().toISOString();

  const messageRows = entries.map((entry) => ({
    id: createId("msg"),
    user_id: userId,
    role: entry.role,
    content: entry.content.trim(),
    created_at: createdAt,
  }));

  if (messageRows.length) {
    await transaction(async (client) => {
      await bulkInsert(
        client,
        "coach_messages",
        ["id", "user_id", "role", "content", "created_at"],
        messageRows
      );
    });
  }
};

export const saveExercise = async (exercise: Omit<Exercise, "createdAt" | "updatedAt">) => {
  await ensureDataReady();
  await pool.query(
    `INSERT INTO exercises (id, name, category, primary_muscles, secondary_muscles, body_region_slugs, equipment, instructions, default_rest_seconds)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
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
      exercise.name.trim(),
      exercise.category,
      JSON.stringify(exercise.primaryMuscles || []),
      JSON.stringify(exercise.secondaryMuscles || []),
      JSON.stringify(exercise.bodyRegionSlugs || []),
      exercise.equipment,
      JSON.stringify(exercise.instructions || []),
      exercise.defaultRestSeconds || 90,
    ]
  );
  return exercise;
};
