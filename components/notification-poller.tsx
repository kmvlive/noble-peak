"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { usePathname, useRouter } from "next/navigation";

const POLL_INTERVAL = 30_000;

interface PollNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

interface PollChatMessage {
  id: string;
  senderRole: "client" | "partner";
  text: string;
  createdAt: string;
}

function extractNotifications(data: unknown): PollNotification[] {
  if (Array.isArray(data)) return data as PollNotification[];
  if (data && typeof data === "object" && "notifications" in data) {
    return (data as { notifications: PollNotification[] }).notifications;
  }
  return [];
}

function extractMessages(data: unknown): PollChatMessage[] {
  if (Array.isArray(data)) return data as PollChatMessage[];
  if (data && typeof data === "object" && "threads" in data) {
    return (data as { threads: PollChatMessage[] }).threads;
  }
  if (data && typeof data === "object" && "messages" in data) {
    return (data as { messages: PollChatMessage[] }).messages;
  }
  return [];
}

function getLatestOtherMsg(
  msgs: PollChatMessage[],
  myRole: "client" | "partner"
): PollChatMessage | null {
  const other = msgs.filter((m) => m.senderRole !== myRole);
  if (other.length === 0) return null;
  return other.reduce((a, b) =>
    a.createdAt.localeCompare(b.createdAt) > 0 ? a : b
  );
}

export function NotificationPoller() {
  const pathname = usePathname();
  const router = useRouter();

  const lastNotifCount = useRef(0);
  const lastOtherMsgId = useRef("");
  const isFirstPoll = useRef(true);

  useEffect(() => {
    const isOnNotificationsPage =
      pathname === "/client/notifications" ||
      pathname === "/partner/notifications";

    if (isOnNotificationsPage) return;

    const poll = async () => {
      const clientToken = localStorage.getItem("client_token");
      const partnerToken = localStorage.getItem("partner_token");

      const promises: Promise<void>[] = [];

      if (clientToken) {
        promises.push(
          (async () => {
            try {
              const [notifRes, chatRes] = await Promise.all([
                fetch("/api/client/notifications"),
                fetch("/api/client/chat"),
              ]);

              if (notifRes.ok) {
                const data = await notifRes.json();
                const notifs = extractNotifications(data);
                const unread = notifs.filter((n) => !n.isRead);

                if (
                  !isFirstPoll.current &&
                  unread.length > lastNotifCount.current
                ) {
                  const newest = unread[0];
                  toast(
                    <div
                      onClick={() => router.push("/client/notifications")}
                      className="cursor-pointer"
                    >
                      {newest.title}
                    </div>,
                    { description: newest.message, duration: 5000 }
                  );
                }
                lastNotifCount.current = unread.length;
              }

              if (chatRes.ok) {
                const data = await chatRes.json();
                const msgs = extractMessages(data);
                const latestOther = getLatestOtherMsg(msgs, "client");

                if (latestOther && latestOther.id !== lastOtherMsgId.current) {
                  if (!isFirstPoll.current && lastOtherMsgId.current !== "") {
                    toast(
                      <div
                        onClick={() => router.push("/client/notifications")}
                        className="cursor-pointer"
                      >
                        Новое сообщение в чате
                      </div>,
                      {
                        description: "Нажмите, чтобы открыть чат",
                        duration: 5000,
                      }
                    );
                  }
                  lastOtherMsgId.current = latestOther.id;
                }
              }
            } catch {
              // silent
            }
          })()
        );
      }

      if (partnerToken) {
        promises.push(
          (async () => {
            try {
              const [notifRes, chatRes] = await Promise.all([
                fetch("/api/partner/notifications"),
                fetch("/api/partner/chat"),
              ]);

              if (notifRes.ok) {
                const data = await notifRes.json();
                const notifs = extractNotifications(data);
                const unread = notifs.filter((n) => !n.isRead);

                if (
                  !isFirstPoll.current &&
                  unread.length > lastNotifCount.current
                ) {
                  const newest = unread[0];
                  toast(
                    <div
                      onClick={() => router.push("/partner/notifications")}
                      className="cursor-pointer"
                    >
                      {newest.title}
                    </div>,
                    { description: newest.message, duration: 5000 }
                  );
                }
                lastNotifCount.current = unread.length;
              }

              if (chatRes.ok) {
                const data = await chatRes.json();
                const msgs = extractMessages(data);
                const latestOther = getLatestOtherMsg(msgs, "partner");

                if (latestOther && latestOther.id !== lastOtherMsgId.current) {
                  if (!isFirstPoll.current && lastOtherMsgId.current !== "") {
                    toast(
                      <div
                        onClick={() => router.push("/partner/notifications")}
                        className="cursor-pointer"
                      >
                        Новое сообщение в чате
                      </div>,
                      {
                        description: "Нажмите, чтобы открыть чат",
                        duration: 5000,
                      }
                    );
                  }
                  lastOtherMsgId.current = latestOther.id;
                }
              }
            } catch {
              // silent
            }
          })()
        );
      }

      await Promise.all(promises);
      isFirstPoll.current = false;
    };

    poll();
    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [pathname, router]);

  return null;
}
