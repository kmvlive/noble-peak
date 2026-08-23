"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RUSSIAN_CITIES } from "@/lib/russian-cities";
import {
  getHousingTypeLabel,
  getListingSubtypeLabel,
} from "@noble-peak/shared";
import type { ListingRecord } from "@noble-peak/shared";

const STORAGE_KEY = "selected_city";
const DEFAULT_CITY = "Севастополь";

function firstRealImage(images: string[]): string | undefined {
  return images?.find(
    (src) => src.startsWith("http") || src.startsWith("/uploads/")
  );
}

function ListingCard({ listing }: { listing: ListingRecord }) {
  const image = firstRealImage(listing.images);

  return (
    <Link href={`/listings/${listing.id}`}>
      <Card className="h-full card-hover">
        {image ? (
          <div className="h-44 overflow-hidden rounded-t-lg bg-muted">
            <img
              src={image}
              alt={listing.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex h-44 items-center justify-center rounded-t-lg bg-gradient-to-br from-indigo-500 to-blue-600">
            <Home className="h-10 w-10 text-white/80" />
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary">
              <MapPin className="mr-0.5 h-3 w-3" />
              {listing.city}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {getListingSubtypeLabel(listing.housingType, listing.subtype)}
            </span>
          </div>
          <CardTitle className="mt-1 line-clamp-1">{listing.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {getHousingTypeLabel(listing.housingType)}
          </p>
          <div className="mt-3 flex items-end justify-between">
            <p className="text-lg font-semibold text-primary">
              {listing.price.toLocaleString("ru-RU")} ₽
            </p>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              до {listing.guests} гостей
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export function RentCatalog({
  initialListings,
}: {
  initialListings: ListingRecord[];
}) {
  const [city, setCity] = useState<string>(DEFAULT_CITY);
  const listings = initialListings;

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
        {listings.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <Home className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-medium text-muted-foreground">
                Пока нет активных объявлений
              </p>
              <p className="max-w-md text-sm text-muted-foreground">
                Предложения по аренде жилья появятся здесь совсем скоро.
                Загляните позже.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
