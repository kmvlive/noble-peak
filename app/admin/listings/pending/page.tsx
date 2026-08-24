"use client";

import { useState, useEffect } from "react";
import {
  BedDouble,
  CheckCircle,
  XCircle,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getToken } from "@/components/admin-layout-client";
import {
  getHousingTypeLabel,
  getListingSubtypeLabel,
} from "@noble-peak/shared";
import type { ListingRecord } from "@noble-peak/shared";

export default function AdminPendingListingsPage() {
  const [listings, setListings] = useState<ListingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approveDialogId, setApproveDialogId] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/listings/pending")
      .then((res) => res.json())
      .then((data) => {
        setListings(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    const token = getToken();
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "active" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка одобрения");
      }

      toast.success("Объявление одобрено");
      setListings((prev) => prev.filter((l) => l.id !== id));
      setApproveDialogId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось одобрить объявление"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const token = getToken();
    try {
      const res = await fetch(`/api/admin/listings/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка отклонения");
      }

      toast.success("Объявление отклонено");
      setListings((prev) => prev.filter((l) => l.id !== id));
      setRejectDialogId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось отклонить объявление"
      );
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Новые услуги</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Объявления, добавленные партнёрами. Здесь они ожидают модерации.
        </p>
      </div>

      {listings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <BedDouble className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Нет новых услуг</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Все объявления от партнёров уже обработаны.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {listings.map((listing) => {
            const isProcessing = processingId === listing.id;
            const housingTypeLabel = getHousingTypeLabel(listing.housingType);
            const subtypeLabel = getListingSubtypeLabel(
              listing.housingType,
              listing.subtype
            );

            return (
              <div
                key={listing.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      На модерации
                    </span>
                    {listing.listingNumber && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        Объект №{listing.listingNumber}
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-semibold truncate">
                    {listing.title}
                  </h3>
                  {listing.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {listing.description}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      Тип: {housingTypeLabel} — {subtypeLabel}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {listing.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {listing.guests}
                    </span>
                    <span>Цена: {listing.price} ₽</span>
                    {listing.partnerEmail && (
                      <span>Партнёр: {listing.partnerEmail}</span>
                    )}
                    <span>
                      Создано:{" "}
                      {new Date(listing.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0 sm:items-center sm:gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => setApproveDialogId(listing.id)}
                    className="w-full sm:w-auto"
                  >
                    {isProcessing ? (
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle className="mr-1.5 h-4 w-4" />
                    )}
                    Одобрить
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => setRejectDialogId(listing.id)}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Отклонить
                  </Button>
                </div>

                <Dialog
                  open={approveDialogId === listing.id}
                  onOpenChange={(open) => {
                    if (!open) setApproveDialogId(null);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Одобрить объявление</DialogTitle>
                      <DialogDescription>
                        Объявление станет активным и появится на сайте.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setApproveDialogId(null)}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="button"
                        disabled={isProcessing}
                        onClick={() => handleApprove(listing.id)}
                      >
                        {isProcessing && (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        )}
                        Одобрить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={rejectDialogId === listing.id}
                  onOpenChange={(open) => {
                    if (!open) setRejectDialogId(null);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Отклонить объявление</DialogTitle>
                      <DialogDescription>
                        Вы уверены, что хотите отклонить &laquo;
                        {listing.title}&raquo;?
                      </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setRejectDialogId(null)}
                      >
                        Отмена
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        disabled={isProcessing}
                        onClick={() => handleReject(listing.id)}
                      >
                        {isProcessing && (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        )}
                        Отклонить
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
