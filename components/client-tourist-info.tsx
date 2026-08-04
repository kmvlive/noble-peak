"use client";

import { useState, useEffect } from "react";
import { Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { InfoPageRecord } from "@/lib/mock-data";

interface PaginatedResponse {
  items: InfoPageRecord[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

export function ClientTouristInfo() {
  const [data, setData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/client/tourist-info?page=${page}&limit=10`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [page]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Info className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-lg font-semibold tracking-tight">
          Информация туристам
        </h2>
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Нет доступной информации
        </p>
      ) : (
        <>
          <div className="grid gap-3">
            {data.items.map((item) => (
              <details
                key={item.id}
                className="group rounded-xl border p-4 transition-colors [&[open]]:border-primary/30"
              >
                <summary className="cursor-pointer list-none font-medium text-sm leading-snug marker:hidden">
                  <div className="flex items-start justify-between gap-2">
                    <span>{item.title}</span>
                    <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-90" />
                  </div>
                </summary>
                <div
                  className="mt-3 text-sm text-muted-foreground prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />
              </details>
            ))}
          </div>

          {data.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                {data.page} / {data.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
