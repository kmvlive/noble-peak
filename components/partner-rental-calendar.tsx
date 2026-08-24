"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  CalendarDays,
  BedDouble,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getToken } from "@/components/partner-layout-client";
import {
  getHousingTypeLabel,
  getListingSubtypeLabel,
} from "@noble-peak/shared";
import type { ListingRecord } from "@noble-peak/shared";

export function PartnerRentalCalendar() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    fetch("/api/partner/listings", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки объявлений");
        return res.json();
      })
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Ошибка загрузки: {error}
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Building2 className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium">Объявлений пока нет</h3>
        <p className="mb-5 text-sm text-muted-foreground">
          Добавьте первое объявление, чтобы настроить календарь сдачи
        </p>
        <Link href="/partner/listings/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Добавить объект
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => {
        const isRooms = listing.housingType === "rooms";
        return (
          <div
            key={listing.id}
            className="group flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-accent/30"
          >
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold leading-tight">{listing.title}</h3>
              <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  {isRooms ? (
                    <BedDouble className="h-3.5 w-3.5" />
                  ) : (
                    <Building2 className="h-3.5 w-3.5" />
                  )}
                  {getHousingTypeLabel(listing.housingType)}
                </span>
                <span className="mx-2">·</span>
                {getListingSubtypeLabel(listing.housingType, listing.subtype)}
                {listing.city ? ` · ${listing.city}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                router.push(`/partner/listings/${listing.id}/calendar`)
              }
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <CalendarDays className="h-4 w-4" />
              Календарь сдачи
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
