import { Metadata } from "next";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";
import Link from "next/link";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: `Ошибка оплаты — ${appName}`,
};

export default async function PaymentFailPage({
  searchParams,
}: {
  searchParams: Promise<{ bookingId?: string }>;
}) {
  const { bookingId } = await searchParams;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 dark:bg-red-900/30">
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Ошибка оплаты</h1>
          <p className="text-sm text-muted-foreground">
            Платёж не был завершён. Пожалуйста, попробуйте снова или выберите
            другой способ оплаты.
          </p>
        </div>
        {bookingId && (
          <div className="rounded-lg border bg-muted/30 p-4">
            <p className="text-xs text-muted-foreground">Номер бронирования</p>
            <p className="mt-1 font-mono text-sm font-medium">{bookingId}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Попробовать снова
          </Link>
          <Link
            href="/client/bookings"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Мои бронирования
          </Link>
        </div>
      </div>
    </div>
  );
}
