"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  BellRing,
  PackageOpen,
  AlertTriangle,
  Info,
  Sparkles,
  ChevronRight,
  FileText,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from "@/components/partner-layout-client";

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

interface InfoPage {
  id: string;
  target: "partner" | "tourist";
  title: string;
  content: string;
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

export function PartnerDashboard() {
  const router = useRouter();
  const [partnerName] = useState("");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notifLoading, setNotifLoading] = useState(true);
  const [infoPages, setInfoPages] = useState<InfoPage[]>([]);
  const [infoLoading, setInfoLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    fetch("/api/partner/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data) => {
        const all: Notification[] = Array.isArray(data) ? data : [];
        all.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setNotifications(all.slice(0, 5));
        setNotifLoading(false);
      })
      .catch(() => {
        setNotifLoading(false);
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

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Добро пожаловать{partnerName ? `, ${partnerName}` : ""}
            </h1>
            <p className="text-sm text-muted-foreground">
              Кабинет партнёра — управляйте активностями, заказами и календарём
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold tracking-tight">
              Последние уведомления
            </h2>
          </div>
          <Link
            href="/partner/notifications"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Все уведомления
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {notifLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <Bell className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">
              Уведомлений пока нет
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`rounded-xl border bg-card p-3 transition-colors ${
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
                          <p
                            className={`text-sm ${
                              !notification.isRead
                                ? "font-semibold"
                                : "text-muted-foreground"
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                            {notification.message}
                          </p>
                        </div>
                        <span className="shrink-0 whitespace-nowrap text-[10px] text-muted-foreground">
                          {formatDate(notification.createdAt)}
                        </span>
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
