"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Dumbbell, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AuthScreen() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");

    const result = await authClient.signIn.email({
      email: form.email,
      password: form.password,
    });

    if (result.error) {
      setError(result.error.message || "Could not sign in with those credentials.");
      setPending(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08090A] px-4 py-8 text-white">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:36px_36px] opacity-30" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-emerald-400/[0.045] to-transparent" />

      <div className="relative w-full max-w-[318px]">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.055] text-emerald-300 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
              <Dumbbell className="h-3.5 w-3.5" />
            </div>
            <span className="text-[9px] font-bold uppercase tracking-[0.22em] text-white/42">Kratos</span>
          </div>
          <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.07] px-2 py-0.5 text-[9px] font-semibold text-emerald-200/85">
            Neon
          </span>
        </div>

        <Card className="rounded-2xl border-white/10 bg-[#101113]/95 p-3.5 shadow-[0_22px_80px_rgba(0,0,0,0.36)] backdrop-blur sm:p-5">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold tracking-tight text-white">Sign in</CardTitle>
            <CardDescription className="max-w-[250px] text-[11px] leading-relaxed text-white/45">
              Access your training workspace with Neon Auth.
            </CardDescription>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200">
              {error}
            </div>
          ) : null}

          <form onSubmit={submit} className="mt-3.5 space-y-2.5">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/38">
                Email
              </Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/32" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="h-8 rounded-lg border-white/10 bg-white/[0.055] pl-8 text-xs text-white placeholder:text-white/24 hover:bg-white/[0.075] focus-visible:bg-white/[0.085] focus-visible:ring-1 focus-visible:ring-emerald-300/25"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/38">
                Password
              </Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/32" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="Password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="h-8 rounded-lg border-white/10 bg-white/[0.055] pl-8 pr-9 text-xs text-white placeholder:text-white/24 hover:bg-white/[0.075] focus-visible:bg-white/[0.085] focus-visible:ring-1 focus-visible:ring-emerald-300/25"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 rounded-md text-white/42 hover:bg-white/[0.06] hover:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="h-8 w-full rounded-lg border border-white/10 bg-white text-xs font-semibold text-[#090A0B] shadow-[0_14px_34px_rgba(0,0,0,0.2)] hover:bg-emerald-100"
            >
              {pending ? (
                "Signing in..."
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>
          </form>
        </Card>

        <p className="mt-2.5 text-center text-[9px] font-medium text-white/28">
          No registration on this device.
        </p>
      </div>
    </main>
  );
}
