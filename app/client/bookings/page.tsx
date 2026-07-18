import { Metadata } from "next";
import { CalendarCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { ClientBookingsList } from "@/components/client-bookings-list";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: `Мои бронирования — ${appName}`,
};

export default function ClientBookingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CalendarCheck className="h-4 w-4" />
        </div>
        <h1 className="text-xl font-bold tracking-tight">Мои бронирования</h1>
      </div>
      <ClientBookingsList />
      <div className="flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          На главную
        </Link>
      </div>
    </div>
  );
}
