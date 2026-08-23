"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, MapPin, Search } from "lucide-react";
import { RUSSIAN_CITIES, cityToSlug } from "@/lib/russian-cities";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

const STORAGE_KEY = "selected_city";
const DEFAULT_CITY = "Севастополь";

export function HeaderCity() {
  const router = useRouter();
  const [city, setCity] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CITY;
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CITY;
  });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (open) {
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  const handleToggle = () => {
    if (!open) {
      setQuery("");
      setHighlightedIndex(-1);
    }
    setOpen((o) => !o);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return RUSSIAN_CITIES;
    return RUSSIAN_CITIES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const selectCity = (name: string) => {
    setCity(name);
    localStorage.setItem(STORAGE_KEY, name);
    setOpen(false);
    window.dispatchEvent(new CustomEvent("city:changed", { detail: name }));
    router.push(`/locations/${cityToSlug(name)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (filtered.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < filtered.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev > 0 ? prev - 1 : filtered.length - 1
      );
    } else if (e.key === "Enter" && highlightedIndex >= 0) {
      e.preventDefault();
      selectCity(filtered[highlightedIndex]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const buttonClass =
    "flex items-center gap-1 rounded-full border px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-9";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={buttonClass}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="max-w-[100px] truncate sm:max-w-[140px]">{city}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Выбор города"
          className="absolute left-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1rem)] origin-top-left sm:left-auto sm:right-0 sm:origin-top-right overflow-hidden rounded-lg border bg-popover text-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="relative border-b p-2">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setHighlightedIndex(-1);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Поиск города"
              className="h-9 pl-9"
              autoComplete="off"
            />
          </div>
          <ul className="max-h-64 overflow-auto p-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-sm text-muted-foreground">
                Город не найден
              </li>
            ) : (
              filtered.map((name, index) => (
                <li
                  key={name}
                  role="option"
                  aria-selected={name === city}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectCity(name);
                  }}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-2 outline-none transition-colors",
                    index === highlightedIndex &&
                      "bg-accent text-accent-foreground"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      name === city ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {name}
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
