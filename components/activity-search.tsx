"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ActivityCard } from "@/components/activity-card";
import type { ActivityRecord } from "@/lib/models";

interface ActivitySearchProps {
  activities: ActivityRecord[];
  sectionNameMap: Record<string, string>;
}

export function ActivitySearch({
  activities,
  sectionNameMap,
}: ActivitySearchProps) {
  const [query, setQuery] = useState("");

  const trimmed = query.trim();
  const filtered =
    trimmed === ""
      ? []
      : activities.filter((a) => {
          const q = trimmed.toLowerCase();
          const sectionName = sectionNameMap[a.section] || a.section;
          return (
            a.title.toLowerCase().includes(q) ||
            (a.location || "").toLowerCase().includes(q) ||
            sectionName.toLowerCase().includes(q)
          );
        });

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9 pr-9"
          placeholder="Поиск активностей по названию, городу или разделу..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            onClick={() => setQuery("")}
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {trimmed !== "" && (
        <div>
          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Ничего не найдено
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <ActivityCard
                  key={a.id}
                  _id={a.id}
                  title={a.title}
                  shortDescription={a.shortDescription}
                  category={sectionNameMap[a.section] || a.section}
                  price={a.price}
                  imageGradient={a.imageGradient}
                  likes={a.likes}
                  images={a.images}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
