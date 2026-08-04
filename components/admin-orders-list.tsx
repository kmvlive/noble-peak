"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Calendar,
  Clock,
  DollarSign,
  Building,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface OrderRecord {
  id: string;
  orderNumber: string;
  bookingId: string;
  clientEmail: string;
  clientName: string;
  clientPhone: string;
  activityId: string;
  activityTitle: string;
  partnerEmail: string | null;
  date: string;
  time: string | null;
  price: number;
  status: string;
  createdAt: string;
}

interface OrderDetail extends OrderRecord {
  partnerName?: string | null;
}

const statusLabels: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pending_payment: { label: "Не оплачен", variant: "secondary" },
  paid: { label: "Оплачен", variant: "default" },
  confirmed: { label: "Оплачен", variant: "default" },
  completed: { label: "Исполнен", variant: "default" },
  cancelled: { label: "Отменён", variant: "destructive" },
};

function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00Z");
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });
  } catch {
    return dateStr;
  }
}

export function AdminOrdersList() {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [orderDetail, setOrderDetail] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [scope, setScope] = useState<"all" | "cancelled_paid">("all");

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "100",
        scope,
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/orders?${params}`);
      const data = await res.json();
      if (Array.isArray(data.orders)) {
        setOrders(data.orders);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } catch {
      console.error("Ошибка загрузки заказов");
    } finally {
      setLoading(false);
    }
  }, [page, search, scope]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearch("");
    setPage(1);
  };

  const handleExportCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      params.set("scope", scope);
      params.set("export", "csv");
      const res = await fetch(`/api/admin/orders?${params}`);
      if (!res.ok) throw new Error("Ошибка экспорта");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `orders-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      console.error("Ошибка экспорта CSV");
    }
  };

  const toggleExpand = async (orderId: string) => {
    if (expandedId === orderId) {
      setExpandedId(null);
      setOrderDetail(null);
      return;
    }
    setExpandedId(orderId);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      setOrderDetail(data?.order ?? null);
    } catch {
      setOrderDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCancelOrder = (order: OrderRecord) => {
    toast("Отменить оплаченный заказ?", {
      description: `«${order.activityTitle}» от ${order.clientName}. Отменить может только администратор.`,
      action: {
        label: "Отменить",
        onClick: async () => {
          const loadingId = toast.loading("Отменяем заказ...");
          try {
            const res = await fetch(`/api/admin/orders/${order.id}`, {
              method: "PATCH",
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || "Ошибка отмены заказа");
            }
            toast.success("Заказ отменён", { id: loadingId });
            fetchOrders();
          } catch (err) {
            toast.error((err as Error).message, { id: loadingId });
          }
        },
      },
      cancel: { label: "Назад", onClick: () => {} },
    });
  };

  const changeScope = (next: "all" | "cancelled_paid") => {
    if (next === scope) return;
    setScope(next);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">Отчёты</h1>
      </div>

      <div className="flex items-center gap-1.5 rounded-lg border bg-muted/30 p-1 w-fit">
        <button
          onClick={() => changeScope("all")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            scope === "all"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Все заказы
        </button>
        <button
          onClick={() => changeScope("cancelled_paid")}
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            scope === "cancelled_paid"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Отмена активностей
        </button>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <div className="relative flex-1 max-w-sm w-full sm:w-auto">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по номеру заказа..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="pl-8 pr-8"
          />
          {searchInput && (
            <button
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={handleSearch}>
            <Search className="h-4 w-4 mr-1" />
            Найти
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <FileText className="h-10 w-10" />
          <p className="text-sm">Заказы не найдены</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">
            Всего заказов: {total}
          </p>

          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order.id} className="border rounded-lg">
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-mono text-xs font-bold shrink-0">
                    #{order.orderNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {order.activityTitle}
                      </span>
                      <Badge
                        variant={
                          statusLabels[order.status]?.variant ?? "outline"
                        }
                        className="shrink-0 text-[10px] px-1.5 py-0"
                      >
                        {statusLabels[order.status]?.label ?? order.status}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                      <span>{order.clientName}</span>
                      <span>{formatDate(order.date)}</span>
                      <span>{formatPrice(order.price)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-muted-foreground">
                    {expandedId === order.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </button>

                {expandedId === order.id && (
                  <div className="border-t px-3 py-3 bg-muted/30">
                    {detailLoading ? (
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-40" />
                      </div>
                    ) : orderDetail ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Номер заказа:
                            </span>
                            <span className="font-mono">
                              #{orderDetail.orderNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Building className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Активность:
                            </span>
                            <span>{orderDetail.activityTitle}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Партнёр:
                            </span>
                            <span>{orderDetail.partnerName ?? "—"}</span>
                          </div>
                          {orderDetail.partnerEmail && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <span className="h-4 w-4 shrink-0" />
                              <span className="font-medium text-foreground">
                                Email партнёра:
                              </span>
                              <span className="text-xs">
                                {orderDetail.partnerEmail}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <User className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Клиент:
                            </span>
                            <span>{orderDetail.clientName}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Email клиента:
                            </span>
                            <span className="text-xs">
                              {orderDetail.clientEmail}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Телефон:
                            </span>
                            <span>{orderDetail.clientPhone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Дата:
                            </span>
                            <span>{formatDate(orderDetail.date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Время:
                            </span>
                            <span>{orderDetail.time ?? "Весь день"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <DollarSign className="h-4 w-4 shrink-0" />
                            <span className="font-medium text-foreground">
                              Цена:
                            </span>
                            <span>{formatPrice(orderDetail.price)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        Не удалось загрузить детали заказа
                      </p>
                    )}
                    {scope === "all" &&
                      (order.status === "paid" ||
                        order.status === "completed" ||
                        order.status === "confirmed") && (
                        <div className="mt-3 flex justify-end">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelOrder(order)}
                          >
                            Отменить заказ
                          </Button>
                        </div>
                      )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground px-2">
                {page} из {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
