"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CalendarCheck, Bell, User, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ClientDashboard() {
  const [clientName, setClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.client?.name) {
          setClientName(data.client.name);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          {loading ? (
            <Skeleton className="h-8 w-48" />
          ) : (
            <>Добро пожаловать{clientName ? `, ${clientName}` : ""}!</>
          )}
        </h1>
        <p className="text-sm text-muted-foreground">
          Ваш личный кабинет. Здесь вы можете управлять бронированиями и
          просматривать уведомления.
        </p>
      </div>

      <div className="grid gap-4">
        <Link
          href="/client/bookings"
          className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-accent"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <CalendarCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Мои бронирования</p>
            <p className="text-sm text-muted-foreground truncate">
              Просмотр и управление вашими бронями
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/client/notifications"
          className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-accent"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Уведомления и чат</p>
            <p className="text-sm text-muted-foreground truncate">
              Уведомления о статусе брони и чат с партнёром
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>

        <Link
          href="/client/login"
          className="flex items-center gap-4 rounded-xl border p-4 transition-colors hover:bg-accent"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <User className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">Настройки профиля</p>
            <p className="text-sm text-muted-foreground truncate">
              Изменить имя, телефон или пароль
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
