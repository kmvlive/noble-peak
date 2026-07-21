"use client";

import { useState, useEffect } from "react";
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Star,
  User,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getToken } from "./admin-layout-client";
import type { ReviewRecord } from "@/lib/models";

export function AdminReviewsList() {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("pending");

  useEffect(() => {
    loadReviews();
  }, [filter]);

  const loadReviews = async () => {
    setLoading(true);
    const token = getToken();
    try {
      const url =
        filter === "all"
          ? "/api/admin/reviews"
          : `/api/admin/reviews?status=${filter}`;
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      setReviews(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Ошибка загрузки отзывов");
    } finally {
      setLoading(false);
    }
  };

  const handleModerate = async (
    activityId: string,
    id: string,
    status: "approved" | "rejected"
  ) => {
    setProcessingId(id);
    const token = getToken();
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ activityId, id, status }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка модерации");
      }

      toast.success(status === "approved" ? "Отзыв одобрен" : "Отзыв отклонён");
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось изменить статус"
      );
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Отзывы</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Модерация отзывов клиентов на активности
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { value: "pending", label: "На модерации" },
          { value: "approved", label: "Одобренные" },
          { value: "rejected", label: "Отклонённые" },
          { value: "all", label: "Все" },
        ].map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">
            {filter === "pending" ? "Нет отзывов на модерации" : "Нет отзывов"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "pending"
              ? "Все отзывы уже обработаны."
              : "Отзывы не найдены."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => {
            const isProcessing = processingId === review.id;

            return (
              <div key={review.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{review.clientName}</p>
                      <p className="text-xs text-muted-foreground">
                        {review.clientEmail}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground/20"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">{review.text}</p>

                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>
                    Активность: <strong>{review.activityId}</strong>
                  </span>
                  <span>
                    {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      review.status === "approved"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        : review.status === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
                    }`}
                  >
                    {review.status === "approved"
                      ? "Одобрен"
                      : review.status === "rejected"
                        ? "Отклонён"
                        : "На модерации"}
                  </span>
                </div>

                {review.status === "pending" && (
                  <div className="flex gap-2 pt-1">
                    <Button
                      variant="default"
                      size="sm"
                      disabled={isProcessing}
                      onClick={() =>
                        handleModerate(review.activityId, review.id, "approved")
                      }
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
                      onClick={() =>
                        handleModerate(review.activityId, review.id, "rejected")
                      }
                    >
                      <XCircle className="mr-1.5 h-4 w-4" />
                      Отклонить
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
