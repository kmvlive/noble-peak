"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { RUSSIAN_CITIES } from "@/lib/russian-cities";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "selected_city";
const DEFAULT_CITY = "Севастополь";

export function HeaderCity() {
  const [city, setCity] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_CITY;
    return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_CITY;
  });
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

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

  const selectCity = (name: string) => {
    setCity(name);
    localStorage.setItem(STORAGE_KEY, name);
    setOpen(false);
  };

  const buttonClass =
    "flex items-center gap-1 rounded-full border px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground min-h-9";

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
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
        <ul
          role="listbox"
          aria-label="Выбор города"
          className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] origin-top-right max-h-72 overflow-auto rounded-lg border bg-popover p-1 text-sm shadow-lg animate-in fade-in slide-in-from-top-2 duration-200"
        >
          {RUSSIAN_CITIES.map((name, index) => (
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
                index === highlightedIndex && "bg-accent text-accent-foreground"
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
          ))}
        </ul>
      )}
    </div>
  );
}
