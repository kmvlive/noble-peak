"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Bell,
  User,
  ChevronRight,
  PackageOpen,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ClientTouristInfo } from "@/components/client-tourist-info";
import { toast } from "sonner";

interface OrderNotification {
  id: string;
  orderNumber: string;
  activityTitle: string;
  date: string;
  time: string | null;
  orderStatus: string;
  createdAt: string;
}

const statusBadge: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending_payment: { label: "Не оплачен", variant: "outline" },
  paid: { label: "Оплачен", variant: "default" },
  confirmed: { label: "Оплачен", variant: "default" },
  completed: { label: "Исполнен", variant: "default" },
  cancelled: { label: "Отменён", variant: "destructive" },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / 86400000);

  if (days === 0) {
    const hours = Math.floor(diff / 3600000);
    if (hours === 0) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes} мин. назад`;
    }
    return `${hours} ч. назад`;
  }
  if (days === 1) return "Вчера";
  if (days < 7) return `${days} дн. назад`;

  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function ClientDashboard() {
  const [clientName, setClientName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState<
    OrderNotification[]
  >([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

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

  useEffect(() => {
    fetch("/api/client/bookings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const all: OrderNotification[] = Array.isArray(data?.bookings)
          ? data.bookings
          : [];
        all.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
        );
        setOrderNotifications(all.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, []);

  useEffect(() => {
    const email = sessionStorage.getItem("reg_email");
    const password = sessionStorage.getItem("reg_password");
    if (email && password) {
      sessionStorage.removeItem("reg_email");
      sessionStorage.removeItem("reg_password");
      toast(`Ваш логин (email): ${email}\nВаш пароль: ${password}`, {
        duration: Infinity,
      });
    }
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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Последние уведомления из заказов
            </h2>
          </div>
          <Link
            href="/client/notifications"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Перейти в раздел «Уведомления»
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {ordersLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : orderNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Уведомлений из заказов пока нет
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {orderNotifications.map((order) => {
              const badge = statusBadge[order.orderStatus] ?? {
                label: order.orderStatus,
                variant: "outline" as const,
              };
              return (
                <div
                  key={order.id}
                  className="rounded-xl border bg-card p-3 transition-colors hover:bg-accent/30"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <PackageOpen className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            Заказ №{order.orderNumber} · {order.activityTitle}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {new Date(
                              order.date + "T00:00:00Z"
                            ).toLocaleDateString("ru-RU", {
                              day: "numeric",
                              month: "long",
                            })}
                            {order.time ? ` · ${order.time}` : " · весь день"}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                          <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ClientTouristInfo />
    </div>
  );
}
