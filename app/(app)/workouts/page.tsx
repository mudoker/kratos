import { WorkoutsPage } from "@/components/workouts/workouts-page";
import { getUserData } from "@/lib/server-data";

export default async function WorkoutsRoute() {
  const data = await getUserData();
  return <WorkoutsPage data={data} />;
}
