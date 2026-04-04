import { PlannerPage } from "@/components/planner/planner-page";
import { getUserData } from "@/lib/server-data";

export default async function PlannerRoute() {
  const data = await getUserData();
  return <PlannerPage data={data} />;
}
