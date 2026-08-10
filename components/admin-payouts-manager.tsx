"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Loader2,
  Banknote,
  CheckCircle2,
  XCircle,
  Clock,
  Archive,
  CircleDollarSign,
  HandCoins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { getToken } from "@/components/admin-layout-client";

interface Payout {
  id: string;
  number: string;
  agentEmail: string;
  agentName: string;
  amount: number;
  month: string;
  status: "pending" | "approved" | "paid" | "declined";
  createdAt: string;
  updatedAt: string;
}

type PayoutStatus = Payout["status"];

function formatRubles(value: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMonth(month: string): string {
  const [year, m] = month.split("-");
  const date = new Date(Number(year), Number(m) - 1, 1);
  return new Intl.DateTimeFormat("ru-RU", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function AdminPayoutsManager() {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    const token = getToken();
    try {
      const res = await fetch("/api/admin/payouts", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("Ошибка загрузки");
      const payload = await res.json();
      setPayouts(Array.isArray(payload.payouts) ? payload.payouts : []);
    } catch {
      toast.error("Не удалось загрузить выплаты");
    } finally {
      setLoading(false);
    }
  };

  const changeStatus = async (payout: Payout, status: PayoutStatus) => {
    const token = getToken();
    setUpdatingId(payout.id);
    try {
      const res = await fetch(`/api/admin/payouts/${payout.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Не удалось обновить выплату");
        return;
      }
      if (status === "approved") {
        toast.success("Выплата одобрена — «надо выплатить»");
      } else if (status === "declined") {
        toast.success("Выплата отклонена");
      } else if (status === "paid") {
        toast.success("Выплата произведена и ушла в архив");
      }
      fetchPayouts();
    } catch {
      toast.error("Ошибка сервера");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const pending = payouts.filter((p) => p.status === "pending");
  const toPay = payouts.filter((p) => p.status === "approved");
  const archived = payouts.filter(
    (p) => p.status === "paid" || p.status === "declined"
  );

  const renderPayoutRow = (payout: Payout) => {
    const isPending = payout.status === "pending";
    const isApproved = payout.status === "approved";
    return (
      <div
        key={payout.id}
        className="rounded-lg border bg-card p-3 sm:p-4 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
              № {payout.number}
            </span>
            <div className="text-sm">
              <div className="font-medium">{payout.agentName}</div>
              <div className="text-muted-foreground">{payout.agentEmail}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isApproved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
                <Clock className="h-3.5 w-3.5" />
                надо выплатить
              </span>
            )}
            <span className="text-base font-semibold tracking-tight">
              {formatRubles(payout.amount)}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {formatMonth(payout.month)} · создана {formatDate(payout.createdAt)}
          </span>
        </div>
        {isPending && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => changeStatus(payout, "approved")}
              disabled={updatingId === payout.id}
            >
              {updatingId === payout.id ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
              ) : (
                <CircleDollarSign className="h-4 w-4 mr-1.5" />
              )}
              Выплатить
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => changeStatus(payout, "declined")}
              disabled={updatingId === payout.id}
            >
              <XCircle className="h-4 w-4 mr-1.5" />
              Отказать
            </Button>
          </div>
        )}
        {isApproved && (
          <Button
            size="sm"
            onClick={() => changeStatus(payout, "paid")}
            disabled={updatingId === payout.id}
          >
            {updatingId === payout.id ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
            )}
            Выплата произведена
          </Button>
        )}
        {(payout.status === "paid" || payout.status === "declined") && (
          <div className="text-xs">
            {payout.status === "paid" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 font-medium text-green-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Выплата произведена
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 font-medium text-red-700">
                <XCircle className="h-3.5 w-3.5" />
                Отклонена
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  const emptyBlock = (icon: React.ReactNode, text: string) => (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <HandCoins className="h-4 w-4" />
          Новые заявки
        </h2>
        {pending.length === 0 ? (
          emptyBlock(
            <FileText className="h-5 w-5 text-muted-foreground" />,
            "Новых заявок нет"
          )
        ) : (
          <div className="space-y-2">{pending.map(renderPayoutRow)}</div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Clock className="h-4 w-4" />
          Надо выплатить
        </h2>
        {toPay.length === 0 ? (
          emptyBlock(
            <Clock className="h-5 w-5 text-muted-foreground" />,
            "Одобренных выплат нет"
          )
        ) : (
          <div className="space-y-2">{toPay.map(renderPayoutRow)}</div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Archive className="h-4 w-4" />
          Архив
        </h2>
        {archived.length === 0 ? (
          emptyBlock(
            <Archive className="h-5 w-5 text-muted-foreground" />,
            "Архив пуст"
          )
        ) : (
          <div className="space-y-2">{archived.map(renderPayoutRow)}</div>
        )}
      </div>

      {payouts.length === 0 &&
        emptyBlock(
          <Banknote className="h-5 w-5 text-muted-foreground" />,
          "Заявок на выплаты пока нет"
        )}
    </div>
  );
}
