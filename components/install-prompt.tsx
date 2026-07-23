"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [showIosHint, setShowIosHint] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js");
    }

    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia(
      "(display-mode: standalone)"
    ).matches;

    if (isIos && !isStandalone) {
      const dismissed = localStorage.getItem("ios-pwa-hint-dismissed");
      if (!dismissed) {
        setTimeout(() => setShowIosHint(true), 0);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === "accepted") {
      setShowInstallButton(false);
    }
    setDeferredPrompt(null);
  };

  const dismissIosHint = () => {
    localStorage.setItem("ios-pwa-hint-dismissed", "true");
    setShowIosHint(false);
  };

  return (
    <>
      {showInstallButton && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border bg-background p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Download className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Установить приложение</p>
                <p className="text-xs text-muted-foreground">
                  Быстрый доступ без браузера
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowInstallButton(false)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <Button size="sm" className="mt-3 w-full" onClick={handleInstall}>
            <Download className="mr-2 h-4 w-4" />
            Установить
          </Button>
        </div>
      )}

      {showIosHint && (
        <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-lg border bg-background p-4 shadow-lg animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">Установите на экран «Домой»</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Нажмите{" "}
                <span className="inline-block rounded border bg-muted px-1 font-mono text-xs">
                  &#x1F893;
                </span>{" "}
                → «На экран «Домой»» для быстрого доступа
              </p>
            </div>
            <button
              onClick={dismissIosHint}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}

declare global {
  interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
  }
}
