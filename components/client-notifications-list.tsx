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
  MessageSquare,
  Send,
} from "lucide-react";
import Link from "next/link";
import { ChatWidget } from "@/components/chat-widget";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

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
  const [tab, setTab] = useState<"notifications" | "chat">("notifications");
  const [vkEnabled, setVkEnabled] = useState(false);
  const [vkLoading, setVkLoading] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(true);

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

    const fetchVkSetting = async () => {
      try {
        const res = await fetch("/api/client/vk-notifications");
        if (res.ok) {
          const data = await res.json();
          setVkEnabled(data.enabled ?? false);
        }
      } catch {
      } finally {
        setVkLoading(false);
      }
    };

    fetchNotifications();
    fetchVkSetting();

    const fetchTelegramSetting = async () => {
      try {
        const res = await fetch("/api/client/telegram-notifications");
        if (res.ok) {
          const data = await res.json();
          setTelegramEnabled(data.enabled ?? false);
          setTelegramChatId(data.chatId ?? "");
        }
      } catch {
      } finally {
        setTelegramLoading(false);
      }
    };

    fetchTelegramSetting();
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

  const handleVkToggle = async (enabled: boolean) => {
    setVkEnabled(enabled);
    try {
      const res = await fetch("/api/client/vk-notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setVkEnabled(!enabled);
      }
    } catch {
      setVkEnabled(!enabled);
    }
  };

  const handleTelegramToggle = async (enabled: boolean) => {
    setTelegramEnabled(enabled);
    try {
      const res = await fetch("/api/client/telegram-notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) {
        setTelegramEnabled(!enabled);
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Не удалось изменить настройку Telegram");
      }
    } catch {
      setTelegramEnabled(!enabled);
      toast.error("Не удалось изменить настройку Telegram");
    }
  };

  const handleTelegramChatIdSave = async () => {
    const chatId = telegramChatId.trim();
    if (!chatId) {
      toast.error("Введите Telegram ID");
      return;
    }
    try {
      const res = await fetch("/api/client/telegram-notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chatId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        toast.error(data?.error || "Не удалось сохранить Telegram ID");
        return;
      }
      setTelegramChatId(chatId);
      toast.success("Telegram ID сохранён");
    } catch {
      toast.error("Не удалось сохранить Telegram ID");
    }
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center gap-2 border-b pb-2">
        <button
          onClick={() => setTab("notifications")}
          className={`flex items-center gap-1.5 rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors min-h-10 ${
            tab === "notifications"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bell className="h-4 w-4" />
          Уведомления
        </button>
        <button
          onClick={() => setTab("chat")}
          className={`flex items-center gap-1.5 rounded-t-md px-4 py-2.5 text-sm font-medium transition-colors min-h-10 ${
            tab === "chat"
              ? "border-b-2 border-primary text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Чаты
        </button>
      </div>

      {tab === "notifications" && (
        <>
          <div className="rounded-lg border bg-card p-4 mt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg
                  className="h-5 w-5 text-[#0077FF]"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12.362 1.868c-5.694 0-10.31 4.616-10.31 10.31 0 5.695 4.616 10.311 10.31 10.311 5.695 0 10.311-4.616 10.311-10.31 0-5.695-4.616-10.311-10.31-10.311zm4.786 7.078c.101.448.101.448.101.448s-1.342 5.604-1.897 7.837c-.234.94-.685 1.253-1.125 1.284-.956.07-1.682-.631-2.608-1.236-1.45-.946-2.277-1.536-3.687-2.459-1.63-1.069-.574-1.657.357-2.617.244-.251 4.47-4.096 4.653-4.444.038-.073.072-.21-.027-.297-.1-.087-.247-.058-.353-.034-.151.034-2.545 1.617-7.187 4.749-.68.467-1.296.694-1.848.682-.608-.013-1.777-.344-2.646-.626-.534-.174-.959-.266-.922-.562.02-.156.234-.316.645-.479 2.536-1.104 4.229-1.797 5.079-2.036 2.424-.703 2.927-.825 3.255-.825.072 0-.193.329.193.872z" />
                </svg>
                <div>
                  <p className="text-sm font-medium">Уведомления ВКонтакте</p>
                  <p className="text-xs text-muted-foreground">
                    Дублировать уведомления в личные сообщения ВК
                  </p>
                </div>
              </div>
              <Switch
                checked={vkEnabled}
                onCheckedChange={handleVkToggle}
                disabled={vkLoading}
              />
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send className="h-5 w-5 text-sky-500" />
                <div>
                  <p className="text-sm font-medium">Уведомления Telegram</p>
                  <p className="text-xs text-muted-foreground">
                    Дублировать уведомления в Telegram
                  </p>
                </div>
              </div>
              <Switch
                checked={telegramEnabled}
                onCheckedChange={handleTelegramToggle}
                disabled={telegramLoading}
              />
            </div>
            {telegramEnabled && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={telegramChatId}
                  onChange={(e) => setTelegramChatId(e.target.value)}
                  placeholder="Введите Telegram ID"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <button
                  onClick={handleTelegramChatIdSave}
                  className="inline-flex items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors h-9"
                >
                  Сохранить
                </button>
              </div>
            )}
            <p className="text-[10px] text-muted-foreground">
              Напишите боту @NoblePeakBot в Telegram, чтобы узнать ваш Telegram
              ID
            </p>
          </div>
        </>
      )}

      {tab === "chat" ? (
        <div className="flex flex-1 flex-col min-h-0">
          <ChatWidget userRole="client" userEmail="" apiBase="/api/client" />
        </div>
      ) : loading ? (
        <div className="space-y-3 mt-4">
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
      ) : notifications.length === 0 ? (
        <div className="rounded-lg border p-8 text-center space-y-3 mt-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Bell className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            У вас пока нет уведомлений
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Выбрать активность
          </Link>
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setUnreadOnly(false)}
                className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  !unreadOnly
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                Все
              </button>
              <button
                onClick={() => setUnreadOnly(true)}
                className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
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
                className="min-h-9 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
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
      )}
    </div>
  );
}
