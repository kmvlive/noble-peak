"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BedDouble,
  Building2,
  CheckCircle2,
  Clock,
  XCircle,
  Pencil,
  Loader2,
  Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
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
    label: "Активное",
    icon: CheckCircle2,
    class: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  rejected: {
    label: "Отклонено",
    icon: XCircle,
    class: "text-red-600 bg-red-50 border-red-200",
  },
};

type StatusFilter = "all" | ListingRecord["status"];

export default function AdminListingsAllPage() {
  const router = useRouter();
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("all");

  useEffect(() => {
    fetch("/api/admin/listings")
      .then((res) => res.json())
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: listings.length,
      active: 0,
      pending: 0,
      rejected: 0,
    };
    for (const l of listings) {
      if (l.status in c) c[l.status]++;
    }
    return c;
  }, [listings]);

  const filtered = useMemo(
    () =>
      filter === "all" ? listings : listings.filter((l) => l.status === filter),
    [listings, filter]
  );

  const filters: { key: StatusFilter; label: string }[] = [
    { key: "all", label: "Все" },
    { key: "active", label: "Активные" },
    { key: "pending", label: "На модерации" },
    { key: "rejected", label: "Отклонённые" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Все объекты</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Все объявления по жилью: активные, на модерации и отклонённые.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {filters.map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
            <span className="ml-1.5 rounded-full bg-background/20 px-1.5 text-xs">
              {counts[f.key]}
            </span>
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mb-1 font-medium">Объявлений нет</h3>
          <p className="text-sm text-muted-foreground">
            В этой категории пока нет объявлений.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((listing) => {
            const cfg = statusConfig[listing.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const isRooms = listing.housingType === "rooms";

            return (
              <div
                key={listing.id}
                className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-start sm:justify-between"
              >
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
                    {listing.listingNumber && (
                      <span className="inline-flex items-center rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                        Объект №{listing.listingNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold leading-tight">
                    {listing.title}
                  </h3>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {getListingSubtypeLabel(
                      listing.housingType,
                      listing.subtype
                    )}
                    {listing.description ? ` · ${listing.description}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {listing.city && <span>{listing.city}</span>}
                    {listing.address && <span>{listing.address}</span>}
                    <span>{listing.price.toLocaleString()} ₽</span>
                    {listing.partnerEmail && (
                      <span>Партнёр: {listing.partnerEmail}</span>
                    )}
                    <span>
                      Создано:{" "}
                      {new Date(listing.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                </div>
                <div className="shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      router.push(`/admin/listings/${listing.id}/edit`)
                    }
                    className="w-full sm:w-auto"
                  >
                    <Pencil className="mr-1.5 h-4 w-4" />
                    Открыть
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
