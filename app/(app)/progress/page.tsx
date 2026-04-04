import { ProgressPage } from "@/components/progress/progress-page";
import { getUserData } from "@/lib/server-data";

export default async function ProgressRoute() {
  const data = await getUserData();
  return <ProgressPage data={data} />;
}
