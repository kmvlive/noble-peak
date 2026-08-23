"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronDownIcon, HandshakeIcon, UserRoundIcon } from "lucide-react";

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
    "rounded-full border px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-9 flex items-center whitespace-nowrap";

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
          className="rounded-full gap-1 px-2.5 sm:px-3 text-xs whitespace-nowrap"
        >
          Вход
          <ChevronDownIcon className="size-4 text-muted-foreground shrink-0" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" sideOffset={8} className="w-60 p-1.5">
          <DropdownMenuItem
            render={<Link href="/partner/login" />}
            className="justify-center gap-2 px-3 py-2 text-center"
          >
            <HandshakeIcon className="size-4 text-muted-foreground" />
            Вход для партнёров
          </DropdownMenuItem>
          <DropdownMenuItem
            render={<Link href="/client/login" />}
            className="justify-center gap-2 px-3 py-2 text-center"
          >
            <UserRoundIcon className="size-4 text-muted-foreground" />
            Вход для клиентов
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
