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
const SEEN_VERSION_KEY = "kratos_pwa_seen_version";

const clearKratosCaches = async () => {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const keys = await window.caches.keys();
  await Promise.all(keys.filter((key) => key.startsWith("kratos-v")).map((key) => window.caches.delete(key)));
};

const reloadWithUpdateToken = () => {
  const url = new URL(window.location.href);
  url.searchParams.set("pwa-update", String(Date.now()));
  window.location.replace(url.toString());
};

const forceServiceWorkerRefresh = async () => {
  await clearKratosCaches();

  if ("serviceWorker" in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((registration) => registration.unregister()));
  }

  reloadWithUpdateToken();
};

const isStandalonePwa = () => {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone);
};

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

const readWorkerVersion = async (worker: ServiceWorker | null) =>
  new Promise<string | null>((resolve) => {
    if (!worker) {
      resolve(null);
      return;
    }

    const channel = new MessageChannel();
    const timeout = window.setTimeout(() => resolve(null), 800);
    channel.port1.onmessage = (event) => {
      window.clearTimeout(timeout);
      resolve(event.data?.type === "SW_VERSION" ? event.data.version : null);
    };
    worker.postMessage({ type: "GET_VERSION" }, [channel.port2]);
  });

export function PwaRegister() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [version, setVersion] = useState(VERSION_FALLBACK);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const dismissedVersionRef = useRef<string | null>(null);
  const isApplyingRef = useRef(false);
  const versionRef = useRef(version);
  const fallbackReloadRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const showUpdate = useCallback(async (sw: ServiceWorker | null, nextVersion?: string) => {
    if (isApplyingRef.current) return;
    const [detectedVersion, controllerVersion] = await Promise.all([
      nextVersion || readServiceWorkerVersion(),
      readWorkerVersion(navigator.serviceWorker?.controller ?? null),
    ]);
    const seenVersion = localStorage.getItem(SEEN_VERSION_KEY);

    if (detectedVersion === VERSION_FALLBACK) return;
    if (controllerVersion === detectedVersion) {
      localStorage.setItem(SEEN_VERSION_KEY, detectedVersion);
      return;
    }
    if (seenVersion === detectedVersion) return;
    if (dismissedVersionRef.current === detectedVersion) return;

    setWaitingSW(sw);
    setVersion(detectedVersion);
    setShowUpdateModal(true);
  }, []);

  const applyUpdate = useCallback(async () => {
    if (isApplyingRef.current) return;
    isApplyingRef.current = true;
    setIsApplying(true);
    localStorage.setItem(SEEN_VERSION_KEY, version);

    try {
      const registration = await navigator.serviceWorker.getRegistration("/sw.js");
      const sw = waitingSW || registration?.waiting;

      if (sw) {
        fallbackReloadRef.current = setTimeout(() => {
          void forceServiceWorkerRefresh();
        }, 2500);
        sw.postMessage({ type: "SKIP_WAITING" });
        return;
      }

      await forceServiceWorkerRefresh();
    } catch {
      reloadWithUpdateToken();
    }
  }, [version, waitingSW]);

  const dismissUpdate = useCallback(() => {
    dismissedVersionRef.current = version;
    setShowUpdateModal(false);
  }, [version]);

  useEffect(() => {
    return () => {
      if (fallbackReloadRef.current) {
        clearTimeout(fallbackReloadRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isApplying) return;

    const controller = navigator.serviceWorker?.controller;
    if (!controller) {
      void forceServiceWorkerRefresh();
      return;
    }
  }, [isApplying]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || navigator.webdriver) return;

    let interval: ReturnType<typeof setInterval> | undefined;
    let resumeTimeout: ReturnType<typeof setTimeout> | undefined;
    let registration: ServiceWorkerRegistration | null = null;
    let reloading = false;

    const checkVersionMismatch = async () => {
      const latestVersion = await readServiceWorkerVersion();
      if (latestVersion === VERSION_FALLBACK) return;

      const controllerVersion = await readWorkerVersion(navigator.serviceWorker.controller);
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
          if (navigator.serviceWorker.controller) {
            void showUpdate(reg.waiting || sw);
          }
        }
      });
    };

    const showWaitingWorker = async () => {
      if (registration?.waiting) {
        await showUpdate(registration.waiting);
        return true;
      }
      return false;
    };

    const pollForUpdate = async () => {
      try {
        const reg = registration;
        if (reg) {
          await reg.update();
        }
        if (await showWaitingWorker()) {
          return;
        }
        await checkVersionMismatch();
      } catch {
        // Offline launches can fail update checks.
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void pollForUpdate();
    };

    const onPageShow = () => {
      void pollForUpdate();
    };

    const onStandaloneResume = () => {
      if (!isStandalonePwa()) return;
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => void pollForUpdate(), 250);
    };

    const onServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === "SW_UPDATE_READY") {
        void showUpdate(registration?.waiting || null, event.data.version);
      }
    };

    const onControllerChange = () => {
      if (!reloading) {
        reloading = true;
        if (fallbackReloadRef.current) {
          clearTimeout(fallbackReloadRef.current);
        }
        localStorage.setItem(SEEN_VERSION_KEY, versionRef.current);
        reloadWithUpdateToken();
      }
    };

    navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).then(async (reg) => {
      registration = reg;

      await showWaitingWorker();

      reg.addEventListener("updatefound", () => watchInstalling(reg));
      await pollForUpdate();

      interval = setInterval(pollForUpdate, 30_000);
      window.addEventListener("focus", pollForUpdate);
      window.addEventListener("online", pollForUpdate);
      window.addEventListener("pageshow", onPageShow);
      window.addEventListener("touchstart", onStandaloneResume, { passive: true });
      document.addEventListener("visibilitychange", onVisible);
    }).catch((err) => console.error("PWA: SW registration failed:", err));

    navigator.serviceWorker.addEventListener("message", onServiceWorkerMessage);
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    return () => {
      if (interval) clearInterval(interval);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      window.removeEventListener("focus", pollForUpdate);
      window.removeEventListener("online", pollForUpdate);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("touchstart", onStandaloneResume);
      document.removeEventListener("visibilitychange", onVisible);
      navigator.serviceWorker.removeEventListener("message", onServiceWorkerMessage);
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
