"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, Eye, EyeOff, User, Mail, Lock } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

export function AuthScreen() {
  const [mode, setMode] = useState<"login" | "register">("login");
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
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center p-6 select-none">
      <div className="w-full max-w-[390px] flex flex-col items-center">
        
        {/* Header Icon */}
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-black/[0.04] bg-white shadow-sm">
          <Dumbbell className="h-5 w-5 text-black" />
        </div>

        {/* Text Headers */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-black font-[family:var(--font-display)]">
            {mode === "register" ? "Create your account" : "Sign in with your email"}
          </h1>
          <p className="mt-2 text-xs text-neutral-400 font-medium">
            Enter your credentials to access Kratos Workspace.
          </p>
        </div>

        {/* Authentication Card */}
        <div className="w-full bg-white border border-black/[0.04] rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.02)]">
          {/* Apple Segmented Control */}
          <div className="bg-neutral-100 p-0.5 rounded-xl flex">
            <button
              type="button"
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 rounded-[10px] py-1.5 text-[11px] font-bold tracking-wide uppercase transition-all ${
                mode === "login"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 rounded-[10px] py-1.5 text-[11px] font-bold tracking-wide uppercase transition-all ${
                mode === "register"
                  ? "bg-white text-black shadow-sm"
                  : "text-neutral-400 hover:text-neutral-700"
              }`}
            >
              Register
            </button>
          </div>

          {/* Error Message */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -5 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -5 }}
                className="mt-4 p-3 rounded-xl border border-red-100 bg-red-50 text-red-600 text-xs font-semibold text-center"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Input Form */}
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "register" && (
              <div className="space-y-1">
                <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                  <input
                    type="text"
                    required
                    placeholder="Arnold Schwarzenegger"
                    value={form.name}
                    onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                    className="w-full bg-neutral-50/80 border border-neutral-200/60 rounded-xl h-10 pl-9 pr-4 text-xs text-neutral-800 placeholder-neutral-300 focus:outline-none focus:bg-white focus:border-neutral-400 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type="email"
                  required
                  placeholder="name@workspace.com"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="w-full bg-neutral-50/80 border border-neutral-200/60 rounded-xl h-10 pl-9 pr-4 text-xs text-neutral-800 placeholder-neutral-300 focus:outline-none focus:bg-white focus:border-neutral-400 transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-extrabold uppercase tracking-widest text-neutral-400 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  className="w-full bg-neutral-50/80 border border-neutral-200/60 rounded-xl h-10 pl-9 pr-10 text-xs text-neutral-800 placeholder-neutral-300 focus:outline-none focus:bg-white focus:border-neutral-400 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 transition"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={pending}
              className="mt-6 w-full h-10 rounded-xl font-bold uppercase tracking-wider text-[10px] bg-black text-white hover:bg-neutral-900 border-none shadow-none transition"
            >
              {pending ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>{mode === "register" ? "Create Account" : "Access Vault"}</span>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
