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
} from "lucide-react";
import Link from "next/link";

interface Booking {
  id: string;
  activityTitle: string;
  date: string;
  time: string | null;
  clientName: string;
  clientPhone: string;
  status: string;
  paymentStatus: string | null;
  createdAt: string;
}

type StatusFilter = "all" | "confirmed" | "pending_payment" | "cancelled";
type DateFilter = "all" | "upcoming" | "past";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Все" },
  { value: "confirmed", label: "Подтверждённые" },
  { value: "pending_payment", label: "Ожидают оплаты" },
  { value: "cancelled", label: "Отменённые" },
];

function getStatusLabel(status: string, paymentStatus: string | null): string {
  if (status === "pending_payment") return "Ожидает оплаты";
  if (status === "confirmed" && paymentStatus === "CONFIRMED")
    return "Оплачено";
  if (status === "confirmed") return "Подтверждено";
  return "Отменено";
}

function getStatusColor(status: string, paymentStatus: string | null): string {
  if (status === "pending_payment")
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  if (status === "confirmed" && paymentStatus === "CONFIRMED")
    return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
  if (status === "confirmed")
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

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch("/api/client/bookings");
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
  }, [router]);

  const today = new Date().toISOString().split("T")[0];

  const filteredBookings = useMemo(() => {
    let result = [...bookings];

    if (statusFilter !== "all") {
      result = result.filter((b) => b.status === statusFilter);
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

      {filteredBookings.length === 0 ? (
        <div className="rounded-lg border p-8 text-center space-y-3">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <CalendarDays className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            {bookings.length === 0
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
            <Link
              key={booking.id}
              href={`/client/bookings/${booking.id}`}
              className="block rounded-lg border p-4 transition-colors hover:bg-accent/50"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold">
                    {booking.activityTitle}
                  </h3>
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
                  {booking.status === "pending_payment" && (
                    <CreditCard className="h-3 w-3 text-amber-500" />
                  )}
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${getStatusColor(booking.status, booking.paymentStatus)}`}
                  >
                    {getStatusLabel(booking.status, booking.paymentStatus)}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
