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

  const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className="flex flex-col h-full justify-between items-center lg:items-stretch">
      <div className="space-y-6 w-full flex flex-col items-center lg:items-stretch">
        
        {/* Core Brand Card */}
        <div className={cn(
          "bg-gradient-to-br from-slate-900 to-black text-white shadow-xl relative overflow-hidden transition-all duration-300",
          isMobile 
            ? "p-5 rounded-[26px] w-full" 
            : "p-0 rounded-xl w-11 h-11 flex items-center justify-center lg:group-hover:p-5 lg:group-hover:rounded-[26px] lg:group-hover:w-full lg:group-hover:h-auto"
        )}>
          <div className="absolute top-[-20%] right-[-20%] w-24 h-24 rounded-full bg-emerald-500/10 blur-xl pointer-events-none" />
          <div className="relative z-10 space-y-3 flex flex-col items-center lg:items-stretch">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Dumbbell className="h-3.5 w-3.5" />
              </div>
              <span className={cn("text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 transition-opacity duration-300", !isMobile && "opacity-0 lg:group-hover:opacity-100 overflow-hidden whitespace-nowrap")}>
                Kratos System
              </span>
            </div>
            <div className={cn("transition-all duration-300", !isMobile && "h-0 opacity-0 overflow-hidden lg:group-hover:h-auto lg:group-hover:opacity-100 space-y-1")}>
              <h1 className="font-bold text-sm leading-snug tracking-tight text-white">
                Structured Gym telemetry
              </h1>
              <p className="text-[10px] leading-relaxed text-white/50">
                Synchronize workouts, biology mappings, and coaching parameters.
              </p>
            </div>
          </div>
        </div>

        {/* Athlete User info */}
        <div className={cn(
          "border border-black/5 bg-black/[0.01] flex items-center transition-all duration-300",
          isMobile 
            ? "p-3.5 rounded-xl w-full" 
            : "p-0 rounded-xl w-11 h-11 justify-center lg:group-hover:p-3.5 lg:group-hover:w-full lg:group-hover:justify-start"
        )}>
          <div className="h-9 w-9 shrink-0 flex items-center justify-center rounded-xl bg-black text-white font-bold text-xs">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className={cn(
            "min-w-0 flex-1 ml-3 transition-opacity duration-300", 
            isMobile 
              ? "opacity-100 block" 
              : "opacity-0 lg:group-hover:opacity-100 hidden lg:group-hover:block overflow-hidden whitespace-nowrap"
          )}>
            <p className="text-xs font-bold text-black truncate leading-none">{user.name}</p>
            <p className="text-[9px] text-black/40 truncate mt-1 leading-none">{user.email}</p>
          </div>
        </div>

        {/* Navigation list (Medium weight, Sentence Case, Not bold when inactive) */}
        <nav className="flex flex-col items-center lg:items-stretch gap-1.5 w-full">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center transition-all duration-300 rounded-xl h-11 relative",
                  // Shrunken desktop style: center icon, square shape
                  "w-11 justify-center p-0",
                  // Mobile (always expanded) and expanded hover styles:
                  isMobile 
                    ? "w-full justify-start px-4 gap-3.5" 
                    : "lg:group-hover:w-full lg:group-hover:justify-start lg:group-hover:px-4 lg:group-hover:gap-3.5",
                  isActive
                    ? "bg-black text-white font-bold shadow-sm"
                    : "text-black/60 font-medium hover:bg-black/5 hover:text-black"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0", isActive ? "text-white" : "text-black/60")} />
                <span className={cn(
                  "transition-opacity duration-300", 
                  isMobile 
                    ? "opacity-100 ml-3" 
                    : "opacity-0 lg:group-hover:opacity-100 lg:group-hover:ml-3 overflow-hidden whitespace-nowrap",
                  isActive ? "!text-white" : "text-black/60"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button & intelligence badge */}
      <div className="space-y-4 pt-6 border-t border-black/5 mt-6 w-full flex flex-col items-center lg:items-stretch">
        <div className={cn(
          "border border-black/5 bg-indigo-50/20 text-indigo-900 transition-all duration-300",
          isMobile 
            ? "p-3.5 rounded-xl w-full" 
            : "p-0 rounded-xl w-11 h-11 flex items-center justify-center lg:group-hover:p-3.5 lg:group-hover:w-full"
        )}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4.5 w-4.5 text-indigo-600 shrink-0" />
            <span className={cn(
              "text-[9px] font-extrabold uppercase tracking-wide transition-opacity duration-300", 
              isMobile 
                ? "opacity-100" 
                : "opacity-0 lg:group-hover:opacity-100 overflow-hidden whitespace-nowrap"
            )}>
              Coach Node Ready
            </span>
          </div>
          <p className={cn(
            "mt-1 text-[9px] leading-relaxed text-indigo-900/60 transition-all duration-300", 
            isMobile 
              ? "block" 
              : "hidden lg:group-hover:block"
          )}>
            Gemini intelligence reads dynamically from settings and physical PR metrics.
          </p>
        </div>
        <Button 
          variant="ghost" 
          onClick={logout} 
          className={cn(
            "justify-start rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-50 hover:text-rose-600 transition shrink-0",
            isMobile 
              ? "w-full px-4 py-4 gap-3.5" 
              : "w-11 h-11 p-0 justify-center lg:group-hover:w-full lg:group-hover:justify-start lg:group-hover:px-4 lg:group-hover:py-4 lg:group-hover:gap-3.5"
          )}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span className={cn(
            "transition-opacity duration-300", 
            isMobile 
              ? "opacity-100 ml-3" 
              : "opacity-0 lg:group-hover:opacity-100 lg:group-hover:ml-3 overflow-hidden whitespace-nowrap"
          )}>
            Sign Out
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1680px] flex flex-col lg:grid lg:grid-cols-[80px_1fr] gap-6 px-4 pb-8 pt-4">
      
      {/* Desktop Left Sticky Sidebar */}
      <aside className="hidden lg:block relative w-20 shrink-0 h-[calc(100vh-2rem)] sticky top-4 z-40">
        <div className="absolute left-0 top-0 h-full w-20 hover:w-[280px] transition-all duration-300 ease-in-out border border-black/5 bg-white/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.04)] backdrop-blur rounded-[36px] overflow-y-auto overflow-x-hidden flex flex-col group">
          <SidebarContent isMobile={false} />
        </div>
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
              <SidebarContent isMobile={true} />
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
