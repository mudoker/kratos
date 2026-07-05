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
    <div className="flex flex-col h-full justify-between items-center lg:group-hover:items-stretch">
      <div className="space-y-5 w-full flex flex-col items-center lg:group-hover:items-stretch">
        
        {/* Core Brand Card */}
        <div className={cn(
          "bg-black text-white shadow-sm relative overflow-hidden transition-all duration-200",
          isMobile 
            ? "p-4.5 rounded-2xl w-full" 
            : "p-0 rounded-lg w-9 h-9 flex items-center justify-center lg:group-hover:p-4.5 lg:group-hover:rounded-2xl lg:group-hover:w-full lg:group-hover:h-auto"
        )}>
          <div className="absolute top-[-20%] right-[-20%] w-20 h-20 rounded-full bg-emerald-500/10 blur-lg pointer-events-none" />
          <div className="relative z-10 flex flex-col items-center lg:group-hover:items-stretch">
            <div className={cn("flex items-center justify-center lg:group-hover:justify-start w-full", isMobile ? "gap-2" : "gap-0 lg:group-hover:gap-2")}>
              <div className="h-5 w-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Dumbbell className="h-3 w-3" />
              </div>
              <span className={cn(
                "text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 transition-all duration-200 inline-block",
                !isMobile 
                  ? "w-0 opacity-0 ml-0 overflow-hidden whitespace-nowrap lg:group-hover:w-auto lg:group-hover:opacity-100 lg:group-hover:ml-2" 
                  : "ml-2"
              )}>
                Kratos System
              </span>
            </div>
            <div className={cn("transition-all duration-200", isMobile ? "mt-2.5 space-y-1" : "h-0 opacity-0 overflow-hidden lg:group-hover:h-auto lg:group-hover:opacity-100 lg:group-hover:mt-2.5 space-y-1")}>
              <h1 className="font-bold text-xs leading-snug tracking-tight text-white">
                Structured Gym telemetry
              </h1>
              <p className="text-[9px] leading-relaxed text-white/50">
                Synchronize workouts, biology mappings, and coaching parameters.
              </p>
            </div>
          </div>
        </div>

        {/* Athlete User info */}
        <div className={cn(
          "border border-black/[0.04] bg-neutral-50 flex items-center transition-all duration-200",
          isMobile 
            ? "p-3 rounded-xl w-full" 
            : "p-0 rounded-lg w-9 h-9 justify-center lg:group-hover:p-3 lg:group-hover:w-full lg:group-hover:justify-start"
        )}>
          <div className="h-7 w-7 shrink-0 flex items-center justify-center rounded-md bg-black text-white font-bold text-[10px]">
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          <div className={cn(
            "min-w-0 flex-1 ml-2.5 transition-opacity duration-200", 
            isMobile 
              ? "opacity-100 block" 
              : "opacity-0 lg:group-hover:opacity-100 hidden lg:group-hover:block overflow-hidden whitespace-nowrap"
          )}>
            <p className="text-xs font-bold text-neutral-800 truncate leading-none">{user.name}</p>
            <p className="text-[9px] text-neutral-400 truncate mt-1 leading-none">{user.email}</p>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex flex-col items-center lg:group-hover:items-stretch gap-1 w-full">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center transition-all duration-200 rounded-lg h-9 relative",
                  "w-9 justify-center p-0",
                  isMobile 
                    ? "w-full justify-start px-3 gap-2.5" 
                    : "lg:group-hover:w-full lg:group-hover:justify-start lg:group-hover:px-3 lg:group-hover:gap-2.5",
                  isActive
                    ? "bg-neutral-100 text-neutral-900 font-semibold"
                    : "text-neutral-600 font-medium hover:bg-neutral-50 hover:text-neutral-900"
                )}
              >
                <Icon className={cn("h-4.5 w-4.5 shrink-0 transition-colors", isActive ? "text-black" : "text-neutral-500")} />
                <span className={cn(
                  "transition-all duration-200 ease-in-out inline-block text-xs font-semibold", 
                  isMobile 
                    ? "opacity-100 ml-2.5" 
                    : "w-0 opacity-0 ml-0 overflow-hidden whitespace-nowrap lg:group-hover:w-auto lg:group-hover:opacity-100 lg:group-hover:ml-2.5",
                  isActive ? "text-black font-semibold" : "text-neutral-600 font-medium"
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Logout button & intelligence badge */}
      <div className="space-y-3 pt-4 border-t border-black/[0.04] mt-4 w-full flex flex-col items-center lg:group-hover:items-stretch">
        <div className={cn(
          "border border-indigo-100 bg-indigo-50/10 text-indigo-700 transition-all duration-200",
          isMobile 
            ? "p-3 rounded-lg w-full" 
            : "p-0 rounded-lg w-9 h-9 flex items-center justify-center lg:group-hover:p-3 lg:group-hover:w-full"
        )}>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className={cn(
              "text-[9px] font-extrabold uppercase tracking-wide transition-all duration-200 inline-block", 
              isMobile 
                ? "opacity-100 ml-2" 
                : "w-0 opacity-0 ml-0 overflow-hidden whitespace-nowrap lg:group-hover:w-auto lg:group-hover:opacity-100 lg:group-hover:ml-2"
            )}>
              Coach Node Ready
            </span>
          </div>
        </div>
        <Button 
          variant="ghost" 
          onClick={logout} 
          className={cn(
            "justify-start rounded-lg text-xs font-semibold text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition shrink-0",
            isMobile 
              ? "w-full px-3 py-3 gap-2.5" 
              : "w-9 h-9 p-0 justify-center lg:group-hover:w-full lg:group-hover:justify-start lg:group-hover:px-3 lg:group-hover:py-3 lg:group-hover:gap-2.5"
          )}
        >
          <LogOut className="h-4.5 w-4.5 shrink-0" />
          <span className={cn(
            "transition-all duration-200 ease-in-out inline-block text-xs font-semibold", 
            isMobile 
              ? "opacity-100 ml-2.5" 
              : "w-0 opacity-0 ml-0 overflow-hidden whitespace-nowrap lg:group-hover:w-auto lg:group-hover:opacity-100 lg:group-hover:ml-2.5"
          )}>
            Sign Out
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto min-h-screen w-full max-w-[1680px] flex flex-col px-3 pt-3 pb-24 lg:grid lg:grid-cols-[80px_1fr] lg:gap-6 lg:px-4 lg:pb-8 lg:pt-4">
      
      {/* Desktop Left Sticky Sidebar */}
      <aside className="hidden lg:block relative w-20 shrink-0 h-[calc(100vh-2rem)] sticky top-4 z-40">
        <div className="absolute left-0 top-0 h-full w-20 hover:w-[280px] transition-all duration-300 ease-in-out border border-black/5 bg-white/90 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.04)] backdrop-blur rounded-[36px] overflow-y-auto overflow-x-hidden flex flex-col group">
          <SidebarContent isMobile={false} />
        </div>
      </aside>

      {/* Responsive Mobile Top Sticky Navigation Header Bar (Flush edge-to-edge) */}
      <header className="lg:hidden flex items-center justify-between -mx-3 -mt-3 mb-4 rounded-none border-b border-black/5 px-4 py-2.5 bg-white/75 backdrop-blur-md sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <Dumbbell className="h-3.5 w-3.5" />
          </div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-black/40 block leading-none">Kratos</span>
        </div>
        <span className="text-[11px] font-extrabold text-black/80 tracking-tight">{activeTitle}</span>
      </header>

      {/* Main Work Area Content */}
      <main className="space-y-6 flex-1 min-w-0 mt-2 lg:mt-0">
        {children}
      </main>

      {/* Responsive Mobile Bottom Tab Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-xl border-t border-black/[0.04] px-2 pt-1 pb-[calc(env(safe-area-inset-bottom)+4px)] shadow-[0_-4px_24px_rgba(0,0,0,0.015)] flex items-center justify-around">
        {[
          { href: "/dashboard" as Route, label: "Summary", icon: BarChart3 },
          { href: "/planner" as Route, label: "Planner", icon: TableProperties },
          { href: "/workouts" as Route, label: "Workouts", icon: Dumbbell },
          { href: "/coach" as Route, label: "AI Coach", icon: Bot },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center pt-1.5 pb-0.5 flex-1 transition-colors duration-150 active:scale-98 select-none",
                isActive ? "text-black" : "text-[#8e8e93]"
              )}
            >
              <Icon className="h-5.5 w-5.5" strokeWidth={isActive ? 2.25 : 1.8} />
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}

        {/* More Button to trigger sidebar menu */}
        <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <DialogTrigger asChild>
            <button
              type="button"
              className="flex flex-col items-center justify-center pt-1.5 pb-0.5 flex-1 transition-colors duration-150 active:scale-98 text-[#8e8e93] select-none"
            >
              <Menu className="h-5.5 w-5.5" strokeWidth={1.8} />
              <span className="text-[10px] font-semibold tracking-tight mt-0.5">More</span>
            </button>
          </DialogTrigger>
          <DialogContent className="fixed top-0 left-0 bottom-0 h-full w-[280px] translate-x-0 translate-y-0 rounded-r-2xl rounded-l-none bg-white p-5 border-r border-black/10 overflow-y-auto max-w-full z-50">
            <SidebarContent isMobile={true} />
          </DialogContent>
        </Dialog>
      </nav>
    </div>
  );
}
