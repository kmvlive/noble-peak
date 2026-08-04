"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, PackageOpen, ChevronRight, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/components/partner-layout-client";
import { toast } from "sonner";

interface OrderNotification {
  id: string;
  orderNumber: string;
  activityTitle: string;
  clientName: string;
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

interface InfoPage {
  id: string;
  target: "partner" | "tourist";
  title: string;
  content: string;
}

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

export function PartnerDashboard() {
  const router = useRouter();
  const [orderNotifications, setOrderNotifications] = useState<
    OrderNotification[]
  >([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [infoPages, setInfoPages] = useState<InfoPage[]>([]);
  const [infoLoading, setInfoLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    fetch("/api/partner/orders", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data) => {
        const all: OrderNotification[] = Array.isArray(data) ? data : [];
        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setOrderNotifications(all.slice(0, 5));
        setOrdersLoading(false);
      })
      .catch(() => {
        setOrdersLoading(false);
      });

    fetch("/api/partner/info", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data) => {
        setInfoPages(Array.isArray(data) ? data : []);
        setInfoLoading(false);
      })
      .catch(() => {
        setInfoLoading(false);
      });
  }, [router]);

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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Кабинет партнёра
          </h1>
          <p className="text-sm text-muted-foreground">
            Управляйте активностями, заказами и календарём
          </p>
        </div>
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
            href="/partner/notifications"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Перейти в раздел Уведомления
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
                            {order.clientName} ·{" "}
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

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold tracking-tight">
            Информация для партнёров
          </h2>
        </div>

        {infoLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : infoPages.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Информации пока нет</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {infoPages.map((page) => (
              <div
                key={page.id}
                className="rounded-xl border bg-card p-4 space-y-2 card-hover"
              >
                <h3 className="font-semibold">{page.title}</h3>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: page.content }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
