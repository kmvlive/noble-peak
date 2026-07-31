import Link from "next/link";
import { Metadata } from "next";
import { CheckCircle, ArrowLeft } from "lucide-react";
import { appName } from "@/lib/app-name";
import { GuestSetPassword } from "@/components/guest-set-password";

export const metadata: Metadata = {
  title: `Бронирование подтверждено — ${appName}`,
};

export default async function BookingConfirmationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 dark:bg-green-900/30">
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Бронирование подтверждено!
          </h1>
          <p className="text-sm text-muted-foreground">
            Ваше бронирование принято. Мы отправили данные администратору.
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 p-4">
          <p className="text-xs text-muted-foreground">Номер бронирования</p>
          <p className="mt-1 font-mono text-sm font-medium">{id}</p>
        </div>
        <GuestSetPassword />
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <Link
            href="/client/bookings"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Мои бронирования
          </Link>
        </div>
      </div>
    </div>
  );
}
