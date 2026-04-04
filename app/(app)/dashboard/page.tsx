import { DashboardPage } from "@/components/dashboard/dashboard-page";
import { getUserData } from "@/lib/server-data";

export default async function DashboardRoute() {
  const data = await getUserData();
  return <DashboardPage data={data} />;
}
