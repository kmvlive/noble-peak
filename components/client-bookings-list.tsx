"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarDays, Clock, ExternalLink, CreditCard } from "lucide-react";
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

  if (bookings.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center space-y-3">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <CalendarDays className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          У вас пока нет бронирований
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          Выбрать активность
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => (
        <Link
          key={booking.id}
          href={`/client/bookings/${booking.id}`}
          className="block rounded-lg border p-4 transition-colors hover:bg-accent/50"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold">{booking.activityTitle}</h3>
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
  );
}
