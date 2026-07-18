import { Metadata } from "next";
import { CreditCard, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { appName } from "@/lib/app-name";

export const metadata: Metadata = {
  title: `Оплата — ${appName}`,
};

export default async function PaymentPage({
  searchParams,
}: {
  searchParams: Promise<{ activityId?: string; date?: string; time?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Оплата</h1>
          <p className="text-sm text-muted-foreground">
            Страница оплаты временно недоступна. Интеграция с платёжной системой
            будет добавлена позже.
          </p>
        </div>
        {params.activityId && (
          <div className="rounded-lg border bg-muted/30 p-4 text-left space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Активность:</span>{" "}
              {params.activityId}
            </p>
            <p>
              <span className="text-muted-foreground">Дата:</span>{" "}
              {params.date || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Время:</span>{" "}
              {params.time || "Весь день"}
            </p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}
