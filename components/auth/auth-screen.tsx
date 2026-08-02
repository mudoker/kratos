"use client";

import { useEffect, useState } from "react";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
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
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem("kratos_pwa_seen_version");

    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.filter((key) => key.startsWith("kratos-v")).map((key) => window.caches.delete(key)));
    }

    if ("serviceWorker" in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
  } catch {
    // PWA cleanup is best-effort; auth navigation should still continue.
  }
};

const dashboardUrl = () => `/dashboard?pwa-auth=${Date.now()}`;

const readServerSession = async () => {
  const response = await fetch(`/api/session?check=${Date.now()}`, {
    cache: "no-store",
    credentials: "include",
    headers: { "Cache-Control": "no-cache" },
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as { user?: { id: string } | null };
  return payload.user ?? null;
};

export function AuthScreen() {
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
        const user = await readServerSession();
        if (!cancelled && user) {
          await resetPwaShell();
          window.location.replace(dashboardUrl());
        }
      } catch {
        // If session probing fails, keep the normal login form available.
      }
    };

    void redirectAuthenticatedPwa();

    const checks = [750, 1500, 3000, 5000].map((delay) =>
      window.setTimeout(() => {
        void redirectAuthenticatedPwa();
      }, delay)
    );

    return () => {
      cancelled = true;
      checks.forEach((check) => window.clearTimeout(check));
    };
  }, []);

  const signInWithGoogle = async () => {
    setPending(true);
    setError("");

    try {
      await resetPwaShell();
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: dashboardUrl(),
        errorCallbackURL: "/login",
        requestSignUp: true,
        disableRedirect: true,
      });

      if (result.error) {
        setError(result.error.message || "Could not start Google sign-in.");
        setPending(false);
        return;
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
        return;
      }

      setError("Google sign-in did not return a redirect URL.");
      setPending(false);
    } catch {
      setError("Could not start Google sign-in.");
      setPending(false);
    }
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
              Continue with your Google account.
            </CardDescription>
          </div>

          {error ? (
            <div className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 px-3 py-2 text-xs font-semibold text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-3.5">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={signInWithGoogle}
              className="h-8 w-full rounded-lg border border-white/10 !bg-white text-xs font-semibold !text-neutral-950 shadow-[0_14px_34px_rgba(0,0,0,0.2)] hover:!bg-neutral-100 [&>span]:!text-neutral-950"
            >
              <GoogleIcon />
              <span>{pending ? "Opening Google..." : "Continue with Google"}</span>
            </Button>
          </div>
        </Card>

        <p className="mt-2.5 text-center text-[9px] font-medium text-white/28">
          Google access only.
        </p>
      </div>
    </main>
  );
}
