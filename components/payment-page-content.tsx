"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  ArrowLeft,
  User,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export function PaymentPageContent() {
  const searchParams = useSearchParams();
  const activityId = searchParams.get("activityId");
  const date = searchParams.get("date");
  const time = searchParams.get("time");

  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [isGuest, setIsGuest] = useState(false);
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestConflict, setGuestConflict] = useState(false);

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setPaymentUrl(null);
    setRetryKey((k) => k + 1);
  };

  const run = useCallback(async () => {
    if (!activityId || !date) return;

    let cancelled = false;

    const doFetch = async () => {
      try {
        const body: Record<string, unknown> = {
          activityId,
          date,
          time,
          details: "",
        };

        if (isGuest) {
          body.clientName = guestName;
          body.clientPhone = guestPhone;
        }

        const res = await fetch("/api/payments/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        if (cancelled) return;

        const data = await res.json();

        if (!res.ok) {
          if (res.status === 401) {
            if (isGuest) {
              setError(
                data.error || "Необходимо указать имя и телефон для оплаты"
              );
              setLoading(false);
              return;
            }
            setIsGuest(true);
            setLoading(false);
            return;
          }
          if (res.status === 409) {
            setGuestConflict(true);
            setError(
              "Этот номер уже используется. Пожалуйста, авторизуйтесь для оплаты"
            );
            setLoading(false);
            return;
          }
          setError(data.error || "Ошибка при создании платежа");
          setLoading(false);
          return;
        }

        if (data.isGuest && data.setPasswordToken) {
          localStorage.setItem("guest_token", data.setPasswordToken);
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

    doFetch();

    return () => {
      cancelled = true;
    };
  }, [activityId, date, time, isGuest, guestName, guestPhone]);

  useEffect(() => {
    const cancel = run();
    return () => {
      cancel?.then((fn) => fn?.());
    };
  }, [run, retryKey]);

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone) {
      toast.error("Заполните имя и телефон");
      return;
    }
    setGuestConflict(false);
    setError(null);
    setLoading(true);
    setRetryKey((k) => k + 1);
  };

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

  if (isGuest && !loading && !paymentUrl && !redirecting) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <CreditCard className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Оплата</h1>
            <p className="text-sm text-muted-foreground">
              Укажите имя и телефон для оформления оплаты
            </p>
          </div>

          {guestConflict && (
            <Card className="border-destructive/50 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                <p className="text-sm text-muted-foreground">
                  Этот номер уже используется. Пожалуйста, авторизуйтесь для
                  оплаты
                </p>
              </div>
            </Card>
          )}

          <form
            onSubmit={handleGuestSubmit}
            className="space-y-4 rounded-lg border p-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Имя</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="pl-10"
                  placeholder="Ваше имя"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Телефон
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className="pl-10"
                  placeholder="+7 (999) 123-45-67"
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full">
              Продолжить
            </Button>
          </form>

          <Link
            href="/client/login"
            className="block text-center text-sm text-primary hover:underline"
          >
            Уже зарегистрированы? Войти
          </Link>

          <Link
            href={`/activities/${activityId}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Вернуться к активности
          </Link>
        </div>
      </div>
    );
  }

  if (error && !paymentUrl) {
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
