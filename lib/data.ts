import { ensureAuthTables } from "@/lib/auth";
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
import type {
  CoachMessage,
  Exercise,
  PersonalRecord,
  UserProfile,
  WeeklyPlan,
  WorkoutSession,
} from "@/lib/types";

type UpsertPlanInput = Pick<WeeklyPlan, "id" | "name" | "notes" | "days">;
type UpsertSessionInput = Omit<WorkoutSession, "id" | "userId" | "startedAt"> & {
  id?: string;
  startedAt?: string;
};
type UpsertRecordInput = Omit<PersonalRecord, "id" | "userId"> & { id?: string };

let dataReady: Promise<void> | null = null;

export const ensureDataReady = async () => {
  if (!dataReady) {
    dataReady = (async () => {
      await ensureAuthTables();
      await ensureAppTables();
    })();
  }

  await dataReady;
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
    `INSERT INTO profiles (user_id, goal, experience_level, weekly_sessions, injuries, notes, body_gender)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (user_id) DO UPDATE SET
       goal = EXCLUDED.goal,
       experience_level = EXCLUDED.experience_level,
       weekly_sessions = EXCLUDED.weekly_sessions,
       injuries = EXCLUDED.injuries,
       notes = EXCLUDED.notes,
       body_gender = EXCLUDED.body_gender`,
    [
      userId,
      profile.goal,
      profile.experienceLevel,
      profile.weeklySessions,
      profile.injuries,
      profile.notes,
      profile.bodyGender,
    ]
  );

  return getProfile(userId);
};

export const getPlans = async (userId: string): Promise<WeeklyPlan[]> => {
  await ensureDataReady();
  const planRows = await queryRows(
    pool,
    "SELECT * FROM weekly_plans WHERE user_id = $1 ORDER BY updated_at DESC",
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
    await client.query(
      `INSERT INTO weekly_plans (id, user_id, name, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name,
         notes = EXCLUDED.notes,
         updated_at = EXCLUDED.updated_at`,
      [planId, userId, planInput.name.trim(), planInput.notes.trim(), now, now]
    );

    await client.query("DELETE FROM weekly_plan_days WHERE plan_id = $1", [planId]);

    for (const day of days) {
      await client.query(
        `INSERT INTO weekly_plan_days
          (id, plan_id, day_index, title, focus, warmup, session_goal, target_muscles, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)`,
        [
          day.id,
          planId,
          day.day,
          day.title.trim(),
          day.focus.trim(),
          day.warmup.trim(),
          day.sessionGoal.trim(),
          JSON.stringify(day.targetMuscles),
          day.notes.trim(),
        ]
      );

      for (const item of day.items) {
        await client.query(
          `INSERT INTO weekly_plan_items
            (id, day_id, exercise_id, sets, reps, rest_seconds, target_load, target_rpe, pr_goal, notes, order_index)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            item.id,
            day.id,
            item.exerciseId,
            item.sets,
            item.reps.trim(),
            item.restSeconds,
            item.targetLoad.trim(),
            item.targetRpe.trim(),
            item.prGoal.trim(),
            item.notes.trim(),
            item.order,
          ]
        );
      }
    }
  });

  return (await getPlans(userId)).find((plan) => plan.id === planId) ?? null;
};

export const deletePlan = async (userId: string, planId: string) => {
  await ensureDataReady();
  await pool.query("DELETE FROM weekly_plans WHERE id = $1 AND user_id = $2", [planId, userId]);
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

  return (await getRecords(userId)).find((entry) => entry.id === id) ?? null;
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

    for (const [order, item] of sessionInput.items.entries()) {
      await client.query(
        `INSERT INTO workout_session_items
          (id, session_id, exercise_id, exercise_name, planned_sets, reps, rest_seconds, target_load, target_rpe, result, notes, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          item.id || createId("session_item"),
          id,
          item.exerciseId,
          item.exerciseName,
          item.plannedSets,
          item.reps.trim(),
          item.restSeconds,
          item.targetLoad.trim(),
          item.targetRpe.trim(),
          item.result.trim(),
          item.notes.trim(),
          order,
        ]
      );
    }
  });

  return (await getSessions(userId)).find((session) => session.id === id) ?? null;
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

  await transaction(async (client) => {
    for (const entry of entries) {
      await client.query(
        "INSERT INTO coach_messages (id, user_id, role, content, created_at) VALUES ($1, $2, $3, $4, $5)",
        [createId("msg"), userId, entry.role, entry.content.trim(), createdAt]
      );
    }
  });
};
