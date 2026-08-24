"use client";

import { Plug, Cable, ArrowRight } from "lucide-react";
import Link from "next/link";
import { CHANNEL_MANAGERS } from "@/lib/channels";

export function PartnerIntegrations() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Подключите менеджеры каналов для двухсторонней синхронизации календаря и
        броней ваших объявлений. Каждый канал настраивается внутри конкретного
        объявления.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {CHANNEL_MANAGERS.map((manager) => (
          <div
            key={manager.type}
            className="flex items-start gap-3 rounded-xl border bg-card p-4"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cable className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold">{manager.name}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {manager.description}
              </p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border border-dashed bg-muted/30 p-5 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Plug className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium">Настройка интеграций</h3>
        <p className="mx-auto mb-5 max-w-md text-sm text-muted-foreground">
          Откройте объявление, чтобы подключить аккаунт менеджера канала и
          управлять синхронизацией календаря.
        </p>
        <Link
          href="/partner/listings"
          className="group inline-flex h-10 items-center gap-1.5 rounded-lg border border-transparent bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Перейти к объявлениям
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
