"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Bell,
  BellRing,
  CheckCheck,
  AlertTriangle,
  Info,
  ExternalLink,
  Send,
} from "lucide-react";
import Link from "next/link";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { getAgentToken } from "@/components/agent-layout-client";

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
      return BellRing;
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

export function AgentNotifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [vkEnabled, setVkEnabled] = useState(false);
  const [vkLoading, setVkLoading] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramLoading, setTelegramLoading] = useState(true);

  useEffect(() => {
    const token = getAgentToken();
    if (!token) {
      router.replace("/agent/login");
      return;
    }

    fetch("/api/agent/notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          router.replace("/agent/login");
          throw new Error("Не авторизован");
        }
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data) => {
        setNotifications(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });

    fetch("/api/agent/vk-notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data) => {
        setVkEnabled(data.enabled ?? false);
        setVkLoading(false);
      })
      .catch(() => {
        setVkLoading(false);
      });

    fetch("/api/agent/telegram-notifications", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ошибка загрузки");
        return res.json();
      })
      .then((data) => {
        setTelegramEnabled(data.enabled ?? false);
        setTelegramChatId(data.chatId ?? "");
        setTelegramLoading(false);
      })
      .catch(() => {
        setTelegramLoading(false);
      });
  }, [router]);

  const displayed = unreadOnly
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    const token = getAgentToken();
    try {
      await fetch("/api/agent/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: string) => {
    const token = getAgentToken();
    try {
      await fetch("/api/agent/notifications", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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
    const token = getAgentToken();
    setVkEnabled(enabled);
    try {
      const res = await fetch("/api/agent/vk-notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) setVkEnabled(!enabled);
    } catch {
      setVkEnabled(!enabled);
    }
  };

  const handleTelegramToggle = async (enabled: boolean) => {
    const token = getAgentToken();
    setTelegramEnabled(enabled);
    try {
      const res = await fetch("/api/agent/telegram-notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) setTelegramEnabled(!enabled);
    } catch {
      setTelegramEnabled(!enabled);
    }
  };

  const handleTelegramChatIdSave = async () => {
    const token = getAgentToken();
    try {
      const res = await fetch("/api/agent/telegram-notifications", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ chatId: telegramChatId }),
      });
      if (!res.ok) {
        toast.error("Не удалось сохранить Telegram ID");
      } else {
        toast.success("Telegram ID сохранён");
      }
    } catch {
      toast.error("Не удалось сохранить Telegram ID");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Уведомления</h1>
        <p className="text-sm text-muted-foreground">
          Настройки уведомлений и история уведомлений агента
        </p>
      </div>

      <div className="rounded-lg border bg-card p-4 space-y-3">
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
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              Сохранить
            </button>
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">
          Напишите боту @NoblePeakBot в Telegram, чтобы узнать ваш Telegram ID
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">История уведомлений</h2>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Прочитать все
            </button>
          )}
        </div>

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

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
            Ошибка загрузки: {error}
          </div>
        ) : displayed.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Bell className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-1 font-medium">Уведомлений пока нет</h3>
            <p className="text-sm text-muted-foreground">
              Уведомления о новых партнёрах и начислениях будут появляться здесь
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {displayed.map((notification) => {
              const Icon = getTypeIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`rounded-xl border bg-card p-4 transition-colors ${
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
                              className="rounded p-0.5 text-muted-foreground transition-colors hover:text-foreground"
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
    </div>
  );
}
