"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellRing,
  CheckCheck,
  ExternalLink,
  PackageOpen,
  AlertTriangle,
  Info,
} from "lucide-react";
import Link from "next/link";

interface Notification {
  id: string;
  recipientEmail: string;
  type: "booking_status" | "new_order" | "activity_status" | "system";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

function getTypeIcon(type: Notification["type"]) {
  switch (type) {
    case "booking_status":
      return PackageOpen;
    case "new_order":
      return BellRing;
    case "activity_status":
      return AlertTriangle;
    case "system":
      return Info;
  }
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

export function ClientNotificationsList() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadOnly, setUnreadOnly] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/client/notifications");
        if (res.status === 401) {
          router.push("/client/login");
          return;
        }
        const data = await res.json();
        setNotifications(data.notifications || []);
      } catch {
        setNotifications([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [router]);

  const displayed = unreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/client/notifications", {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await fetch(`/api/client/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
            <Skeleton className="h-4 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Bell className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          У вас пока нет уведомлений
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Выбрать активность
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUnreadOnly(false)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              !unreadOnly
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Все
          </button>
          <button
            onClick={() => setUnreadOnly(true)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
              unreadOnly
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            Непрочитанные{unreadCount > 0 && ` (${unreadCount})`}
          </button>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Прочитать все
          </button>
        )}
      </div>

      {displayed.length === 0 ? (
        <div className="rounded-lg border p-8 text-center">
          <Bell className="mx-auto h-6 w-6 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Нет непрочитанных уведомлений
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {displayed.map((notification) => {
            const Icon = getTypeIcon(notification.type);
            return (
              <div
                key={notification.id}
                className={`rounded-lg border p-4 transition-colors ${
                  !notification.isRead
                    ? "bg-accent/30 border-accent"
                    : "hover:bg-accent/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      !notification.isRead
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3
                          className={`text-sm ${
                            !notification.isRead
                              ? "font-semibold"
                              : "font-medium text-muted-foreground"
                          }`}
                        >
                          {notification.title}
                        </h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {notification.message}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </span>
                        {!notification.isRead && (
                          <button
                            onClick={() => handleMarkRead(notification.id)}
                            className="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
                            title="Отметить прочитанным"
                          >
                            <CheckCheck className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {notification.link && (
                      <Link
                        href={notification.link}
                        className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        Подробнее
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
