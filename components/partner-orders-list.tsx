"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getToken } from "@/components/partner-layout-client";

interface Order {
  id: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  activityId: string;
  activityTitle: string;
  date: string;
  time: string | null;
  details: string;
  price: number;
  status: "pending_payment" | "confirmed" | "cancelled";
  createdAt: string;
}

const statusBadge: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending_payment: { label: "Ожидает оплаты", variant: "outline" },
  confirmed: { label: "Подтверждён", variant: "default" },
  cancelled: { label: "Отменён", variant: "destructive" },
};

export function PartnerOrdersList({
  selectedOrderId,
}: {
  selectedOrderId?: string;
}) {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const selectedRef = useRef<HTMLDivElement | null>(null);

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
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    if (loading || !selectedOrderId || !selectedRef.current) return;
    selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [loading, selectedOrderId]);

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      params.set("export", "csv");
      const res = await fetch(`/api/partner/orders?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Ошибка экспорта");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `partner-orders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      console.error("Ошибка экспорта CSV");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Ошибка загрузки: {error}
      </div>
    );
  }

  const filtered = search
    ? orders.filter(
        (o) =>
          o.activityTitle.toLowerCase().includes(search.toLowerCase()) ||
          o.clientName.toLowerCase().includes(search.toLowerCase()) ||
          o.date.includes(search)
      )
    : orders;

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium">Заказов пока нет</h3>
        <p className="text-sm text-muted-foreground">
          Заказы появятся, когда клиенты забронируют ваши активности
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Поиск по активности, клиенту или дате..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={handleExportCSV}>
          <Download className="h-4 w-4 sm:mr-1" />
          <span className="hidden sm:inline">CSV</span>
        </Button>
      </div>

      {filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Ничего не найдено
        </div>
      )}

      {filtered.map((order) => {
        const badge = statusBadge[order.status] || statusBadge.cancelled;

        return (
          <div
            key={order.id}
            ref={order.id === selectedOrderId ? selectedRef : undefined}
            className={`rounded-xl border bg-card p-4 transition-colors ${
              order.id === selectedOrderId
                ? "ring-2 ring-primary bg-primary/5"
                : "hover:bg-accent/30"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
                <h3 className="font-semibold leading-tight">
                  {order.activityTitle}
                </h3>
                <div className="mt-1.5 space-y-0.5 text-sm text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">Клиент:</span>{" "}
                    {order.clientName} ({order.clientPhone})
                  </p>
                  <p>
                    <span className="font-medium text-foreground">Дата:</span>{" "}
                    {new Date(order.date + "T00:00:00Z").toLocaleDateString(
                      "ru-RU",
                      {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        timeZone: "UTC",
                      }
                    )}
                    {order.time ? `, ${order.time}` : ", весь день"}
                  </p>
                  {order.details && (
                    <p>
                      <span className="font-medium text-foreground">
                        Подробности:
                      </span>{" "}
                      {order.details}
                    </p>
                  )}
                  <p>
                    <span className="font-medium text-foreground">Сумма:</span>{" "}
                    {order.price.toLocaleString()} ₽
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
