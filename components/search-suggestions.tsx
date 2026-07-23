"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Tag, Hash, Loader2 } from "lucide-react";

interface Suggestion {
  type: "activity" | "city" | "section";
  label: string;
  value: string;
}

interface SearchSuggestionsProps {
  query: string;
  onSelect: (value: string) => void;
  onClose: () => void;
  visible: boolean;
}

export function SearchSuggestions({
  query,
  onSelect,
  onClose,
  visible,
}: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (!q.trim() || q.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const url = new URL("/api/activities/search", window.location.origin);
      url.searchParams.set("q", q.trim());
      const res = await fetch(url.toString(), { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();

      const result: Suggestion[] = [];
      const seen = new Set<string>();
      const queryLower = q.toLowerCase();

      for (const activity of data.activities ?? []) {
        const title = activity.title as string;
        if (title.toLowerCase().includes(queryLower) && !seen.has(title)) {
          seen.add(title);
          result.push({ type: "activity", label: title, value: title });
        }
      }

      const citySet = new Set<string>();
      for (const activity of data.activities ?? []) {
        const location = (activity.location as string) || "";
        let city = location.replace(/^г\.\s*/iu, "").trim();
        if (!city) continue;
        if (citySet.has(city)) continue;
        citySet.add(city);
        if (city.toLowerCase().includes(queryLower) && !seen.has(city)) {
          seen.add(city);
          result.push({ type: "city", label: city, value: city });
        }
      }

      for (const [, name] of Object.entries(
        (data.sectionNameMap as Record<string, string>) ?? {}
      )) {
        if (
          (name as string).toLowerCase().includes(queryLower) &&
          !seen.has(name as string)
        ) {
          seen.add(name as string);
          result.push({
            type: "section",
            label: name as string,
            value: name as string,
          });
        }
      }

      setSuggestions(result.slice(0, 8));
    } catch {
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setSelectedIndex(-1);
    if (!query.trim() || query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(() => fetchSuggestions(query), 300);
    return () => clearTimeout(timer);
  }, [query, fetchSuggestions]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (suggestions.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev + 1;
          return next >= suggestions.length ? 0 : next;
        });
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => {
          const next = prev - 1;
          return next < 0 ? suggestions.length - 1 : next;
        });
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        onSelect(suggestions[selectedIndex].value);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [suggestions, selectedIndex, onSelect]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  if (!visible || (suggestions.length === 0 && !loading)) return null;

  const iconMap = {
    activity: Tag,
    city: MapPin,
    section: Hash,
  };

  const labelMap: Record<string, string> = {
    activity: "Активность",
    city: "Город",
    section: "Раздел",
  };

  return (
    <div
      ref={containerRef}
      className="absolute left-0 right-0 top-full z-50 mt-1"
    >
      <div className="rounded-lg border bg-popover text-popover-foreground shadow-md">
        {loading && suggestions.length === 0 && (
          <div className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Поиск подсказок...
          </div>
        )}
        {suggestions.map((suggestion, i) => {
          const Icon = iconMap[suggestion.type];
          return (
            <button
              key={`${suggestion.type}-${suggestion.value}`}
              type="button"
              className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm transition-colors first:rounded-t-lg last:rounded-b-lg hover:bg-accent hover:text-accent-foreground sm:py-2 ${
                i === selectedIndex ? "bg-accent text-accent-foreground" : ""
              }`}
              onClick={() => onSelect(suggestion.value)}
              onMouseEnter={() => setSelectedIndex(i)}
            >
              <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <div className="flex flex-col">
                <span>{suggestion.label}</span>
                <span className="text-xs text-muted-foreground">
                  {labelMap[suggestion.type]}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
