"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { getToken } from "@/components/partner-layout-client";
import { Button } from "@/components/ui/button";

interface Order {
  id: string;
  activityId: string;
  activityTitle: string;
  date: string;
  time: string | null;
  clientName: string;
  status: string;
}

const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Окторябрь",
  "Ноябрь",
  "Декабрь",
];

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function PartnerCalendar() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date());

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
      .then((data: Order[]) => {
        setOrders(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return <Skeleton className="h-80 w-full rounded-xl" />;
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Ошибка загрузки: {error}
      </div>
    );
  }

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const daysInMonth = lastDay.getDate();

  const today = new Date().toISOString().split("T")[0];

  const ordersByDate: Record<string, Order[]> = {};
  for (const order of orders) {
    if (order.status === "cancelled") continue;
    if (!ordersByDate[order.date]) ordersByDate[order.date] = [];
    ordersByDate[order.date].push(order);
  }

  const cells: { day: number; dateStr: string; hasOrders: boolean }[] = [];
  for (let i = 0; i < startPad; i++) {
    cells.push({ day: 0, dateStr: "", hasOrders: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr, hasOrders: !!ordersByDate[dateStr] });
  }

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const orderCount = orders.filter((o) => o.status !== "cancelled").length;

  return (
    <div className="space-y-3 md:space-y-4">
      <div className="flex items-center justify-between rounded-xl border bg-card p-2 md:p-3">
        <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5 md:h-4 md:w-4" />
          <span>
            Заказов: <strong className="text-foreground">{orderCount}</strong>
          </span>
        </div>
      </div>

      <div className="rounded-xl border bg-card">
        <div className="flex items-center justify-between border-b px-3 md:px-4 py-2 md:py-3">
          <Button variant="ghost" size="icon-sm" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-sm md:text-base font-semibold">
            {MONTHS[month]} {year}
          </h2>
          <Button variant="ghost" size="icon-sm" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-1.5 md:p-3">
          <div className="mb-1 md:mb-2 grid grid-cols-7 gap-0.5 md:gap-1">
            {WEEKDAYS.map((wd) => (
              <div
                key={wd}
                className="py-1 text-center text-[10px] md:text-xs font-medium text-muted-foreground"
              >
                {wd}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 md:gap-1">
            {cells.map((cell, i) => {
              if (cell.day === 0) {
                return <div key={i} />;
              }

              const isToday = cell.dateStr === today;
              const dayOrders = ordersByDate[cell.dateStr] || [];

              return (
                <div
                  key={i}
                  className={`relative flex min-h-[36px] md:min-h-[56px] flex-col items-center justify-start rounded-lg p-0.5 md:p-1 text-xs md:text-sm transition-colors ${
                    isToday
                      ? "bg-primary/10 ring-1 ring-primary/30"
                      : "hover:bg-accent"
                  }`}
                >
                  <span
                    className={`text-[10px] md:text-xs ${
                      isToday ? "font-bold text-primary" : "text-foreground"
                    }`}
                  >
                    {cell.day}
                  </span>
                  {dayOrders.length > 0 && (
                    <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                      {dayOrders.slice(0, 2).map((o) => (
                        <div
                          key={o.id}
                          className="h-1 w-1 md:h-1.5 md:w-1.5 rounded-full bg-primary"
                          title={`${o.activityTitle} — ${o.clientName}`}
                        />
                      ))}
                      {dayOrders.length > 2 && (
                        <span className="text-[8px] md:text-[10px] text-muted-foreground">
                          +{dayOrders.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {orderCount > 0 && (
        <div className="rounded-xl border bg-card p-3 md:p-4">
          <h3 className="mb-2 md:mb-3 text-xs md:text-sm font-semibold">
            Ближайшие заказы
          </h3>
          <div className="space-y-1.5 md:space-y-2">
            {orders
              .filter((o) => o.status !== "cancelled")
              .sort((a, b) => a.date.localeCompare(b.date))
              .slice(0, 5)
              .map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-lg bg-muted/50 px-2.5 md:px-3 py-1.5 md:py-2 text-xs md:text-sm"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {order.activityTitle}
                    </p>
                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {new Date(order.date + "T00:00:00Z").toLocaleDateString(
                        "ru-RU",
                        { day: "numeric", month: "long", timeZone: "UTC" }
                      )}
                      {order.time ? `, ${order.time}` : ", весь день"} —{" "}
                      {order.clientName}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
