"use client";

import { useEffect } from "react";

export function PwaRegister() {
  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      window.location.hostname !== "localhost" &&
      !window.location.hostname.includes("127.0.0.1")
    ) {
      // In production/non-localhost, register the service worker
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("PWA: ServiceWorker registered successfully with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("PWA: ServiceWorker registration failed:", error);
        });
    } else if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      // Allow service worker registration in localhost if needed for testing, uncomment if necessary:
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("PWA (Local): ServiceWorker registered with scope:", registration.scope);
        })
        .catch((error) => {
          console.error("PWA (Local): ServiceWorker registration failed:", error);
        });
    }
  }, []);

  return null;
}
