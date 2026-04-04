import { ExercisesPage } from "@/components/exercises/exercises-page";
import { getUserData } from "@/lib/server-data";

export default async function ExercisesRoute() {
  const data = await getUserData();
  return <ExercisesPage data={data} />;
}
