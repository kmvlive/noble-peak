"use client";

import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

const DISMISS_DAYS = 30;
const INSTALL_DISMISSED_KEY = "pwa-install-dismissed";
const IOS_HINT_DISMISSED_KEY = "ios-pwa-hint-dismissed";

function isExpired(key: string): boolean {
  const stored = localStorage.getItem(key);
  if (!stored) return true;
  const storedDate = new Date(stored + "T00:00:00Z");
  const today = new Date().toISOString().split("T")[0];
  const todayDate = new Date(today + "T00:00:00Z");
  const diffMs = todayDate.getTime() - storedDate.getTime();
  return diffMs >= DISMISS_DAYS * 24 * 60 * 60 * 1000;
}

function dismissForDays(key: string) {
  localStorage.setItem(key, new Date().toISOString().split("T")[0]);
}

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
      if (isExpired(IOS_HINT_DISMISSED_KEY)) {
        setTimeout(() => setShowIosHint(true), 0);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      if (!isExpired(INSTALL_DISMISSED_KEY)) return;
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

  const dismissInstall = () => {
    dismissForDays(INSTALL_DISMISSED_KEY);
    setShowInstallButton(false);
  };

  const dismissIosHint = () => {
    dismissForDays(IOS_HINT_DISMISSED_KEY);
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
              onClick={dismissInstall}
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
