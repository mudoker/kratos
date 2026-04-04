import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { AuthScreen } from "@/components/auth/auth-screen";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");
  return <AuthScreen />;
}
