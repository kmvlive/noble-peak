"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CreditCard, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function PaymentPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activityId = searchParams.get("activityId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setPaymentUrl(null);
    setRetryKey((k) => k + 1);
  };

  useEffect(() => {
    if (!activityId || !date) return;

    let cancelled = false;

    const run = async () => {
      try {
        const res = await fetch("/api/payments/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ activityId, date, time, details: "" }),
        });

        if (cancelled) return;

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            router.push("/client/login");
            return;
          }
          setError(data.error || "Ошибка при создании платежа");
          setLoading(false);
          return;
        }

        setPaymentUrl(data.paymentUrl);
        setLoading(false);

        setTimeout(() => {
          if (!cancelled) setRedirecting(true);
          if (!cancelled) window.location.href = data.paymentUrl;
        }, 1500);
      } catch {
        if (!cancelled) {
          setError("Ошибка соединения с сервером");
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [activityId, date, time, router, retryKey]);

  if (!activityId || !date) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-8 w-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">Ошибка оплаты</h1>
            <p className="text-sm text-muted-foreground">
              Не указаны данные для оплаты. Пожалуйста, вернитесь на страницу
              активности и выберите дату.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <Card className="border-destructive/50 bg-destructive/10 p-6 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
              <div className="space-y-1">
                <h2 className="font-semibold">Ошибка оплаты</h2>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          </Card>
          <div className="flex flex-col gap-2">
            <Button onClick={handleRetry} disabled={loading}>
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Попробовать снова
            </Button>
            <Link
              href={`/activities/${activityId}`}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Вернуться к активности
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          {redirecting ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <CreditCard className="h-8 w-8 text-primary" />
          )}
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Оплата</h1>
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="mx-auto h-4 w-3/4" />
              <Skeleton className="mx-auto h-4 w-1/2" />
            </div>
          ) : (
            <p className="text-muted-foreground">
              {redirecting
                ? "Перенаправляем на страницу оплаты Т-банка..."
                : "Подготавливаем платёж. Пожалуйста, подождите..."}
            </p>
          )}
        </div>
        {!loading && paymentUrl && (
          <div className="rounded-lg border bg-muted/30 p-4 text-left space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Дата:</span> {date}
            </p>
            {time && (
              <p>
                <span className="text-muted-foreground">Время:</span> {time}
              </p>
            )}
          </div>
        )}
        {!loading && !redirecting && paymentUrl && (
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                setRedirecting(true);
                window.location.href = paymentUrl;
              }}
            >
              Перейти к оплате
            </Button>
            <Link
              href={`/activities/${activityId}`}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Вернуться
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
