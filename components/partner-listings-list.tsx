"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Plus,
  BedDouble,
  Building2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getToken } from "@/components/partner-layout-client";
import {
  getHousingTypeLabel,
  getListingSubtypeLabel,
} from "@noble-peak/shared";
import type { ListingRecord } from "@noble-peak/shared";

const statusConfig: Record<
  ListingRecord["status"],
  { label: string; icon: typeof Clock; class: string }
> = {
  pending: {
    label: "На модерации",
    icon: Clock,
    class: "text-amber-600 bg-amber-50 border-amber-200",
  },
  active: {
    label: "Одобрено",
    icon: CheckCircle2,
    class: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  rejected: {
    label: "Отклонено",
    icon: XCircle,
    class: "text-red-600 bg-red-50 border-red-200",
  },
};

export function PartnerListingsList() {
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
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
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
          Добавьте первое объявление, чтобы начать
        </p>
        <Link href="/partner/listings/new">
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Добавить объявление
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {listings.map((listing) => {
        const cfg = statusConfig[listing.status] || statusConfig.pending;
        const StatusIcon = cfg.icon;
        const isRooms = listing.housingType === "rooms";

        return (
          <div
            key={listing.id}
            className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex flex-wrap items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.class}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    {isRooms ? (
                      <BedDouble className="h-3 w-3" />
                    ) : (
                      <Building2 className="h-3 w-3" />
                    )}
                    {getHousingTypeLabel(listing.housingType)}
                  </span>
                </div>
                <h3 className="font-semibold leading-tight">{listing.title}</h3>
                <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                  {getListingSubtypeLabel(listing.housingType, listing.subtype)}
                  {listing.description ? ` · ${listing.description}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {listing.city && <span>{listing.city}</span>}
                  {listing.address && <span>{listing.address}</span>}
                  <span>{listing.price.toLocaleString()} ₽</span>
                  <span>
                    {new Date(listing.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  router.push(`/partner/listings/${listing.id}/edit`)
                }
                title="Открыть и редактировать"
                className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
