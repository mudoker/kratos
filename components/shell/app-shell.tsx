"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Bot,
  Dumbbell,
  Library,
  LogOut,
  Settings2,
  Sparkles,
  TableProperties,
  Trophy,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const items: Array<{ href: Route; label: string; icon: typeof BarChart3 }> = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/planner", label: "Weekly Planner", icon: TableProperties },
  { href: "/progress", label: "Progress Lab", icon: Trophy },
  { href: "/workouts", label: "Workout Studio", icon: Dumbbell },
  { href: "/exercises", label: "Exercise Library", icon: Library },
  { href: "/coach", label: "AI Coach", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

const titles: Record<string, string> = {
  "/dashboard": "Performance overview",
  "/planner": "Weekly split builder",
  "/progress": "PRs and momentum",
  "/workouts": "Session execution",
  "/exercises": "Exercise intelligence",
  "/coach": "AI coach",
  "/settings": "Profile and preferences",
};

export function AppShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[1680px] flex-col gap-6 px-4 pb-8 pt-4 lg:grid lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="rounded-[36px] border border-[color:var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.88),rgba(255,255,255,0.54))] p-6 shadow-[0_24px_80px_rgba(26,17,13,0.08)] backdrop-blur lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
        <div className="rounded-[30px] bg-[linear-gradient(180deg,#0f0f0f,#1a1a1a)] p-6 text-white shadow-[0_28px_70px_rgba(24,19,16,0.25)]">
          <Badge className="border-white/20 bg-white/10 text-white">Kratos System</Badge>
          <h1 className="mt-5 font-[family:var(--font-display)] text-3xl font-semibold leading-tight">
            Build the week. Run the session. Review the result.
          </h1>
          <p className="mt-3 text-sm leading-7 text-white/78">
            Weekly programming, workout execution, PR tracking, body-map context, and AI coaching now run on the same account data.
          </p>
        </div>

        <div className="mt-6 rounded-[28px] border border-[color:var(--border)] bg-white/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
            Logged In
          </p>
          <div className="mt-3 space-y-1">
            <p className="text-lg font-semibold text-[color:var(--foreground)]">{user.name}</p>
            <p className="text-sm text-[color:var(--muted-foreground)]">{user.email}</p>
          </div>
        </div>

        <nav className="mt-6 grid gap-2">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-[color:var(--muted-foreground)] transition hover:bg-white/70 hover:text-[color:var(--foreground)]",
                  pathname === item.href &&
                    "bg-black/8 text-[color:var(--foreground)] shadow-sm"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-6 grid gap-3">
          <div className="rounded-[24px] border border-[color:var(--border)] bg-[linear-gradient(180deg,#1a1a1a,#242424)] p-4 text-white">
            <div className="flex items-center gap-2 text-white">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold">Coach ready</span>
            </div>
            <p className="mt-2 text-sm leading-6 text-white/72">
              The AI chat uses your saved profile, recent sessions, plans, and PR context.
            </p>
          </div>
          <Button variant="secondary" onClick={logout} className="w-full">
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <main className="space-y-6">
        {children}
      </main>
    </div>
  );
}
