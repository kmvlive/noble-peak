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
    return () => window.removeEventListener("storage", check);
  }, []);

  const linkClass =
    "shrink-0 rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";

  if (partnerToken) {
    return (
      <div className="ml-auto flex items-center gap-2">
        <Link href="/partner" className={linkClass}>
          Кабинет партнёра
        </Link>
      </div>
    );
  }

  if (clientToken) {
    return (
      <div className="ml-auto flex items-center gap-2">
        <Link href="/client" className={linkClass}>
          Личный кабинет
        </Link>
      </div>
    );
  }

  return (
    <div className="ml-auto flex items-center gap-2">
      <Link href="/partner/login" className={linkClass}>
        Вход для партнёров
      </Link>
      <Link href="/client/login" className={linkClass}>
        Вход для клиентов
      </Link>
    </div>
  );
}
