import { cache } from "react";
import { requireUser } from "@/lib/auth";
import { getCoachMessages, getExercises, getPlans, getProfile, getRecords, getSessions } from "@/lib/data";

export const getUserData = cache(async () => {
  const user = await requireUser();
  const [profile, plans, sessions, coachMessages, exercises, records] = await Promise.all([
    getProfile(user.id),
    getPlans(user.id),
    getSessions(user.id),
    getCoachMessages(user.id),
    getExercises(),
    getRecords(user.id),
  ]);

  return {
    user,
    profile,
    plans,
    sessions,
    coachMessages,
    exercises,
    records,
  };
});
