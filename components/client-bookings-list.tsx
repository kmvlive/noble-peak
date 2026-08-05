"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarDays,
  Clock,
  ExternalLink,
  CreditCard,
  ArrowUpDown,
  SlidersHorizontal,
  Trash2,
  Archive,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

interface Booking {
  id: string;
  activityTitle: string;
  date: string;
  time: string | null;
  clientName: string;
  clientPhone: string;
  status: string;
  createdAt: string;
  orderNumber?: string;
  orderStatus?: string;
  deletedAt?: string | null;
}

type StatusFilter =
  "all" | "confirmed" | "pending_payment" | "cancelled" | "completed";
type DateFilter = "all" | "upcoming" | "past";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "completed", label: "Исполненные" },
  { value: "confirmed", label: "Оплаченные" },
  { value: "pending_payment", label: "Не оплаченные" },
  { value: "cancelled", label: "Отменённые" },
];

function effectiveStatus(booking: Booking): string {
  return booking.orderStatus ?? booking.status ?? "confirmed";
}

function getStatusLabel(status: string): string {
  if (status === "completed") return "Исполнен";
  if (status === "paid" || status === "confirmed") return "Оплачен";
  if (status === "pending_payment") return "Не оплачен";
  return "Отменён";
}

function getStatusColor(status: string): string {
  if (status === "pending_payment")
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (status === "completed" || status === "paid" || status === "confirmed")
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  return "bg-muted text-muted-foreground";
}

export function ClientBookingsList() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [sortAsc, setSortAsc] = useState(false);
  const [view, setView] = useState<"active" | "archive">("active");

  const handleDeleteBooking = (booking: Booking) => {
    const status = effectiveStatus(booking);
    if (status === "paid" || status === "completed") {
      toast.error(
        "Оплаченный заказ нельзя удалить. Для отмены обратитесь к администратору."
      );
      return;
    }
    toast("Удалить заказ?", {
      description: `«${booking.activityTitle}» на ${booking.date}`,
      action: {
        label: "Удалить",
        onClick: async () => {
          const loadingId = toast.loading("Удаляем заказ...");
          try {
            const res = await fetch(`/api/client/bookings/${booking.id}`, {
              method: "DELETE",
            });
            if (!res.ok) {
              const data = await res.json().catch(() => ({}));
              throw new Error(data.error || "Ошибка удаления заказа");
            }
            setBookings((prev) => prev.filter((b) => b.id !== booking.id));
            toast.success("Заказ удалён", { id: loadingId });
          } catch (err) {
            toast.error((err as Error).message, { id: loadingId });
          }
        },
      },
      cancel: { label: "Отмена", onClick: () => {} },
    });
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch(`/api/client/bookings?scope=${view}`);
        if (res.status === 401) {
          router.push("/client/login");
          return;
        }
        const data = await res.json();
        setBookings(data.bookings || []);
      } catch {
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [router, view]);

  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (statusFilter !== "all") {
      result = result.filter((b) => {
        const s = effectiveStatus(b);
        if (statusFilter === "confirmed")
          return s === "paid" || s === "confirmed";
        return s === statusFilter;
      });
    }

    if (dateFilter === "upcoming") {
      result = result.filter((b) => b.date >= today);
    } else if (dateFilter === "past") {
      result = result.filter((b) => b.date < today);
    }

    result.sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [bookings, statusFilter, dateFilter, sortAsc, today]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-lg border p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 rounded-lg border bg-muted/30 p-1 w-fit">
        <button
          onClick={() => setView("active")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "active"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Активные
        </button>
        <button
          onClick={() => setView("archive")}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            view === "archive"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Archive className="h-4 w-4" />
          Архив
        </button>
      </div>

      {view === "active" && (
        <div className="flex flex-wrap items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />
          <div className="flex flex-wrap gap-1.5">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`min-h-9 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  statusFilter === opt.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2 max-sm:w-full max-sm:ml-0">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="min-h-9 flex-1 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground"
            >
              <option value="all">Все даты</option>
              <option value="upcoming">Предстоящие</option>
              <option value="past">Прошедшие</option>
            </select>
            <button
              onClick={() => setSortAsc((v) => !v)}
              className="min-h-9 flex items-center gap-1.5 rounded-md border bg-background px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent transition-colors"
            >
              <ArrowUpDown className="h-3.5 w-3.5" />
              {sortAsc ? "сначала новые" : "сначала старые"}
            </button>
          </div>
        </div>
      )}

      {filteredBookings.length === 0 ? (
        <div className="rounded-lg border p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {view === "archive"
              ? "В архиве пока пусто"
              : bookings.length === 0
                ? "У вас пока нет бронирований"
                : "Нет бронирований по выбранным фильтрам"}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            Выбрать активность
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className="relative rounded-lg border transition-colors hover:bg-accent/50"
            >
              <Link
                href={`/client/bookings/${booking.id}`}
                className="block p-4 pr-12"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1.5">
                    <h3 className="text-sm font-semibold">
                      {booking.activityTitle}
                    </h3>
                    {booking.orderNumber && booking.orderNumber !== "-" && (
                      <p className="text-xs text-muted-foreground">
                        Заказ №{booking.orderNumber}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CalendarDays className="h-3 w-3" />
                        {booking.date}
                      </span>
                      {booking.time && (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {booking.time}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {effectiveStatus(booking) === "pending_payment" &&
                      view === "active" && (
                        <CreditCard className="h-3 w-3 text-amber-500" />
                      )}
                    {view === "archive" && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider">
                        Удалён
                      </span>
                    )}
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${getStatusColor(effectiveStatus(booking))}`}
                    >
                      {getStatusLabel(effectiveStatus(booking))}
                    </span>
                    <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                </div>
              </Link>
              {view === "active" && (
                <button
                  onClick={() => handleDeleteBooking(booking)}
                  aria-label="Удалить заказ"
                  className="absolute right-2 top-2 rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive"
                  title={
                    effectiveStatus(booking) === "paid" ||
                    effectiveStatus(booking) === "completed"
                      ? "Оплаченный заказ нельзя удалить"
                      : "Удалить заказ"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
