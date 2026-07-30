"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
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
const SEEN_VERSION_KEY = "kratos_pwa_seen_version";

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
  const pathname = usePathname();
  const isAuthPath = pathname === "/login" || pathname.startsWith("/api/auth");
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [version, setVersion] = useState(VERSION_FALLBACK);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const dismissedVersionRef = useRef<string | null>(null);
  const isApplyingRef = useRef(false);
  const versionRef = useRef(version);
  const isAuthPathRef = useRef(false);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  useEffect(() => {
    isAuthPathRef.current = isAuthPath;
  }, [isAuthPath]);

  const showUpdate = useCallback(async (sw: ServiceWorker | null, nextVersion?: string) => {
    if (isApplyingRef.current) return;
    if (isAuthPathRef.current) return;
    const detectedVersion = nextVersion || await readServiceWorkerVersion();
    if (dismissedVersionRef.current === detectedVersion) return;

    setWaitingSW(sw);
    setVersion(detectedVersion);
    setShowUpdateModal(true);
  }, []);

  const applyUpdate = useCallback(() => {
    isApplyingRef.current = true;
    setIsApplying(true);
    localStorage.setItem(SEEN_VERSION_KEY, version);

    if (waitingSW) {
      waitingSW.postMessage({ type: "SKIP_WAITING" });
      return;
    }

    window.location.reload();
  }, [version, waitingSW]);

  const dismissUpdate = useCallback(() => {
    dismissedVersionRef.current = version;
    setShowUpdateModal(false);
  }, [version]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || navigator.webdriver) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    let registration: ServiceWorkerRegistration | null = null;
    let reloading = false;

    const readControllerVersion = () =>
      new Promise<string | null>((resolve) => {
        const controller = navigator.serviceWorker.controller;
        if (!controller) {
          resolve(null);
          return;
        }

        const channel = new MessageChannel();
        const timeout = window.setTimeout(() => resolve(null), 800);
        channel.port1.onmessage = (event) => {
          window.clearTimeout(timeout);
          resolve(event.data?.type === "SW_VERSION" ? event.data.version : null);
        };
        controller.postMessage({ type: "GET_VERSION" }, [channel.port2]);
      });

    const checkVersionMismatch = async () => {
      const latestVersion = await readServiceWorkerVersion();
      if (latestVersion === VERSION_FALLBACK) return;

      const controllerVersion = await readControllerVersion();
      const seenVersion = localStorage.getItem(SEEN_VERSION_KEY);
      const activeVersion = controllerVersion || seenVersion;

      if (!activeVersion) {
        localStorage.setItem(SEEN_VERSION_KEY, latestVersion);
        return;
      }

      if (activeVersion !== latestVersion && dismissedVersionRef.current !== latestVersion) {
        await showUpdate(registration?.waiting || null, latestVersion);
      }
    };

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
      try {
        const reg = registration;
        if (reg) {
          await reg.update();
        }
        if (reg?.waiting) {
          await showUpdate(reg.waiting);
        }
        await checkVersionMismatch();
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
        localStorage.setItem(SEEN_VERSION_KEY, versionRef.current);
        window.location.reload();
      }
    };

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
      open={showUpdateModal && !isAuthPath}
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
