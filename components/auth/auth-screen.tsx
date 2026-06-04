"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bot, CalendarRange, Dumbbell, Sparkles, Trophy, Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { TextGenerate } from "@/components/ui/text-generate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

const previewDays = [
  { day: "Mon", title: "Lower strength", target: "Back squat 5 x 3", width: "82%", color: "from-violet-500 to-indigo-500" },
  { day: "Wed", title: "Push volume", target: "Incline press at RPE 8", width: "65%", color: "from-emerald-500 to-teal-500" },
  { day: "Fri", title: "Pull and PR", target: "Deadlift marker set", width: "90%", color: "from-rose-500 to-orange-500" },
];

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");

    const result =
      mode === "register"
        ? await authClient.signUp.email({
            email: form.email,
            password: form.password,
            name: form.name,
          })
        : await authClient.signIn.email({
            email: form.email,
            password: form.password,
          });

    if (result.error) {
      setError(result.error.message || "Authentication failed.");
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#0a0a0c_0%,#111115_50%,#050507_100%)] flex items-center justify-center p-3 md:p-6 overflow-hidden relative">
      {/* Decorative blurred background shapes */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[20%] w-[30%] h-[30%] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none" />

      {/* Grid container with glass borders */}
      <div className="w-full max-w-[1440px] min-h-[85vh] grid rounded-[36px] overflow-hidden border border-white/5 bg-black/40 backdrop-blur-2xl shadow-[0_50px_100px_rgba(0,0,0,0.6)] lg:grid-cols-[1.1fr_0.9fr]">
        
        {/* Left Side: Premium Marketing & Preview */}
        <section className="relative overflow-hidden p-8 md:p-14 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-white/5">
          {/* Subtle grid background overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />
          <div className="absolute top-1/4 left-1/4 w-[250px] h-[250px] rounded-full bg-white/2 opacity-20 border border-white/10 pointer-events-none" />

          {/* Logo & Header */}
          <div className="relative flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <motion.div 
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.15)]"
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              >
                <Dumbbell className="h-5 w-5" />
              </motion.div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/60">Kratos</p>
                <p className="text-xs text-white/50 font-medium">Next-Gen Strength Workspace</p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Version 2.0 Active</span>
            </div>
          </div>

          {/* Title & Slogan */}
          <div className="relative mt-12 lg:mt-0 max-w-2xl z-10">
            <span className="inline-block px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-xs font-semibold uppercase tracking-wider mb-5">
              Structured Performance
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-[1.05]">
              Train with <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 via-indigo-400 to-violet-500 font-extrabold">structure</span>, not white-noise.
            </h2>
            <p className="mt-5 text-sm md:text-base text-white/60 leading-relaxed max-w-lg">
              Weekly planning, session logging, physical stimulus tracking, and contextual AI coaching. All unified under one cryptographic training vault.
            </p>
          </div>

          {/* Dynamic Interactive Program Board */}
          <div className="relative mt-10 lg:mt-0 grid gap-6 xl:grid-cols-[1.1fr_0.9fr] z-10">
            {/* Week preview */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md shadow-2xl relative group hover:border-white/20 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                <CalendarRange className="h-12 w-12 text-white" />
              </div>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Workout Splitting</p>
                  <h3 className="mt-1 font-semibold text-lg text-white">Program Board</h3>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {previewDays.map((entry, idx) => (
                  <motion.div 
                    key={entry.day} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                    className="rounded-2xl border border-white/5 bg-black/30 p-3.5 hover:bg-black/40 transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-bold text-white uppercase tracking-wider">{entry.day}</p>
                      <div className="h-1.5 w-20 rounded-full bg-white/10 overflow-hidden">
                        <div className={`h-full rounded-full bg-gradient-to-r ${entry.color}`} style={{ width: entry.width }} />
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-white/90">{entry.title}</p>
                    <p className="mt-0.5 text-[11px] text-white/50">{entry.target}</p>
                  </motion.div>
                ))}
              </div>

              {/* Mini Metrics Row */}
              <div className="mt-5 grid grid-cols-3 gap-2">
                {[
                  ["4", "Sessions/Wk"],
                  ["3", "PR Intent"],
                  ["Gemini", "AI Coach"],
                ].map(([value, label], i) => (
                  <div key={label} className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-center">
                    <p className="text-sm font-bold text-white">{value}</p>
                    <p className="mt-0.5 text-[9px] uppercase tracking-wider text-white/40">{label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Sidebar Feature Badges */}
            <div className="flex flex-col justify-between gap-3">
              {[
                {
                  icon: CalendarRange,
                  title: "Hyper-detailed planning",
                  desc: "Focus, targets, RPE, sets, volume tracking.",
                  color: "text-violet-400 border-violet-500/20 bg-violet-500/5",
                },
                {
                  icon: Trophy,
                  title: "PR Velocity Layer",
                  desc: "Compare plan intensity against true metrics.",
                  color: "text-amber-400 border-amber-500/20 bg-amber-500/5",
                },
                {
                  icon: Bot,
                  title: "Gym Bro Coach",
                  desc: "Trained AI analyzing your local training log.",
                  color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
                },
              ].map((item, idx) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + idx * 0.1 }}
                  className={`rounded-2xl border p-4 backdrop-blur-md flex gap-3 items-start ${item.color}`}
                >
                  <div className="p-2 rounded-xl bg-white/5 mt-0.5">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wide">{item.title}</h4>
                    <p className="mt-1 text-[11px] leading-relaxed text-white/60">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Right Side: Auth Inputs Form */}
        <section className="relative p-8 md:p-14 flex items-center justify-center bg-black/25">
          <div className="w-full max-w-[420px] relative z-10">
            {/* Mode Switcher */}
            <div className="p-1 rounded-2xl bg-white/5 border border-white/5 shadow-inner">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => { setMode("register"); setError(""); }}
                  className={`rounded-xl py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                    mode === "register"
                      ? "bg-white text-black shadow-lg"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Register
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("login"); setError(""); }}
                  className={`rounded-xl py-2.5 text-xs font-bold tracking-wider uppercase transition-all duration-300 ${
                    mode === "login"
                      ? "bg-white text-black shadow-lg"
                      : "text-white/50 hover:text-white"
                  }`}
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Headers */}
            <div className="mt-8 text-center sm:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-emerald-400">
                Secure Authentication
              </span>
              <h1 className="mt-2 font-bold text-3xl md:text-4xl text-white tracking-tight leading-tight">
                {mode === "register" ? "Build your vault" : "Unlock your workspace"}
              </h1>
              <p className="mt-2.5 text-xs text-white/40 leading-relaxed">
                Connect your workouts, plan parameters, personal records, and AI threads securely.
              </p>
            </div>

            {/* Error Message */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className="mt-6 p-3.5 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs font-medium"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Card & Form */}
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Arnold Schwarzenegger"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type="email"
                    required
                    placeholder="name@workspace.com"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-white/50 block">Password</label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-10 text-sm text-white placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-white/30 hover:text-white/60 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={pending} 
                className="mt-6 w-full py-6 rounded-xl font-bold uppercase tracking-wider text-xs bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-black border-none shadow-[0_0_25px_rgba(52,211,153,0.3)] transition duration-300 disabled:opacity-50"
              >
                {pending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="h-4 w-4 border-2 border-black border-t-transparent rounded-full"
                  />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-black mr-1" />
                    <span>{mode === "register" ? "Create Account" : "Access Vault"}</span>
                  </>
                )}
              </Button>

              <div className="mt-6 text-center text-xs text-white/40">
                {mode === "register" ? (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("login"); setError(""); }}
                      className="font-bold text-white hover:underline underline-offset-4"
                    >
                      Sign In instead
                    </button>
                  </p>
                ) : (
                  <p>
                    Need a new account?{" "}
                    <button
                      type="button"
                      onClick={() => { setMode("register"); setError(""); }}
                      className="font-bold text-white hover:underline underline-offset-4"
                    >
                      Register here
                    </button>
                  </p>
                )}
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
