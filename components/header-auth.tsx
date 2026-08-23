"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDownIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
    <div className="ml-auto flex items-center justify-end max-w-full">
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" />}
          className="rounded-full gap-1 px-3 text-xs"
        >
          Вход
          <ChevronDownIcon className="size-4 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem render={<Link href="/partner/login" />}>
            Вход для партнёров
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/client/login" />}>
            Вход для клиентов
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
