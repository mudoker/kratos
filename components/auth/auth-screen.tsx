"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Dumbbell, KeyRound, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4">
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.78-.07-1.53-.2-2.23H12v4.22h5.38a4.6 4.6 0 0 1-2 3.02v2.47h3.24c1.9-1.75 2.98-4.32 2.98-7.48Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.9 6.62-2.29l-3.24-2.47c-.9.6-2.04.96-3.38.96-2.6 0-4.8-1.76-5.59-4.12H3.07v2.55A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.41 14.08a6 6 0 0 1 0-3.82V7.71H3.07a10 10 0 0 0 0 8.92l3.34-2.55Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.96c1.47 0 2.78.5 3.82 1.5l2.87-2.87C16.96 2.97 14.7 2 12 2a10 10 0 0 0-8.93 5.71l3.34 2.55C7.2 7.9 9.4 5.96 12 5.96Z"
      />
    </svg>
  );
}

const resetPwaShell = async () => {
  if (typeof window === "undefined" || !("caches" in window)) return;

  try {
    const keys = await window.caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith("kratos-v")).map((key) => window.caches.delete(key)));

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // PWA cleanup is best-effort; auth navigation should still continue.
  }
};

const dashboardUrl = () => `/dashboard?pwa-auth=${Date.now()}`;

export function AuthScreen() {
  const [form, setForm] = useState({ email: "", otp: "" });
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    document.body.style.setProperty("--safe-area-background", "#08090A");
    return () => {
      document.body.style.removeProperty("--safe-area-background");
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const redirectAuthenticatedPwa = async () => {
      try {
        const result = await authClient.getSession({
          query: { disableCookieCache: true },
          fetchOptions: { cache: "no-store" },
        });

        if (!cancelled && result.data?.user) {
          await resetPwaShell();
          window.location.replace(dashboardUrl());
        }
      } catch {
        // If session probing fails, keep the normal login form available.
      }
    };

    void redirectAuthenticatedPwa();

    return () => {
      cancelled = true;
    };
  }, []);

  const requestCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");

    const result = await authClient.emailOtp.sendVerificationOtp({
      email: form.email,
      type: "sign-in",
    });

    if (result.error) {
      setError(result.error.message || "Could not send a sign-in code.");
      setPending(false);
      return;
    }

    setCodeSent(true);
    setPending(false);
  };

  const verifyCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError("");

    const result = await authClient.signIn.emailOtp({
      email: form.email,
      otp: form.otp.replace(/\s/g, ""),
    });

    if (result.error) {
      setError(result.error.message || "That code did not work.");
      setPending(false);
      return;
    }

    await resetPwaShell();
    window.location.replace(dashboardUrl());
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
              Get a one-time code from Neon Auth.
            </CardDescription>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-3.5 space-y-2.5">
            <Button
              asChild
              variant="secondary"
              className="h-8 w-full rounded-lg border border-white/10 !bg-white text-xs font-semibold !text-neutral-950 shadow-[0_14px_34px_rgba(0,0,0,0.2)] hover:!bg-neutral-100 [&>span]:!text-neutral-950"
            >
              <a
                href="/api/auth/google"
                onClick={(event) => {
                  event.preventDefault();
                  void resetPwaShell().finally(() => {
                    window.location.href = "/api/auth/google";
                  });
                }}
              >
                <GoogleIcon />
                <span>Continue with Google</span>
              </a>
            </Button>

            <div className="flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/24">
              <span className="h-px flex-1 bg-white/10" />
              <span>Email code</span>
              <span className="h-px flex-1 bg-white/10" />
            </div>
          </div>

          <form onSubmit={codeSent ? verifyCode : requestCode} className="mt-2.5 space-y-2.5">
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
                  readOnly={codeSent}
                  placeholder="name@example.com"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="h-8 rounded-lg border-white/10 bg-white/[0.055] pl-8 text-xs text-white placeholder:text-white/24 hover:bg-white/[0.075] focus-visible:bg-white/[0.085] focus-visible:ring-1 focus-visible:ring-emerald-300/25"
                />
              </div>
            </div>

            {codeSent ? (
              <div className="space-y-1">
                <Label htmlFor="otp" className="text-[8.5px] font-bold uppercase tracking-[0.18em] text-white/38">
                  One-time code
                </Label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-3 w-3 -translate-y-1/2 text-white/32" />
                  <Input
                    id="otp"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    required
                    maxLength={8}
                    placeholder="Enter code"
                    value={form.otp}
                    onChange={(event) => setForm((current) => ({ ...current, otp: event.target.value }))}
                    className="h-8 rounded-lg border-white/10 bg-white/[0.055] pl-8 text-xs text-white placeholder:text-white/24 hover:bg-white/[0.075] focus-visible:bg-white/[0.085] focus-visible:ring-1 focus-visible:ring-emerald-300/25"
                  />
                </div>
                <p className="text-[9px] leading-relaxed text-white/32">
                  Check your email for the Neon sign-in code.
                </p>
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={pending}
              className="h-8 w-full rounded-lg border border-white/10 bg-white/[0.07] text-xs font-semibold text-white shadow-none hover:bg-white/[0.1]"
            >
              {pending ? (
                codeSent ? "Verifying..." : "Sending code..."
              ) : (
                <>
                  <span>{codeSent ? "Verify code" : "Send code"}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </>
              )}
            </Button>

            {codeSent ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setCodeSent(false);
                  setForm((current) => ({ ...current, otp: "" }));
                  setError("");
                }}
                className="h-7 w-full rounded-lg text-[10px] text-white/38 hover:bg-white/[0.06] hover:text-white"
              >
                Use another email
              </Button>
            ) : null}
          </form>
        </Card>

        <p className="mt-2.5 text-center text-[9px] font-medium text-white/28">
          Passwordless access only.
        </p>
      </div>
    </main>
  );
}
