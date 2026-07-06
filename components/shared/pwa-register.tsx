"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

export function PwaRegister() {
  const [waitingSW, setWaitingSW] = useState<ServiceWorker | null>(null);
  const [show, setShow] = useState(false);

  const showBanner = useCallback((sw: ServiceWorker) => {
    setWaitingSW(sw);
    setShow(true);
  }, []);

  const applyUpdate = useCallback(() => {
    if (!waitingSW) return;
    waitingSW.postMessage({ type: "SKIP_WAITING" });
    // Page reloads automatically via controllerchange listener below
  }, [waitingSW]);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const watchInstalling = (reg: ServiceWorkerRegistration) => {
      const sw = reg.installing;
      if (!sw) return;
      sw.addEventListener("statechange", () => {
        // Show banner as soon as the new SW is installed and waiting
        // Note: intentionally NOT checking navigator.serviceWorker.controller
        // because homescreen PWA cold-launches have controller=null initially
        if (sw.state === "installed") {
          showBanner(sw);
        }
      });
    };

    navigator.serviceWorker.register("/sw.js").then(async (reg) => {
      // Case 1: SW already waiting on load (tab was in background / homescreen relaunch)
      if (reg.waiting) {
        showBanner(reg.waiting);
        return;
      }

      // Case 2: Listen for a new SW installing
      reg.addEventListener("updatefound", () => watchInstalling(reg));

      // Case 3: Force update check right now — critical for homescreen PWAs
      // which bypass the browser's 24-hour update throttle
      try {
        await reg.update();
        if (reg.waiting) showBanner(reg.waiting);
      } catch (_) {}

      // Case 4: Poll every 30s and on app foreground
      const poll = async () => {
        try {
          await reg.update();
          if (reg.waiting) showBanner(reg.waiting);
        } catch (_) {}
      };

      const interval = setInterval(poll, 30_000);
      const onVisible = () => { if (document.visibilityState === "visible") poll(); };
      document.addEventListener("visibilitychange", onVisible);

      return () => {
        clearInterval(interval);
        document.removeEventListener("visibilitychange", onVisible);
      };
    }).catch((err) => console.error("PWA: SW registration failed:", err));

    // When the new SW takes control → reload to load fresh assets
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!reloading) { reloading = true; window.location.reload(); }
    });
  }, [showBanner]);

  if (!show) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "96px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 9999,
      display: "flex",
      alignItems: "center",
      gap: "10px",
      background: "#1d1d1f",
      color: "#fff",
      padding: "10px 16px 10px 14px",
      borderRadius: "16px",
      boxShadow: "0 8px 40px rgba(0,0,0,0.35)",
      fontSize: "12px",
      fontWeight: 600,
      whiteSpace: "nowrap",
      maxWidth: "calc(100vw - 40px)",
      animation: "swBannerIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
    }}>
      <style>{`
        @keyframes swBannerIn {
          from { opacity:0; transform:translateX(-50%) translateY(14px) scale(0.95); }
          to   { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>

      <RefreshCw size={13} style={{ flexShrink: 0, opacity: 0.65, animation: "spin 2s linear infinite" }} />
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>

      <span style={{ opacity: 0.75, fontSize: "11px" }}>New version available</span>

      <button
        onClick={applyUpdate}
        style={{
          background: "#fff", color: "#1d1d1f",
          border: "none", borderRadius: "10px",
          padding: "5px 14px", fontSize: "11px",
          fontWeight: 700, cursor: "pointer", flexShrink: 0,
        }}
      >
        Update
      </button>

      <button
        onClick={() => setShow(false)}
        style={{
          background: "transparent", border: "none",
          color: "rgba(255,255,255,0.35)", fontSize: "18px",
          lineHeight: 1, cursor: "pointer", padding: "0 2px", flexShrink: 0,
        }}
        aria-label="Dismiss"
      >×</button>
    </div>
  );
}
