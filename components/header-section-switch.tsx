"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function HeaderSectionSwitch() {
  const pathname = usePathname();
  const isRent = pathname.startsWith("/rent");

  const itemClass =
    "flex items-center justify-center rounded-full px-3 py-1 text-[11px] sm:text-xs font-medium transition-colors min-h-7";

  return (
    <nav
      aria-label="Разделы сайта"
      className="mx-1 flex shrink-0 items-center gap-0.5 rounded-full border bg-muted/50 p-0.5 sm:mx-2"
    >
      <Link
        href="/"
        aria-current={!isRent ? "page" : undefined}
        className={cn(
          itemClass,
          !isRent
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Активности
      </Link>
      <Link
        href="/rent"
        aria-current={isRent ? "page" : undefined}
        className={cn(
          itemClass,
          isRent
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
      >
        Жильё
      </Link>
    </nav>
  );
}
