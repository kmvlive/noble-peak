"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Home,
  MapPin,
  SlidersHorizontal,
  Bot,
  Search,
  RotateCcw,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ListingCard } from "@/components/listing-card";
import { HousingAiAssistant } from "@/components/housing-ai-assistant";
import { RUSSIAN_CITIES } from "@/lib/russian-cities";
import { HOUSING_TYPES } from "@noble-peak/shared";
import type { ListingRecord } from "@noble-peak/shared";

const STORAGE_KEY = "selected_city";
const DEFAULT_CITY = "Севастополь";
const CITY_CHANGED_EVENT = "city:changed";

function readStoredCity(): string {
  if (typeof window === "undefined") return DEFAULT_CITY;
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && RUSSIAN_CITIES.includes(stored) ? stored : DEFAULT_CITY;
}

export function RentCatalog({
  initialListings,
}: {
  initialListings: ListingRecord[];
}) {
  const [city, setCity] = useState<string>(readStoredCity);
  const [housingType, setHousingType] = useState<string>("all");
  const [guests, setGuests] = useState<string>("0");
  const [checkIn, setCheckIn] = useState<string>("");
  const [checkOut, setCheckOut] = useState<string>("");
  const [priceMin, setPriceMin] = useState<string>("");
  const [priceMax, setPriceMax] = useState<string>("");

  useEffect(() => {
    function handleCityChanged(e: Event) {
      const next = (e as CustomEvent<string>).detail ?? readStoredCity();
      if (RUSSIAN_CITIES.includes(next)) setCity(next);
    }
    window.addEventListener(CITY_CHANGED_EVENT, handleCityChanged);
    return () =>
      window.removeEventListener(CITY_CHANGED_EVENT, handleCityChanged);
  }, []);

  const filtered = useMemo(() => {
    const minPrice = priceMin ? Number(priceMin) : undefined;
    const maxPrice = priceMax ? Number(priceMax) : undefined;
    const guestsNum = guests ? Number(guests) : 0;

    return initialListings.filter((l) => {
      if (housingType !== "all" && l.housingType !== housingType) return false;
      if (city !== "all" && l.city !== city) return false;
      if (guestsNum > 0 && l.guests < guestsNum) return false;
      if (minPrice !== undefined && l.price < minPrice) return false;
      if (maxPrice !== undefined && l.price > maxPrice) return false;
      return true;
    });
  }, [initialListings, housingType, city, guests, priceMin, priceMax]);

  const hasFilters =
    housingType !== "all" ||
    guests !== "0" ||
    Boolean(checkIn) ||
    Boolean(checkOut) ||
    Boolean(priceMin) ||
    Boolean(priceMax);

  const resetFilters = () => {
    setHousingType("all");
    setGuests("0");
    setCheckIn("");
    setCheckOut("");
    setPriceMin("");
    setPriceMax("");
  };

  return (
    <div className="min-h-[calc(100vh-9rem)]">
      <section className="gradient-hero-vibrant border-b">
        <div className="container mx-auto max-w-5xl px-4 py-10 sm:py-14">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 shadow-sm">
            <Home className="h-6 w-6 text-primary" />
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Снять что угодно
          </h1>
          <p className="mt-2 max-w-xl text-muted-foreground">
            Аренда жилья: номера и спальные места, квартиры, дома, коттеджи и
            отдельные комнаты.
          </p>
          <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border bg-background/80 px-3 py-1.5 text-sm font-medium">
            <MapPin className="h-4 w-4 text-primary" />
            {city === "all" ? "Все города" : city}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="mb-4 flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Фильтры</h2>
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-auto gap-1 text-xs"
                  onClick={resetFilters}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Сбросить
                </Button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label>Тип жилья</Label>
                <Select
                  value={housingType}
                  onValueChange={(v) => setHousingType(v ?? "all")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    {HOUSING_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Город</Label>
                <Select value={city} onValueChange={(v) => setCity(v ?? "all")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все города</SelectItem>
                    {RUSSIAN_CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Число гостей</Label>
                <Select
                  value={guests}
                  onValueChange={(v) => setGuests(v ?? "0")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Любое число</SelectItem>
                    {[1, 2, 3, 4, 5, 6, 8, 10].map((g) => (
                      <SelectItem key={g} value={String(g)}>
                        {g} {g === 1 ? "гость" : g >= 5 ? "гостей" : "гостя"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Заезд</Label>
                <Input
                  type="date"
                  value={checkIn}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCheckIn(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Выезд</Label>
                <Input
                  type="date"
                  value={checkOut}
                  min={checkIn || new Date().toISOString().split("T")[0]}
                  onChange={(e) => setCheckOut(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>Цена за ночь, ₽</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="от"
                    min={0}
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                  />
                  <span className="text-muted-foreground">—</span>
                  <Input
                    type="number"
                    placeholder="до"
                    min={0}
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-8 flex flex-wrap items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <Search className="h-4 w-4 text-primary" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Объявления</h2>
          <span className="text-sm text-muted-foreground">
            Найдено: {filtered.length}
          </span>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">
                По заданным фильтрам ничего не найдено
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Попробуйте изменить параметры поиска или сбросить фильтры.
              </p>
              <Button variant="outline" size="sm" onClick={resetFilters}>
                <RotateCcw className="mr-1 h-4 w-4" />
                Сбросить фильтры
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

        <div className="mt-12">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-xl font-semibold tracking-tight">
              ИИ-ассистент по подбору жилья
            </h2>
          </div>
          <p className="mb-4 text-sm text-muted-foreground">
            Ответьте на несколько вопросов, и ассистент поможет уточнить запрос
            и предложит подходящие объявления.
          </p>
          <HousingAiAssistant
            listings={initialListings}
            initialCity={city === "all" ? undefined : city}
          />
        </div>
      </div>
    </div>
  );
}
