"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Hash, Link2, UserCheck, Clock } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getToken } from "@/components/partner-layout-client";
import { toast } from "sonner";

interface PendingLink {
  id: string;
  agentEmail: string;
  agentName: string;
  createdAt: string;
}

interface LinksPayload {
  partnerNumber: string;
  agentEmail: string | null;
  pendingLinks: PendingLink[];
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PartnerBindingPanel() {
  const router = useRouter();
  const [payload, setPayload] = useState<LinksPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }
    try {
      const res = await fetch("/api/partner/links", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        router.replace("/partner/login");
        return;
      }
      if (!res.ok) throw new Error("Ошибка загрузки");
      const data = await res.json();
      setPayload({
        partnerNumber: data.partnerNumber ?? "",
        agentEmail: data.agentEmail ?? null,
        pendingLinks: Array.isArray(data.pendingLinks) ? data.pendingLinks : [],
      });
    } catch {
      toast.error("Не удалось загрузить информацию о привязке");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  const respond = async (id: string, action: "accept" | "decline") => {
    const token = getToken();
    if (!token) return;
    setResponding(id);
    try {
      const res = await fetch(`/api/partner/links/${id}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action }),
      });
      if (res.status === 401) {
        router.replace("/partner/login");
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Ошибка при обработке запроса");
      }
      toast.success(action === "accept" ? "Запрос принят" : "Запрос отклонён");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-2">
        <Link2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold tracking-tight">
          Привязка к агенту
        </h2>
      </div>

      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Hash className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Ваш номер партнёра
              </p>
              <p className="font-mono text-lg font-bold tracking-tight">
                {payload?.partnerNumber || "—"}
              </p>
            </div>
          </div>
          {payload?.agentEmail ? (
            <Badge variant="default">
              <UserCheck className="mr-1 h-3 w-3" />
              Привязан к агенту
            </Badge>
          ) : (
            <Badge variant="outline">Не привязан</Badge>
          )}
        </div>
      </div>

      {payload && payload.pendingLinks.length > 0 ? (
        <div className="space-y-2">
          {payload.pendingLinks.map((link) => (
            <div
              key={link.id}
              className="rounded-xl border bg-card p-4 space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">
                    Агент {link.agentName} ({link.agentEmail})
                  </p>
                  <p className="text-xs text-muted-foreground">
                    отправил запрос на привязку · {formatDate(link.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  disabled={responding === link.id}
                  onClick={() => respond(link.id, "accept")}
                >
                  Принять
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={responding === link.id}
                  onClick={() => respond(link.id, "decline")}
                >
                  Отклонить
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
