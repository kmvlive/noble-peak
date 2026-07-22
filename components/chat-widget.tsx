"use client";

import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, ArrowLeft, ChevronRight } from "lucide-react";
import { mockOrders, mockPartnerBookings } from "@/lib/mock-data";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  orderId: string;
  senderEmail: string;
  senderRole: "client" | "partner";
  text: string;
  clientEmail: string;
  partnerEmail: string;
  createdAt: string;
}

interface ThreadInfo {
  orderId: string;
  lastMessage: ChatMessage;
  activityTitle: string;
  partnerName?: string;
  clientName?: string;
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
  });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ChatWidget({
  userRole,
  userEmail,
  apiBase,
}: {
  userRole: "client" | "partner";
  userEmail: string;
  apiBase: string;
}) {
  const [threads, setThreads] = useState<ThreadInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await fetch(`${apiBase}/chat`);
        if (!res.ok) {
          setThreads([]);
          return;
        }
        const data = await res.json();
        const items: ChatMessage[] = data.threads ?? data ?? [];

        if (items.length === 0) {
          setThreads([]);
          return;
        }

        const orderMap = new Map<string, ChatMessage[]>();
        for (const msg of items) {
          if (!orderMap.has(msg.orderId)) {
            orderMap.set(msg.orderId, []);
          }
          orderMap.get(msg.orderId)!.push(msg);
        }

        const result: ThreadInfo[] = [];
        for (const [orderId, msgs] of orderMap) {
          msgs.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          const activityTitle = getActivityTitle(orderId);
          const clientName = getClientName(orderId);
          result.push({
            orderId,
            lastMessage: msgs[0],
            activityTitle,
            partnerName: "Партнёр",
            clientName,
          });
        }

        result.sort(
          (a, b) =>
            new Date(b.lastMessage.createdAt).getTime() -
            new Date(a.lastMessage.createdAt).getTime()
        );

        setThreads(result);
      } catch {
        setThreads([]);
      } finally {
        setLoading(false);
      }
    };

    fetchThreads();
  }, [apiBase]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const selectOrder = async (orderId: string) => {
    setSelectedOrderId(orderId);
    setMessagesLoading(true);
    try {
      const res = await fetch(`${apiBase}/chat?orderId=${orderId}`);
      if (!res.ok) {
        setMessages([]);
        return;
      }
      const data = await res.json();
      const items: ChatMessage[] = data.messages ?? data ?? [];
      items.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
      setMessages(items);
    } catch {
      setMessages([]);
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !selectedOrderId || sending) return;

    const thread = threads.find((t) => t.orderId === selectedOrderId);
    if (!thread) return;

    const partnerEmail =
      userRole === "client"
        ? thread.lastMessage.partnerEmail
        : thread.lastMessage.clientEmail;

    const clientEmail =
      userRole === "client" ? userEmail : thread.lastMessage.clientEmail;

    const body: Record<string, string> = {
      orderId: selectedOrderId,
      text: inputText.trim(),
    };

    if (userRole === "client") {
      body.partnerEmail = partnerEmail;
    } else {
      body.clientEmail = clientEmail;
    }

    setSending(true);
    try {
      const res = await fetch(`${apiBase}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.error || "Ошибка отправки");
        return;
      }

      const data = await res.json();
      const newMsg: ChatMessage = data.message ?? data;

      setMessages((prev) => [...prev, newMsg]);
      setInputText("");

      setThreads((prev) =>
        prev.map((t) =>
          t.orderId === selectedOrderId ? { ...t, lastMessage: newMsg } : t
        )
      );
    } catch {
      toast.error("Ошибка отправки сообщения");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-8 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <MessageSquare className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Нет активных чатов</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Чат появляется после подтверждения заказа
        </p>
      </div>
    );
  }

  if (selectedOrderId) {
    const thread = threads.find((t) => t.orderId === selectedOrderId);
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setSelectedOrderId(null);
              setMessages([]);
            }}
            className="rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h3 className="text-sm font-semibold">{thread?.activityTitle}</h3>
            <p className="text-xs text-muted-foreground">
              {userRole === "client"
                ? "Чат с организатором"
                : `Чат с ${thread?.clientName ?? "клиентом"}`}
            </p>
          </div>
        </div>

        <div className="flex h-[400px] flex-col rounded-xl border bg-card">
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messagesLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-3/4 rounded-lg" />
                ))}
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-sm text-muted-foreground">
                  Напишите первое сообщение
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine =
                  userRole === "client"
                    ? msg.senderRole === "client"
                    : msg.senderRole === "partner";
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                        isMine
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.text}
                      </p>
                      <p
                        className={`mt-1 text-right text-[10px] ${
                          isMine
                            ? "text-primary-foreground/60"
                            : "text-muted-foreground"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                placeholder="Напишите сообщение..."
                className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || sending}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {threads.map((thread) => (
        <button
          key={thread.orderId}
          onClick={() => selectOrder(thread.orderId)}
          className="w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{thread.activityTitle}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {userRole === "client"
                  ? thread.lastMessage.text
                  : `${thread.clientName ?? "Клиент"}: ${thread.lastMessage.text}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                {formatDate(thread.lastMessage.createdAt)}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}

function getActivityTitle(orderId: string): string {
  const order = mockOrders.find((o) => o.id === orderId);
  if (order) return order.activityTitle;

  const booking = mockPartnerBookings.find((b) => b.id === orderId);
  if (booking) return booking.activityTitle;

  return "Заказ";
}

function getClientName(orderId: string): string {
  const order = mockOrders.find((o) => o.id === orderId);
  if (order) return order.clientName;

  const booking = mockPartnerBookings.find((b) => b.id === orderId);
  if (booking) return booking.clientName;

  return "Клиент";
}
