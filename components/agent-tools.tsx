"use client";

import { Wrench, ExternalLink, FileText } from "lucide-react";
import Link from "next/link";

const TOOLS_URL = "https://info.magazin-tour.ru/agentam/";

export function AgentTools() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Инструменты</h1>
        <p className="text-sm text-muted-foreground">
          Материалы и инструменты для агентов
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Wrench className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Справочник агента
            </h2>
            <p className="text-sm text-muted-foreground">
              Полезные материалы для работы агента
            </p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Ознакомьтесь с правилами, рекламными материалами и условиями работы
          агента на портале Magazin Tour.
        </p>
        <Link
          href={TOOLS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <FileText className="h-4 w-4" />
          Перейти к материалам для агентов
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
