"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
  Menu,
  X,
  Compass
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { AppUser } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

const items: Array<{ href: Route; label: string; icon: typeof BarChart3 }> = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/planner", label: "Weekly Planner", icon: TableProperties },
  { href: "/progress", label: "Progress Lab", icon: Trophy },
  { href: "/workouts", label: "Workout Studio", icon: Dumbbell },
  { href: "/exercises", label: "Exercise Library", icon: Library },
  { href: "/coach", label: "AI Coach", icon: Bot },
  { href: "/settings", label: "Settings", icon: Settings2 },
];

export function AppShell({ user, children }: { user: AppUser; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const logout = async () => {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  };

  const activeTitle = items.find((item) => item.href === pathname)?.label || "Kratos";

  const SidebarContent = () => (
    <div className="flex flex-col h-full justify-between">
      <div className="space-y-6">
        
        {/* Core Brand Card */}
        <div className="p-5 rounded-[26px] bg-gradient-to-br from-slate-900 to-black text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-[-20%] right-[-20%] w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Dumbbell className="h-3.5 w-3.5" />
              </div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400">Kratos System</span>
            </div>
            <h1 className="font-bold text-lg leading-snug tracking-tight text-white">
              Structured Gym telemetry
            </h1>
            <p className="text-[10px] leading-relaxed text-white/50">
              Synchronize workouts, biology mappings, and coaching parameters.
            </p>
          </div>
        </div>

        {/* Athlete User info */}
        <div className="p-3.5 rounded-xl border border-black/5 bg-black/[0.01] flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-black text-white font-bold text-xs">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-black truncate leading-none">{user.name}</p>
            <p className="text-[9px] text-black/40 truncate mt-1 leading-none">{user.email}</p>
          </div>
        </div>

        {/* Navigation list (Medium weight, Sentence Case, Not bold when inactive) */}
        <nav className="grid gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3.5 rounded-xl px-4 py-3 text-xs tracking-wide transition duration-200",
                  isActive
                    ? "bg-black text-white! font-bold shadow-sm"
                    : "text-black/60 font-medium hover:bg-black/5 hover:text-black"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button & intelligence badge */}
      <div className="space-y-4 pt-6 border-t border-black/5 mt-6">
        <div className="rounded-xl border border-black/5 bg-indigo-50/20 p-3.5 text-black">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span className="text-[9px] font-extrabold uppercase tracking-wide">Coach Node Ready</span>
          </div>
          <p className="mt-1 text-[9px] leading-relaxed text-black/45">
            Gemini intelligence reads dynamically from settings and physical PR metrics.
          </p>
        </div>
        <Button variant="ghost" onClick={logout} className="w-full justify-start gap-2 rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition py-4">
          <LogOut className="h-4 w-4" />
          <span>Sign Out</span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1680px] flex flex-col lg:grid lg:grid-cols-[280px_1fr] gap-6 px-4 pb-8 pt-4">
      
      {/* Desktop Left Sticky Sidebar */}
      <aside className="hidden lg:block rounded-[36px] border border-black/5 bg-white/70 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.02)] backdrop-blur sticky top-4 h-[calc(100vh-2rem)] overflow-y-auto">
        <SidebarContent />
      </aside>

      {/* Responsive Mobile Top Sticky Navigation Header Bar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white/75 backdrop-blur border border-black/5 rounded-2xl sticky top-2 z-40 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
            <Dumbbell className="h-4.5 w-4.5" />
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-black/40 block leading-none">Kratos</span>
            <span className="text-xs font-bold text-black mt-0.5 block leading-none">{activeTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-black/5 text-black">
                <Menu className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="fixed top-0 left-0 bottom-0 h-full w-[280px] translate-x-0 translate-y-0 rounded-r-3xl rounded-l-none bg-white p-5 border-r border-black/10 overflow-y-auto max-w-full">
              <SidebarContent />
            </DialogContent>
          </Dialog>
        </div>
      </header>

      {/* Main Work Area Content */}
      <main className="space-y-6 flex-1 min-w-0 mt-2 lg:mt-0">
        {children}
      </main>
    </div>
  );
}
