import { CoachPage } from "@/components/coach/coach-page";
import { getUserData } from "@/lib/server-data";

export default async function CoachRoute() {
  const data = await getUserData();
  return <CoachPage data={data} />;
}
