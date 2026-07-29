"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const VERSION_FALLBACK = "latest";

const readServiceWorkerVersion = async () => {
  try {
    const response = await fetch(`/sw.js?update-check=${Date.now()}`, {
      cache: "no-store",
      headers: { "Cache-Control": "no-cache" },
    });
    const source = await response.text();
    return (
      source.match(/SW_VERSION\s*=\s*["']([^"']+)["']/)?.[1] ||
      source.match(/kratos-v([0-9]+\.[0-9]+\.[0-9]+)/)?.[1] ||
      VERSION_FALLBACK
    );
  } catch {
    return VERSION_FALLBACK;
  }
};

export function PwaRegister() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [version, setVersion] = useState(VERSION_FALLBACK);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const dismissedVersionRef = useRef<string | null>(null);
  const isApplyingRef = useRef(false);

  const showUpdate = useCallback(async (sw: ServiceWorker) => {
    if (isApplyingRef.current) return;
    const nextVersion = await readServiceWorkerVersion();
    if (dismissedVersionRef.current === nextVersion) return;

    setWaitingSW(sw);
    setVersion(nextVersion);
    setShowUpdateModal(true);
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingSW) return;
    isApplyingRef.current = true;
    setIsApplying(true);
    waitingSW.postMessage({ type: "SKIP_WAITING" });
  }, [waitingSW]);

  const dismissUpdate = useCallback(() => {
    dismissedVersionRef.current = version;
    setShowUpdateModal(false);
  }, [version]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    let registration: ServiceWorkerRegistration | null = null;

    const watchInstalling = (reg: ServiceWorkerRegistration) => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        if (sw.state === "installed") {
          void showUpdate(sw);
        }
      });
    };

    const pollForUpdate = async () => {
      if (!registration) return;
      try {
        await registration.update();
        if (registration.waiting) {
          await showUpdate(registration.waiting);
        }
      } catch {
        // Offline launches can fail update checks.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void pollForUpdate();
    };

    const onControllerChange = () => {
      if (!reloading) {
        reloading = true;
        window.location.reload();
      }
    };

    let reloading = false;

    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      registration = reg;

      if (reg.waiting) {
        await showUpdate(reg.waiting);
      }

      reg.addEventListener("updatefound", () => watchInstalling(reg));
      await pollForUpdate();

      interval = setInterval(pollForUpdate, 30_000);
      window.addEventListener("focus", pollForUpdate);
      window.addEventListener("online", pollForUpdate);
      document.addEventListener("visibilitychange", onVisible);
    }).catch((err) => console.error("PWA: SW registration failed:", err));

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      if (interval) clearInterval(interval);
      window.removeEventListener("focus", pollForUpdate);
      window.removeEventListener("online", pollForUpdate);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [showUpdate]);

  return (
    <Dialog
      open={showUpdateModal}
      onOpenChange={(open) => {
        if (open) {
          setShowUpdateModal(true);
        } else {
          dismissUpdate();
        }
      }}
    >
      <DialogContent className="w-[min(92vw,420px)] rounded-3xl border border-black/10 bg-white p-5 shadow-[0_24px_80px_rgba(0,0,0,0.18)] sm:p-6">
        <DialogHeader className="space-y-3 pr-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-black text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1.5">
            <DialogTitle className="text-xl font-bold tracking-tight text-black">
              New update available
            </DialogTitle>
            <DialogDescription className="text-xs leading-relaxed text-black/55">
              Kratos version {version} is ready. Confirm to refresh the PWA and load the latest code.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="rounded-2xl border border-black/5 bg-neutral-50 p-3 text-[11px] font-semibold leading-relaxed text-black/55">
          Your workout data stays saved. The app will reload once the update is activated.
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <Button
            type="button"
            onClick={applyUpdate}
            disabled={isApplying}
            className="h-11 rounded-xl bg-black text-xs font-bold text-white hover:bg-black/90"
          >
            {isApplying ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isApplying ? "Updating..." : "Update now"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={dismissUpdate}
            className="h-11 rounded-xl text-xs font-semibold"
          >
            Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
