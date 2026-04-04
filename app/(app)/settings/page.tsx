import { SettingsPage } from "@/components/settings/settings-page";
import { getUserData } from "@/lib/server-data";

export default async function SettingsRoute() {
  const data = await getUserData();
  return <SettingsPage data={data} />;
}
