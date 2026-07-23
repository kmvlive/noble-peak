"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Eye,
  ExternalLink,
  MapPin,
  CheckCircle,
  XCircle,
  Loader2,
  Percent,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { getToken } from "@/components/admin-layout-client";
import type { ActivityRecord } from "@/lib/models";

export default function AdminPendingActivitiesPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [approveDialogId, setApproveDialogId] = useState<string | null>(null);
  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null);
  const [partnerPercent, setPartnerPercent] = useState("70");

  useEffect(() => {
    fetch("/api/admin/activities/pending")
      .then((res) => res.json())
      .then((data) => {
        setActivities(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleApprove = async (id: string) => {
    const percent = Number(partnerPercent);
    if (isNaN(percent) || percent < 0 || percent > 100) {
      toast.error("Введите процент от 0 до 100");
      return;
    }

    setProcessingId(id);
    const token = getToken();
    try {
      const res = await fetch(`/api/admin/activities/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          status: "active",
          partnerPricePercent: percent,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка одобрения");
      }

      toast.success("Активность одобрена");
      setActivities((prev) => prev.filter((a) => a.id !== id));
      setApproveDialogId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось одобрить активность"
      );
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    const token = getToken();
    try {
      const res = await fetch(`/api/admin/activities/${id}`, {
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

      toast.success("Активность отклонена");
      setActivities((prev) => prev.filter((a) => a.id !== id));
      setRejectDialogId(null);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось отклонить активность"
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
        <h1 className="text-2xl font-bold tracking-tight">Новые активности</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Активности, добавленные партнёрами. Здесь они ожидают модерации.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Нет новых активностей</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Все активности от партнёров уже обработаны.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => {
            const isProcessing = processingId === activity.id;
            const partnerPriceCalc =
              activity.price * (Number(partnerPercent) / 100);

            return (
              <div
                key={activity.id}
                className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      На модерации
                    </span>
                    {activity.over18 && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        18+
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-base font-semibold truncate">
                    {activity.title}
                  </h3>
                  {activity.shortDescription && (
                    <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                      {activity.shortDescription}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span>Раздел: {activity.section}</span>
                    {activity.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {activity.location}
                      </span>
                    )}
                    <span>Цена: {activity.price} ₽</span>
                    {activity.partnerEmail && (
                      <span>Партнёр: {activity.partnerEmail}</span>
                    )}
                    <span>
                      Создана:{" "}
                      {new Date(activity.createdAt).toLocaleDateString("ru-RU")}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0 sm:items-center sm:gap-2">
                  <Link
                    href={`/activities/${activity.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto"
                  >
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                    >
                      <Eye className="mr-1.5 h-4 w-4" />
                      Просмотр
                      <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => {
                      setPartnerPercent("70");
                      setApproveDialogId(activity.id);
                    }}
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
                    onClick={() => setRejectDialogId(activity.id)}
                    className="w-full sm:w-auto"
                  >
                    <XCircle className="mr-1.5 h-4 w-4" />
                    Отклонить
                  </Button>
                </div>

                <Dialog
                  open={approveDialogId === activity.id}
                  onOpenChange={(open) => {
                    if (!open) setApproveDialogId(null);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Одобрить активность</DialogTitle>
                      <DialogDescription>
                        Укажите цену для партнёра в % от цены клиента ({" "}
                        {activity.price} ₽ )
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          <Percent className="mr-1 h-4 w-4 inline" />
                          Процент от цены клиента
                        </label>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          value={partnerPercent}
                          onChange={(e) => setPartnerPercent(e.target.value)}
                          placeholder="70"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Цена партнёра:{" "}
                        <strong>{Math.round(partnerPriceCalc)} ₽</strong> (от{" "}
                        {activity.price} ₽)
                      </p>
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
                          onClick={() => handleApprove(activity.id)}
                        >
                          {isProcessing && (
                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                          )}
                          Одобрить
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog
                  open={rejectDialogId === activity.id}
                  onOpenChange={(open) => {
                    if (!open) setRejectDialogId(null);
                  }}
                >
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Отклонить активность</DialogTitle>
                      <DialogDescription>
                        Вы уверены, что хотите отклонить &laquo;
                        {activity.title}&raquo;?
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
                        onClick={() => handleReject(activity.id)}
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
