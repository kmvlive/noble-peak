"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { RUSSIAN_CITIES } from "@/lib/russian-cities";

const STORAGE_KEY = "selected_city";
const DEFAULT_CITY = "Севастополь";

export function HeaderSectionSwitch() {
  const pathname = usePathname();
  const isRent = pathname.startsWith("/rent");
  const [city] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CITY;
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && RUSSIAN_CITIES.includes(stored) ? stored : DEFAULT_CITY;
  });
  const [hasActiveListings, setHasActiveListings] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    fetch(`/api/listings?status=active&city=${encodeURIComponent(city)}`)
      .then((res) => (res.ok ? res.json() : []))
      .then((listings: unknown[]) => {
        if (!cancelled) {
          setHasActiveListings(listings.length > 0);
          setChecked(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasActiveListings(false);
          setChecked(true);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [city]);

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
      {checked && hasActiveListings && (
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
      )}
    </nav>
  );
}
