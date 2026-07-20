"use client";

import { useState, useEffect } from "react";
import { Clock, Eye, ExternalLink, MapPin, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityRecord } from "@/lib/models";

export default function AdminPendingActivitiesPage() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/activities/pending")
      .then((res) => res.json())
      .then((data: ActivityRecord[]) => {
        setActivities(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Новые активности</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Активности, добавленные партнёрами. Здесь они ожидают модерации.
        </p>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Clock className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Нет новых активностей</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Все активности от партнёров уже обработаны.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    На модерации
                  </span>
                  {activity.over18 && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      18+
                    </span>
                  )}
                </div>
                <h3 className="mt-2 text-base font-semibold truncate">
                  {activity.title}
                </h3>
                {activity.shortDescription && (
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                    {activity.shortDescription}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <span>Раздел: {activity.section}</span>
                  {activity.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {activity.location}
                    </span>
                  )}
                  <span>Цена: {activity.price} ₽</span>
                  {activity.partnerEmail && (
                    <span>Партнёр: {activity.partnerEmail}</span>
                  )}
                  <span>
                    Создана:{" "}
                    {new Date(activity.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/activities/${activity.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <Eye className="mr-1.5 h-4 w-4" />
                    Просмотр
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
