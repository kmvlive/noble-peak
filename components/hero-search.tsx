"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SearchSuggestions } from "@/components/search-suggestions";

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/search?q=${encodeURIComponent(q)}`);
    } else {
      router.push("/search");
    }
  };

  const handleSelect = (value: string) => {
    setQuery(value);
    setShowSuggestions(false);
    router.push(`/search?q=${encodeURIComponent(value)}&direct=1`);
  };

  const handleClose = () => {
    setShowSuggestions(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setShowSuggestions(true);
  };

  const handleFocus = () => {
    if (query.trim().length >= 2) {
      setShowSuggestions(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        className="pl-9 pr-12"
        placeholder="Поиск активностей по названию, городу или разделу..."
        value={query}
        onChange={handleChange}
        onFocus={handleFocus}
      />
      {query && (
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
      <SearchSuggestions
        query={query}
        onSelect={handleSelect}
        onClose={handleClose}
        visible={showSuggestions}
      />
    </form>
  );
}
