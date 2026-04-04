"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUpRight, Bot, CalendarRange, Dumbbell, Sparkles, Trophy } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { TextGenerate } from "@/components/ui/text-generate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

const previewDays = [
  { day: "Mon", title: "Lower strength", target: "Back squat 5 x 3", width: "78%" },
  { day: "Wed", title: "Push volume", target: "Incline press at RPE 8", width: "62%" },
  { day: "Fri", title: "Pull and PR", target: "Deadlift marker set", width: "86%" },
];

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
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
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f8f8_0%,#ececec_100%)] px-4 py-4">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-[1540px] overflow-hidden rounded-[40px] border border-[color:var(--border)] bg-white shadow-[0_40px_120px_rgba(0,0,0,0.08)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative overflow-hidden bg-[linear-gradient(180deg,#0d0d0d_0%,#161616_48%,#202020_100%)] px-8 py-8 text-white md:px-12 md:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_34%),linear-gradient(135deg,transparent_0%,transparent_42%,rgba(255,255,255,0.04)_42%,rgba(255,255,255,0.04)_43%,transparent_43%,transparent_100%)]" />
          <div className="pointer-events-none absolute inset-y-0 right-[14%] w-px bg-white/8" />
          <div className="pointer-events-none absolute left-8 top-8 h-28 w-28 rounded-full border border-white/8" />
          <div className="pointer-events-none absolute bottom-10 right-10 h-40 w-40 rounded-full border border-white/8" />

          <div className="relative flex h-full flex-col">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-white/12 bg-white/6">
                  <Dumbbell className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/54">Kratos</p>
                  <p className="mt-1 text-sm text-white/68">Strength workspace</p>
                </div>
              </div>

              <div className="hidden items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/58 md:flex">
                <span>Monochrome system</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="mt-14 max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/46">Structured training</p>
              <div className="mt-5 max-w-4xl text-5xl font-semibold leading-[0.9] text-white md:text-7xl">
                <TextGenerate text="Train with structure, not white-noise." className="text-white" />
              </div>
              <p className="mt-6 max-w-2xl text-base leading-8 text-white/66 md:text-lg">
                Weekly planning, session execution, PR tracking, and the coach all pull from the same training record.
              </p>
            </div>

            <div className="mt-10 grid flex-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
              <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-5 backdrop-blur-xl">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/52">Week preview</p>
                    <h2 className="mt-2 font-[family:var(--font-display)] text-2xl font-semibold text-white">
                      Program board
                    </h2>
                  </div>
                  <CalendarRange className="h-5 w-5 text-white/60" />
                </div>

                <div className="mt-6 space-y-3">
                  {previewDays.map((entry) => (
                    <div key={entry.day} className="rounded-[24px] border border-white/10 bg-black/24 p-4">
                      <div className="flex items-center justify-between gap-4">
                        <p className="text-sm font-semibold text-white">{entry.day}</p>
                        <div className="h-2 w-24 rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-white" style={{ width: entry.width }} />
                        </div>
                      </div>
                      <p className="mt-3 text-sm font-medium text-white/88">{entry.title}</p>
                      <p className="mt-1 text-sm leading-6 text-white/58">{entry.target}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {[
                    ["4", "Target sessions"],
                    ["3", "PR checkpoints"],
                    ["1", "Coach review"],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-[22px] border border-white/10 bg-white/6 p-4">
                      <p className="text-2xl font-semibold text-white">{value}</p>
                      <p className="mt-2 text-[11px] uppercase tracking-[0.18em] text-white/48">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                {[
                  {
                    icon: CalendarRange,
                    title: "Weekly planner",
                    copy: "Program each day with focus, warm-up, target load, RPE, PR goals, and lift notes.",
                  },
                  {
                    icon: Trophy,
                    title: "PR layer",
                    copy: "Track PR intent on the plan itself, then compare it against the real session result.",
                  },
                  {
                    icon: Bot,
                    title: "AI coach",
                    copy: "Text responses use your profile, recent plans, PR records, and completed sessions.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-5"
                  >
                    <item.icon className="h-5 w-5 text-white" />
                    <h3 className="mt-4 font-[family:var(--font-display)] text-xl font-semibold text-white">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-white/62">{item.copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex items-center bg-[linear-gradient(180deg,#fafafa_0%,#f0f0f0_100%)] px-8 py-8 md:px-12 md:py-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.9),transparent_30%)]" />

          <div className="relative mx-auto w-full max-w-[470px]">
            <div className="rounded-full border border-[color:var(--border)] bg-white/84 p-1 shadow-sm">
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "register"
                      ? "bg-[color:var(--brand)] text-white"
                      : "text-[color:var(--muted-foreground)]"
                  }`}
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === "login"
                      ? "bg-[color:var(--brand)] text-white"
                      : "text-[color:var(--muted-foreground)]"
                  }`}
                >
                  Sign in
                </button>
              </div>
            </div>

            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted-foreground)]">
                Better Auth
              </p>
              <h1 className="mt-3 font-[family:var(--font-display)] text-4xl font-semibold text-[color:var(--foreground)] md:text-5xl">
                {mode === "register" ? "Create your account" : "Sign in to your workspace"}
              </h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-[color:var(--muted-foreground)]">
                Your plans, sessions, PR records, and coach thread stay attached to your own account from the start.
              </p>
            </div>

            <Card className="mt-8 border-[color:var(--border-strong)] bg-[rgba(255,255,255,0.97)] p-6 shadow-[0_32px_90px_rgba(0,0,0,0.08)]">
              <form onSubmit={submit} className="space-y-4">
                {mode === "register" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Full name</p>
                    <Input
                      placeholder="Full name"
                      value={form.name}
                      onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>
                ) : null}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Email address</p>
                  <Input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[color:var(--muted-foreground)]">Password</p>
                  <Input
                    type="password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  />
                </div>

                {error ? <p className="text-sm font-medium text-[color:var(--danger)]">{error}</p> : null}

                <Button type="submit" disabled={pending} className="mt-2 w-full">
                  <Sparkles className="h-4 w-4" />
                  {pending ? "Working..." : mode === "register" ? "Create account" : "Sign in"}
                </Button>

                <div className="rounded-[22px] border border-[color:var(--border)] bg-black/[0.03] px-4 py-3 text-sm leading-6 text-[color:var(--muted-foreground)]">
                  {mode === "register"
                    ? "Already have an account?"
                    : "Need a new account?"}{" "}
                  <button
                    type="button"
                    onClick={() => setMode((current) => (current === "register" ? "login" : "register"))}
                    className="font-semibold text-[color:var(--foreground)] underline decoration-[color:var(--border-strong)] underline-offset-4"
                  >
                    {mode === "register" ? "Sign in instead" : "Create one here"}
                  </button>
                </div>
              </form>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
