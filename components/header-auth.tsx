"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function HeaderAuth() {
  const [partnerToken, setPartnerToken] = useState<string | null>(null);
  const [clientToken, setClientToken] = useState<string | null>(null);

  useEffect(() => {
    const check = () => {
      setPartnerToken(localStorage.getItem("partner_token"));
      setClientToken(localStorage.getItem("client_token"));
    };

    check();

    window.addEventListener("storage", check);
    const interval = setInterval(check, 1000);
    return () => {
      window.removeEventListener("storage", check);
      clearInterval(interval);
    };
  }, []);

  const linkClass =
    "rounded-full border px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-9 flex items-center";

  if (partnerToken) {
    return (
      <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-wrap justify-end max-w-full">
        <Link href="/partner" className={linkClass}>
          Кабинет партнёра
        </Link>
      </div>
    );
  }

  if (clientToken) {
    return (
      <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-wrap justify-end max-w-full">
        <Link href="/client" className={linkClass}>
          Личный кабинет
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-1 sm:gap-2 flex-wrap justify-end max-w-full">
      <Link href="/partner/login" className={linkClass}>
        <span className="sm:hidden">Партнёрам</span>
        <span className="hidden sm:inline">Вход для партнёров</span>
      </Link>
      <Link href="/agent/login" className={linkClass}>
        <span className="sm:hidden">Агентам</span>
        <span className="hidden sm:inline">Вход для агентов</span>
      </Link>
      <Link href="/client/login" className={linkClass}>
        <span className="sm:hidden">Клиентам</span>
        <span className="hidden sm:inline">Вход для клиентов</span>
      </Link>
    </div>
  );
}
