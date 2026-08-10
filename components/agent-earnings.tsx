"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Wallet,
  CalendarDays,
  FileText,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  CircleDollarSign,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getAgentToken } from "@/components/agent-layout-client";

interface Payout {
  id: string;
  number: string;
  agentEmail: string;
  agentName: string;
  amount: number;
  month: string;
  status: "pending" | "approved" | "paid" | "declined";
  createdAt: string;
}

interface MonthlyEarning {
  month: string;
  amount: number;
}

interface EarningsData {
  agent: { name: string; email: string; code: string };
  totalEarnings: number;
  monthly: MonthlyEarning[];
  payouts: Payout[];
  currentMonth: string;
  canRequest: boolean;
}

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

const STATUS_META: Record<
  Payout["status"],
  { label: string; className: string }
> = {
  pending: {
    label: "На рассмотрении",
    className: "bg-amber-100 text-amber-700",
  },
  approved: {
    label: "Ожидайте выплату",
    className: "bg-blue-100 text-blue-700",
  },
  paid: {
    label: "Выплата произведена",
    className: "bg-green-100 text-green-700",
  },
  declined: { label: "Отклонена", className: "bg-red-100 text-red-700" },
};

export function AgentEarnings() {
  const router = useRouter();
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = () => {
    const token = getAgentToken();
    if (!token) {
      router.replace("/agent/login");
      return;
    }

    fetch("/api/agent/earnings", {
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
        if (payload.agent) setData(payload);
      })
      .catch(() => {
        toast.error("Не удалось загрузить данные");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const openDialog = () => {
    setAmount(String(data?.totalEarnings ?? 0));
    setDialogOpen(true);
  };

  const submitPayout = async () => {
    if (!data) return;
    const numeric = Number(amount);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      toast.error("Укажите корректную сумму");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/agent/payouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAgentToken()}`,
        },
        body: JSON.stringify({ amount: numeric }),
      });
      const payload = await res.json();
      if (!res.ok) {
        toast.error(payload.error ?? "Не удалось подать заявку");
        return;
      }
      toast.success("Заявка на выплату подана");
      setDialogOpen(false);
      setAmount("");
      load();
    } catch {
      toast.error("Ошибка сервера");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!data) return null;

  const { totalEarnings, monthly, payouts } = data;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Заработок и выплаты
        </h1>
        <p className="text-sm text-muted-foreground">
          Ваш заработок и заявки на вывод средств
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border bg-card p-5">
          <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </div>
          <div className="text-3xl font-bold tracking-tight">
            {formatRubles(totalEarnings)}
          </div>
          <div className="text-sm text-muted-foreground">
            Заработок за всё время
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5 flex flex-col justify-between gap-3">
          <div>
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <CircleDollarSign className="h-5 w-5" />
            </div>
            <div className="text-sm text-muted-foreground">Вывод заработка</div>
          </div>
          {data.canRequest ? (
            <Button onClick={openDialog} className="w-full">
              <Plus className="h-4 w-4 mr-1.5" />
              Подать заявку на выплату
            </Button>
          ) : (
            <div className="rounded-md border border-muted bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
              Заявка на выплату уже подана в этом месяце
            </div>
          )}
        </div>
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4" />
          Заработок по месяцам
        </h2>
        {monthly.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Пока нет начислений</p>
          </div>
        ) : (
          <div className="space-y-2">
            {monthly.map((item) => (
              <div
                key={item.month}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  {formatMonth(item.month)}
                </div>
                <div className="text-base font-semibold tracking-tight">
                  {formatRubles(item.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-5 space-y-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="h-4 w-4" />
          Заявки на выплаты
        </h2>
        {payouts.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">Заявок пока нет</p>
          </div>
        ) : (
          <div className="space-y-2">
            {payouts.map((payout) => {
              const meta = STATUS_META[payout.status];
              return (
                <div
                  key={payout.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-sm font-semibold text-primary">
                      № {payout.number}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatMonth(payout.month)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-base font-semibold tracking-tight">
                      {formatRubles(payout.amount)}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${meta.className}`}
                    >
                      {payout.status === "approved" && (
                        <Clock className="h-3.5 w-3.5" />
                      )}
                      {payout.status === "paid" && (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      )}
                      {payout.status === "declined" && (
                        <XCircle className="h-3.5 w-3.5" />
                      )}
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Заявка на выплату</DialogTitle>
            <DialogDescription>
              Укажите сумму для вывода заработка. Вывод доступен раз в месяц.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                Сумма (руб.)
              </label>
              <Input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Сумма"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Доступно: {formatRubles(totalEarnings)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Отмена
            </Button>
            <Button onClick={submitPayout} disabled={submitting}>
              {submitting ? "Отправка..." : "Подать заявку"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
