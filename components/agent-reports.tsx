"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CalendarRange,
  CalendarCheck,
  TrendingUp,
  ShoppingCart,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getAgentToken } from "@/components/agent-layout-client";

interface Sales {
  today: number;
  month: number;
  year: number;
}

interface ReportData {
  agent: { name: string; email: string; code: string };
  sales: Sales;
}

export function AgentReports() {
  const router = useRouter();
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAgentToken();
    if (!token) {
      router.replace("/agent/login");
      return;
    }

    fetch("/api/agent/reports", {
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
      .then((payload) => {
        if (payload.agent && payload.sales) setData(payload);
      })
      .catch(() => {
        toast.error("Не удалось загрузить отчёт");
      })
      .finally(() => setLoading(false));
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { sales } = data;

  const cards = [
    {
      label: "Продажи за сегодня",
      value: sales.today,
      icon: CalendarCheck,
    },
    {
      label: "Продажи за месяц",
      value: sales.month,
      icon: CalendarDays,
    },
    {
      label: "Продажи за год",
      value: sales.year,
      icon: CalendarRange,
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Отчёты</h1>
        <p className="text-sm text-muted-foreground">
          Продажи ваших партнёров за выбранные периоды
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl border bg-card p-4">
              <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-2xl font-bold tracking-tight">
                {card.value}
              </div>
              <div className="text-sm text-muted-foreground">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <ShoppingCart className="h-4 w-4" />
          Продажи партнёров
        </h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarCheck className="h-4 w-4" />
              За сегодня
            </div>
            <div className="text-lg font-semibold tracking-tight">
              {sales.today}
            </div>
          </div>
          <div className="flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              За последний месяц
            </div>
            <div className="text-lg font-semibold tracking-tight">
              {sales.month}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarRange className="h-4 w-4" />
              За последний год
            </div>
            <div className="text-lg font-semibold tracking-tight">
              {sales.year}
            </div>
          </div>
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
          Учитываются оплаченные заказы партнёров, привязанных к вам
        </p>
      </div>
    </div>
  );
}
