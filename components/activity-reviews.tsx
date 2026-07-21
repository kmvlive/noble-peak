"use client";

import { useState, useEffect } from "react";
import { Star, MessageSquare, Send, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Review {
  id: string;
  activityId: string;
  clientEmail: string;
  clientName: string;
  rating: number;
  text: string;
  status: string;
  createdAt: string;
}

interface ReviewsData {
  reviews: Review[];
  averageRating: number;
  total: number;
}

export function ActivityReviews({ activityId }: { activityId: string }) {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [clientEmail, setClientEmail] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/activities/${activityId}/reviews`)
      .then((res) => res.json())
      .then((data) => setReviewsData(data))
      .catch(() => {})
      .finally(() => setLoading(false));

    fetch("/api/client/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.client?.email) setClientEmail(data.client.email);
      })
      .catch(() => {});
  }, [activityId]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Пожалуйста, поставьте оценку");
      return;
    }
    if (!text.trim()) {
      toast.error("Пожалуйста, напишите отзыв");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/activities/${activityId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, text: text.trim() }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Ошибка отправки");
      }

      toast.success("Отзыв отправлен на модерацию");
      setRating(0);
      setText("");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Не удалось отправить отзыв"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const { reviews, averageRating, total } = reviewsData ?? {
    reviews: [],
    averageRating: 0,
    total: 0,
  };

  return (
    <div className="space-y-6">
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold tracking-tight">Отзывы</h2>
        </div>

        {total > 0 && (
          <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-4 py-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <span className="text-lg font-bold">{averageRating}</span>
            <span className="text-sm text-muted-foreground">
              ({total}{" "}
              {total === 1 ? "отзыв" : total < 5 ? "отзыва" : "отзывов"})
            </span>
          </div>
        )}

        {reviews.length > 0 && (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">
                      {review.clientName}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5">
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
                <p className="text-xs text-muted-foreground/60">
                  {new Date(review.createdAt).toLocaleDateString("ru-RU")}
                </p>
              </div>
            ))}
          </div>
        )}

        {total === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Пока нет отзывов</p>
          </div>
        )}

        {clientEmail ? (
          <div className="rounded-lg border p-4 space-y-4">
            <h3 className="text-sm font-medium">Оставить отзыв</h3>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-colors"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= (hoverRating || rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-muted-foreground/30 hover:text-amber-400/50"
                    }`}
                  />
                </button>
              ))}
            </div>
            <Textarea
              placeholder="Поделитесь впечатлениями..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
            />
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Отправить
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            <a href="/client/login" className="text-primary hover:underline">
              Войдите
            </a>
            , чтобы оставить отзыв
          </p>
        )}
      </div>
    </div>
  );
}
