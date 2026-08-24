"use client";

import { useState, useEffect, useRef } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Send, ArrowLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import type { ChatThreadItem, ChatMessageRecord } from "@/lib/models";

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
  apiBase,
}: {
  userRole: "client" | "partner";
  apiBase: string;
}) {
  const [threads, setThreads] = useState<ChatThreadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageRecord[]>([]);
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
        const items: ChatThreadItem[] = data.threads ?? [];

        items.sort((a, b) => {
          const at = a.lastMessage
            ? new Date(a.lastMessage.createdAt).getTime()
            : -1;
          const bt = b.lastMessage
            ? new Date(b.lastMessage.createdAt).getTime()
            : -1;
          return bt - at;
        });

        setThreads(items);
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
      const items: ChatMessageRecord[] =
        data.messages ?? (Array.isArray(data) ? data : []);
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

    const body: Record<string, string> = {
      orderId: selectedOrderId,
      text: inputText.trim(),
    };

    if (userRole === "client") {
      body.partnerEmail = thread.partnerEmail;
    } else {
      body.clientEmail = thread.clientEmail;
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
      const newMsg: ChatMessageRecord = data.message ?? data;

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
          Чат появляется после подтверждения заказа или бронирования жилья
        </p>
      </div>
    );
  }

  if (selectedOrderId) {
    const thread = threads.find((t) => t.orderId === selectedOrderId);
    return (
      <div className="flex flex-1 flex-col min-h-0">
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              setSelectedOrderId(null);
              setMessages([]);
            }}
            className="min-h-9 min-w-9 rounded-md p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h3 className="text-sm font-semibold">{thread?.title}</h3>
            <p className="text-xs text-muted-foreground">
              {userRole === "client"
                ? "Чат с организатором"
                : `Чат с ${thread?.clientName ?? "клиентом"}`}
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col min-h-0 rounded-xl border bg-card mt-3">
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
                      className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 ${
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

          <div className="border-t p-3 shrink-0">
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
                className="min-h-10 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                disabled={sending}
              />
              <button
                onClick={sendMessage}
                disabled={!inputText.trim() || sending}
                className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
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
          className="w-full rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent/50 min-h-16"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">{thread.title}</h3>
              <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                {thread.kind === "listing"
                  ? userRole === "client"
                    ? "Бронирование жилья"
                    : `Клиент ${thread.clientName ?? ""}: бронирование жилья`
                  : userRole === "client"
                    ? (thread.lastMessage?.text ?? "Нет сообщений")
                    : `${thread.clientName ?? "Клиент"}: ${thread.lastMessage?.text ?? "Нет сообщений"}`}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {thread.lastMessage && (
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">
                  {formatDate(thread.lastMessage.createdAt)}
                </span>
              )}
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
