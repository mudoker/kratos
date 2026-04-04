import { AppShell } from "@/components/shell/app-shell";
import { requireUser } from "@/lib/auth";
import { getUserData } from "@/lib/server-data";
import { DataProvider } from "@/components/shared/data-provider";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const data = await getUserData();

  return (
    <DataProvider data={data}>
      <AppShell user={user}>{children}</AppShell>
    </DataProvider>
  );
}
