"use client";

import { useEffect, useState } from "react";
import { Home, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { RUSSIAN_CITIES } from "@/lib/russian-cities";

const STORAGE_KEY = "selected_city";
const DEFAULT_CITY = "Севастополь";

export function RentCatalog() {
  const [city, setCity] = useState<string>(DEFAULT_CITY);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && RUSSIAN_CITIES.includes(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCity(stored);
    }
  }, []);

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
            {city}
          </div>
        </div>
      </section>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Home className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">
              В городе {city} пока нет активных объявлений
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              Предложения по аренде жилья появятся здесь совсем скоро. Выберите
              другой город или загляните позже.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
