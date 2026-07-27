"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  Search,
  Award,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { getToken } from "@/components/partner-layout-client";

interface Activity {
  id: string;
  title: string;
  shortDescription: string;
  section: string;
  price: number;
  location?: string;
  status: "active" | "pending" | "rejected";
  createdAt: string;
}

const statusConfig: Record<
  string,
  { label: string; icon: typeof Clock; class: string }
> = {
  pending: {
    label: "На модерации",
    icon: Clock,
    class: "text-amber-600 bg-amber-50 border-amber-200",
  },
  active: {
    label: "Одобрена",
    icon: CheckCircle2,
    class: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  rejected: {
    label: "Отклонена",
    icon: XCircle,
    class: "text-red-600 bg-red-50 border-red-200",
  },
};

export function PartnerActivitiesList() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/partner/login");
      return;
    }

    Promise.all([
      fetch("/api/partner/activities", {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch("/api/partner/profile", {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ])
      .then(([activitiesRes, profileRes]) => {
        if (!activitiesRes.ok) throw new Error("Ошибка загрузки активностей");
        return Promise.all([
          activitiesRes.json(),
          profileRes.ok
            ? profileRes.json()
            : Promise.resolve({ documentNumber: "" }),
        ]);
      })
      .then(([activitiesData, profileData]) => {
        setActivities(activitiesData);
        setDocumentNumber(profileData.documentNumber || "");
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-600">
        Ошибка загрузки: {error}
      </div>
    );
  }

  const filtered = search
    ? activities.filter(
        (a) =>
          a.title.toLowerCase().includes(search.toLowerCase()) ||
          (a.location || "").toLowerCase().includes(search.toLowerCase())
      )
    : activities;

  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Search className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-1 font-medium">Активностей пока нет</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Добавьте первую активность, чтобы начать
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Поиск по названию или городу..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {filtered.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          Ничего не найдено
        </div>
      )}

      {filtered.map((activity) => {
        const cfg = statusConfig[activity.status] || statusConfig.pending;
        const StatusIcon = cfg.icon;

        return (
          <div
            key={activity.id}
            className="group rounded-xl border bg-card p-4 transition-colors hover:bg-accent/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-1.5 flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.class}`}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {cfg.label}
                  </span>
                </div>
                <h3 className="font-semibold leading-tight">
                  {activity.title}
                </h3>
                {activity.shortDescription && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {activity.shortDescription}
                  </p>
                )}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  {activity.location && <span>{activity.location}</span>}
                  <span>{activity.price.toLocaleString()} ₽</span>
                  <span>
                    {new Date(activity.createdAt).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                {documentNumber && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-primary">
                    <Award className="h-3 w-3" />
                    <span>Аттестат: {documentNumber}</span>
                  </div>
                )}
              </div>
              {activity.status === "active" && (
                <a
                  href={`/activities/${activity.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-primary"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
